import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/services/api'
import PageLayout from '@/components/PageLayout'
import { Button, Badge, Card } from '@/components/ui'
import StatusTimeline from '@/components/shared/StatusTimeline'
import { FadeIn } from '@/components/ui/AnimatedList'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuthStore, canEditRequisition, canSubmitRequisition, canReviewRequisition, canReturnRequisition, canAssignToProcurement, canProcessRequisition, canDeleteRequisition, canCompleteRequisition } from '@/stores/authStore'
import type { ActivityLog } from '@/types/models'
import {
  ArrowLeft, FileText, Clock, CheckCircle, AlertCircle, User, Send,
  MessageSquare, Edit, Package, DollarSign, Calendar,
  RotateCcw, Forward, Shield, Trash2, Award, ClipboardList,
  Activity, History, ChevronDown
} from 'lucide-react'

const statusFlow = [
  { key: 'draft', label: 'Draft', icon: FileText },
  { key: 'submitted', label: 'Submitted', icon: Send },
  { key: 'under_review', label: 'Under Review', icon: AlertCircle },
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'tender_created', label: 'Tender Created', icon: ClipboardList },
  { key: 'tender_awarded', label: 'Tender Awarded', icon: Award },
  { key: 'order_created', label: 'Order Created', icon: CheckCircle },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
]

const statusBadgeColors: Record<string, string> = {
  draft: 'neutral',
  submitted: 'default',
  under_review: 'warning',
  returned: 'danger',
  processing: 'info',
  tender_created: 'violet',
  tender_awarded: 'success',
  order_created: 'success',
  completed: 'success',
  cancelled: 'danger',
}

const priorityBadgeColors: Record<string, string> = {
  High: 'danger',
  Medium: 'warning',
  Low: 'neutral',
}

const actionColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  created: { bg: 'from-slate-50 to-slate-100', border: 'border-slate-200', text: 'text-slate-700', icon: 'bg-slate-500' },
  submitted: { bg: 'from-indigo-50 to-indigo-100', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'bg-indigo-500' },
  reviewed: { bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'bg-emerald-500' },
  returned: { bg: 'from-amber-50 to-amber-100', border: 'border-amber-200', text: 'text-amber-700', icon: 'bg-amber-500' },
  assigned: { bg: 'from-violet-50 to-violet-100', border: 'border-violet-200', text: 'text-violet-700', icon: 'bg-violet-500' },
  processing: { bg: 'from-cyan-50 to-cyan-100', border: 'border-cyan-200', text: 'text-cyan-700', icon: 'bg-cyan-500' },
  completed: { bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'bg-emerald-500' },
  updated: { bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', text: 'text-blue-700', icon: 'bg-blue-500' },
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function InfoCard({ icon: Icon, label, value, color = 'indigo' }: { icon: any; label: string; value: string | number | null | undefined; color?: string }) {
  const colorClasses: Record<string, string> = {
    indigo: 'from-indigo-50 to-violet-50',
    emerald: 'from-emerald-50 to-emerald-100',
    amber: 'from-amber-50 to-amber-100',
    violet: 'from-violet-50 to-violet-100',
    cyan: 'from-cyan-50 to-cyan-100',
    slate: 'from-slate-50 to-slate-100',
  }
  const iconColors: Record<string, string> = {
    indigo: 'text-indigo-500',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    violet: 'text-violet-500',
    cyan: 'text-cyan-500',
    slate: 'text-slate-500',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('p-4 rounded-xl bg-gradient-to-br', colorClasses[color] || colorClasses.indigo)}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={iconColors[color] || iconColors.indigo} />
        <p className="text-xs text-slate-400 font-medium">{label}</p>
      </div>
      <p className="text-sm font-semibold text-slate-700 truncate">{value || '-'}</p>
    </motion.div>
  )
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 px-4 rounded-lg hover:bg-slate-50/50 transition-colors">
      <p className="text-slate-400 text-xs font-medium mb-1">{label}</p>
      <p className="font-semibold text-slate-700 text-sm">{value}</p>
    </div>
  )
}

export default function RequisitionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [req, setReq] = useState<any | null>(null)
  const [tender, setTender] = useState<any | null>(null)
  const [bids, setBids] = useState<any[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [showActivityLog, setShowActivityLog] = useState(true)
  const [returnReason, setReturnReason] = useState('')

  const user = useAuthStore((s) => s.user)
  const role = user?.role || 'indentor'
  const isCreator = req?.creator_id === user?.id

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.requisitions.get(id)
      .then((data) => {
        setReq(data)
        if (data.tender_id) {
          api.tenders.get(data.tender_id).then(setTender).catch(() => {})
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    setActivityLoading(true)
    api.requisitions.getActivity(id)
      .then(setActivityLogs)
      .catch(console.error)
      .finally(() => setActivityLoading(false))
  }, [id, req?.status])

  useEffect(() => {
    if (tender?.id) {
      api.tenders.getBids(tender.id).then(setBids).catch(() => {})
    }
  }, [tender?.id])

  const currentStatusIndex = statusFlow.findIndex(s => s.key === req?.status)

  const handleAction = async (action: string) => {
    if (!id) return
    setActionLoading(action)
    try {
      let res
      switch (action) {
        case 'submit':
          res = await api.requisitions.submit(id)
          break
        case 'review':
          res = await api.requisitions.review(id, { reason: returnReason || undefined })
          break
        case 'return':
          res = await api.requisitions.returnReq(id, { reason: returnReason || 'Returned for clarification' })
          break
        case 'assign':
          res = await api.requisitions.assignToProcurement(id)
          break
        case 'process':
          res = await api.requisitions.process(id)
          break
        case 'complete':
          res = await api.requisitions.complete(id)
          break
        case 'delete':
          res = await api.requisitions.delete(id)
          window.location.href = '/requisitions'
          return
      }
      if (res) setReq(res)
      setShowReturnModal(false)
      setReturnReason('')
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return <PageLayout title="Requisition Details"><div className="flex items-center justify-center h-[60vh] skeleton text-slate-400">Loading...</div></PageLayout>
  }

  if (!req) {
    return (
      <PageLayout title="Requisition Details">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
            <FileText size={40} className="text-slate-300" />
          </div>
          <p className="text-slate-500 mb-4 font-medium">Requisition not found</p>
          <Link to="/requisitions" className="text-indigo-500 no-underline flex items-center gap-2 hover:text-indigo-600 transition-colors font-medium">
            <ArrowLeft size={16} /> Back to Requisitions
          </Link>
        </div>
      </PageLayout>
    )
  }

  const canEdit = canEditRequisition(role, req.status, isCreator)
  const canSubmit = canSubmitRequisition(role, req.status, isCreator)
  const canReview = canReviewRequisition(role) && ['submitted', 'under_review'].includes(req.status)
  const canReturn = canReturnRequisition(role) && !['draft', 'returned', 'completed', 'cancelled'].includes(req.status)
  const canAssign = canAssignToProcurement(role) && ['submitted', 'under_review'].includes(req.status)
  const canProcess = canProcessRequisition(role) && ['processing', 'under_review'].includes(req.status)
  const canComplete = canCompleteRequisition(role) && ['order_created', 'receiving', 'inspection_pending'].includes(req.status)
  const canDelete = canDeleteRequisition(role)

  const estimatedAmount = req.total_estimate || req.cost_estimate

  return (
    <PageLayout
      title={`Requisition ${req.requisition_no}`}
      actions={
        <div className="flex items-center gap-3">
          <Link to="/requisitions" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <FadeIn>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 shadow-lg shadow-slate-200/10">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold rounded-full shadow-sm">
                    {req.requisition_no}
                  </span>
                  <Badge variant={priorityBadgeColors[req.priority] || 'neutral'} className="font-semibold">
                    {req.priority} Priority
                  </Badge>
                  <Badge variant={statusBadgeColors[req.status] || 'default'} className="font-semibold" dot>
                    {req.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-800 leading-tight">
                  {req.title || req.job_description?.slice(0, 60) || 'Requisition'}
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoCard icon={Package} label="Category" value={req.category} color="indigo" />
              <InfoCard icon={DollarSign} label="Estimated Amount" value={estimatedAmount ? `₹${estimatedAmount.toLocaleString()}` : '-'} color="emerald" />
              <InfoCard icon={Calendar} label="Required By" value={formatDate(req.required_by_date)} color="amber" />
              <InfoCard icon={User} label="Created" value={formatDate(req.created_at)} color="violet" />
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 space-y-5">
            <FadeIn delay={0.1}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 shadow-lg shadow-slate-200/10">
                <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-indigo-500" />
                  Description
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">
                  {req.description || req.job_description || 'No description provided.'}
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 shadow-lg shadow-slate-200/10">
                <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <ClipboardList size={18} className="text-violet-500" />
                  Requisition Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  <DetailItem label="Financial Year" value={req.financial_year || '-'} />
                  <DetailItem label="SAP Requisition Number" value={req.sap_requisition_number || '-'} />
                  <DetailItem label="Requisition Create Date" value={formatDate(req.requisition_create_date)} />
                  <DetailItem label="HoD Release Date" value={formatDate(req.requisition_hod_release_date)} />
                  <DetailItem label="Quantity" value={req.quantity || '-'} />
                  <DetailItem label="Cost Estimate" value={req.cost_estimate ? `₹${req.cost_estimate.toLocaleString()}` : '-'} />
                  <DetailItem label="Contract Period" value={req.contract_period_months ? `${req.contract_period_months} months` : '-'} />
                  <DetailItem label="Startup Applicable" value={req.startup_applicable ? 'Yes' : 'No'} />
                  {req.startup_applicable && (
                    <>
                      <DetailItem label="Industry" value={req.industry || '-'} />
                      <DetailItem label="Sector" value={req.sector || '-'} />
                    </>
                  )}
                  <DetailItem label="Integrity Pact" value={req.integrity_pact ? 'Yes' : 'No'} />
                  {req.file_reference && (
                    <div className="py-3 px-4 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200">
                      <p className="text-amber-600 text-xs font-medium mb-1">File Reference</p>
                      <p className="font-mono font-bold text-amber-700 text-sm">{req.file_reference}</p>
                    </div>
                  )}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 shadow-lg shadow-slate-200/10">
                <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Shield size={18} className="text-emerald-500" />
                  Workflow Status
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100">
                    <p className="text-xs text-slate-400 font-medium mb-2">Approval Status</p>
                    <span className={cn(
                      'inline-block px-3 py-1 rounded-full text-xs font-bold',
                      req.hodi_cnp_approval === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      req.hodi_cnp_approval === 'Returned' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    )}>
                      {req.hodi_cnp_approval || 'Pending'}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100">
                    <p className="text-xs text-slate-400 font-medium mb-2">Inventory Check</p>
                    <span className={cn(
                      'inline-block px-3 py-1 rounded-full text-xs font-bold',
                      req.inventory_check_status === 'Available' ? 'bg-emerald-100 text-emerald-700' :
                      req.inventory_check_status === 'Surplus' ? 'bg-cyan-100 text-cyan-700' :
                      'bg-slate-100 text-slate-600'
                    )}>
                      {req.inventory_check_status || 'Not Checked'}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100">
                    <p className="text-xs text-slate-400 font-medium mb-2">Procurement Method</p>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700">
                      {req.procurement_method || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </FadeIn>

            {req.status === 'returned' && req.return_reason && (
              <FadeIn delay={0.25}>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold text-amber-800">Returned for Clarification</h3>
                      <p className="text-sm text-amber-700 mt-1">{req.return_reason}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            )}

            <FadeIn delay={0.25}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowActivityLog(!showActivityLog)}
                  className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100/80 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                      <History size={16} className="text-white" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-sm font-bold text-slate-700">Activity Logs</h2>
                      <p className="text-xs text-slate-400">{activityLogs.length} entries</p>
                    </div>
                  </div>
                  <ChevronDown size={18} className={cn('text-slate-400 transition-transform', showActivityLog ? 'rotate-180' : '')} />
                </button>

                {showActivityLog && (
                  <div className="p-4 max-h-[400px] overflow-y-auto">
                    {activityLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : activityLogs.length === 0 ? (
                      <div className="text-center py-8">
                        <Activity size={32} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">No activity logs yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activityLogs.map((log, index) => {
                          const actionStyle = actionColors[log.action] || actionColors.updated
                          return (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={cn(
                                'p-3 rounded-xl bg-gradient-to-r border',
                                actionStyle.bg,
                                actionStyle.border
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', actionStyle.icon)}>
                                    <History size={12} className="text-white" />
                                  </div>
                                  <div>
                                    <p className={cn('text-sm font-semibold capitalize', actionStyle.text)}>
                                      {log.action.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {log.details || 'No details'}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-[10px] text-slate-400 font-medium">
                                    {formatDateTime(log.created_at)}
                                  </p>
                                  {log.user_name && (
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      by {log.user_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FadeIn>
          </div>

          <div className="space-y-4">
            <FadeIn delay={0.1}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-3 bg-gradient-to-r from-indigo-500/5 to-violet-500/5 border-b border-slate-100/50">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</h2>
                </div>
                <div className="p-4">
                  <StatusTimeline steps={statusFlow} currentIndex={currentStatusIndex >= 0 ? currentStatusIndex : 0} variant="primary" />
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-100/50">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</h2>
                </div>
                <div className="p-3 space-y-2">
                  {canSubmit && (
                    <button onClick={() => handleAction('submit')} disabled={actionLoading === 'submit'} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-indigo-200 disabled:opacity-50">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm">
                        <Forward size={14} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold">Submit to CNP</span>
                    </button>
                  )}
                  {canReview && (
                    <button onClick={() => handleAction('review')} disabled={actionLoading === 'review'} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-emerald-200 disabled:opacity-50">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                        <Shield size={14} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold">Review & Approve</span>
                    </button>
                  )}
                  {canAssign && (
                    <button onClick={() => handleAction('assign')} disabled={actionLoading === 'assign'} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-50 to-violet-100/50 text-violet-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-violet-200 disabled:opacity-50">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-sm">
                        <Forward size={14} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold">Assign to PO</span>
                    </button>
                  )}
                  {canProcess && (
                    <button onClick={() => handleAction('process')} disabled={actionLoading === 'process'} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-amber-200 disabled:opacity-50">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
                        <Clock size={14} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold">Process</span>
                    </button>
                  )}
                  {canComplete && (
                    <button onClick={() => handleAction('complete')} disabled={actionLoading === 'complete'} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-emerald-200 disabled:opacity-50">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                        <CheckCircle size={14} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold">Complete</span>
                    </button>
                  )}
                  {canEdit && (
                    <Link to={`/requisitions/${id}/edit`} className="no-underline">
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-50 to-cyan-100/50 text-cyan-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-cyan-200">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
                          <Edit size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold">Edit Details</span>
                      </div>
                    </Link>
                  )}
                  {canReturn && (
                    <button onClick={() => setShowReturnModal(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-amber-200">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
                        <RotateCcw size={14} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold">Return</span>
                    </button>
                  )}
                  {(role === 'indentor' && isCreator && (req.status === 'draft' || req.status === 'returned')) && (
                    <button onClick={() => { if (confirm('Cancel this requisition?')) handleAction('delete') }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-red-200">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
                        <Trash2 size={14} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold">Cancel</span>
                    </button>
                  )}
                  {canDelete && req.status !== 'completed' && (
                    <button onClick={() => { if (confirm('Delete this requisition?')) handleAction('delete') }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-red-200">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
                        <Trash2 size={14} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold">Delete</span>
                    </button>
                  )}
                  <Link to={`/message/${id}`} className="no-underline">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                        <MessageSquare size={14} className="text-slate-500" />
                      </div>
                      <span>Send Message</span>
                    </div>
                  </Link>
                </div>
              </div>
            </FadeIn>

            {role === 'indentor' && isCreator && req.tender_id && tender && (
              <FadeIn delay={0.2}>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="p-3 bg-gradient-to-r from-violet-500/5 to-purple-500/5 border-b border-slate-100/50">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tender</h2>
                  </div>
                  <div className="p-3 space-y-2">
                    <Link to={`/tenders/${tender.id}`} className="no-underline">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 hover:shadow-md transition-all">
                        <p className="text-[10px] text-violet-500 font-semibold">{tender.tender_no}</p>
                        <p className="text-xs font-bold text-slate-700 truncate">{tender.title}</p>
                      </div>
                    </Link>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50">
                      <span className="text-xs text-slate-400">Status</span>
                      <span className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-md',
                        tender.status === 'awarded' ? 'bg-emerald-50 text-emerald-600' :
                        tender.status === 'bidding' ? 'bg-indigo-50 text-indigo-600' :
                        'bg-amber-50 text-amber-600'
                      )}>
                        {tender.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {tender.status === 'awarded' && bids.length > 0 && bids.some(b => b.is_awarded) && (
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                        {bids.filter(b => b.is_awarded).map(bid => (
                          <div key={bid.id} className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-[10px] text-slate-400">Amount</span>
                              <span className="text-xs font-bold text-emerald-700">${bid.amount?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[10px] text-slate-400">Score</span>
                              <span className="text-xs font-semibold text-slate-700">{bid.total_score?.toFixed(1)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </div>

      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-2">Return Requisition</h3>
            <p className="text-sm text-slate-500 mb-4">Provide a reason for returning this requisition to the indentor.</p>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none"
              rows={4}
              placeholder="Enter reason for return..."
            />
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" onClick={() => { setShowReturnModal(false); setReturnReason('') }} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={() => handleAction('return')} loading={actionLoading === 'return'} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500">Return</Button>
            </div>
          </motion.div>
        </div>
      )}
    </PageLayout>
  )
}