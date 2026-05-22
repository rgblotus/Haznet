import { useState, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient, skipToken } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '@/services/api'
import PageLayout from '@/components/PageLayout'
import { Button, Badge, toast } from '@/components/ui'
import { FadeIn } from '@/components/ui/AnimatedList'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuthStore, canEditRequisition, canSubmitRequisition, canReviewRequisition, canReturnRequisition, canAssignToProcurement, canProcessRequisition, canCompleteRequisition } from '@/stores/authStore'
import type { ActivityLog } from '@/types/models'
import type { IconType } from '@/types/common'
import DocumentsSection from '@/components/shared/DocumentsSection'
import {
  ArrowLeft, FileText, Clock, CheckCircle, Send,
  Edit, Package, DollarSign, Calendar,
  RotateCcw, Forward, Shield, Trash2, Award, ClipboardList,
  History, Building2, FileCheck,
  GitBranch, Paperclip, Settings, Info, Zap
} from 'lucide-react'

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
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function InfoBadge({ icon: Icon, label, value, color = 'indigo' }: { icon: IconType; label: string; value: string | number | null | undefined; color?: string }) {
  const colors: Record<string, { bg: string; border: string; icon: string; text: string }> = {
    indigo: { bg: 'from-indigo-50 to-violet-50', border: 'border-indigo-100', icon: 'text-indigo-500', text: 'text-indigo-700' },
    emerald: { bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-100', icon: 'text-emerald-500', text: 'text-emerald-700' },
    amber: { bg: 'from-amber-50 to-amber-100', border: 'border-amber-100', icon: 'text-amber-500', text: 'text-amber-700' },
    violet: { bg: 'from-violet-50 to-purple-50', border: 'border-violet-100', icon: 'text-violet-500', text: 'text-violet-700' },
    cyan: { bg: 'from-cyan-50 to-cyan-100', border: 'border-cyan-100', icon: 'text-cyan-500', text: 'text-cyan-700' },
    slate: { bg: 'from-slate-50 to-slate-100', border: 'border-slate-200', icon: 'text-slate-400', text: 'text-slate-600' },
  }
  const c = colors[color] || colors.indigo
  return (
    <div className={cn('p-4 rounded-2xl border bg-gradient-to-br flex items-center gap-4', c.bg, c.border)}>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm', c.icon)}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className={cn('text-sm font-bold', c.text)}>{value || '-'}</p>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: IconType; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative',
        active 
          ? 'bg-indigo-50 text-indigo-700' 
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      )}
    >
      <Icon size={16} />
      {label}
      {count !== undefined && (
        <span className={cn('px-1.5 py-0.5 rounded-full text-xs', active ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-600')}>
          {count}
        </span>
      )}
      {active && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />}
    </button>
  )
}

function StatusStep({ label, status, icon: Icon, isActive, isPast }: { label: string; status: string; icon: IconType; isActive?: boolean; isPast?: boolean }) {
  const statusStyles = {
    completed: 'bg-emerald-500 text-white',
    current: 'bg-amber-500 text-white animate-pulse',
    pending: 'bg-slate-200 text-slate-400',
  }
  
  return (
    <div className={cn('flex items-center gap-3', isPast && 'opacity-60')}>
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', isPast ? 'bg-emerald-500' : isActive ? 'bg-amber-500' : 'bg-slate-200')}>
        {isPast ? <CheckCircle size={14} className="text-white" /> : isActive ? <Clock size={12} className="text-white" /> : <Icon size={12} className="text-slate-400" />}
      </div>
      <div className="flex-1">
        <p className={cn('text-sm font-medium', isPast ? 'text-emerald-700' : isActive ? 'text-amber-700' : 'text-slate-400')}>{label}</p>
        <p className="text-xs text-slate-400 capitalize">{status}</p>
      </div>
    </div>
  )
}

export default function RequisitionDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const user = useAuthStore((s) => s.user)
  const role = user?.role || 'indentor'

  const queryClient = useQueryClient()

  const { data: req, isLoading } = useQuery({
    queryKey: ['requisition', id],
    queryFn: () => api.requisitions.get(id!),
    enabled: !!id,
  })

  const tenderId = req?.tender_id
  const { data: tender } = useQuery({
    queryKey: ['requisition-tender', id, tenderId],
    queryFn: () => api.tenders.get(tenderId!),
    enabled: !!tenderId,
  })

  const bidTenderId = tender?.id
  const { data: bids = [] } = useQuery({
    queryKey: ['requisition-bids', bidTenderId],
    queryFn: () => api.tenders.getBids(bidTenderId!),
    enabled: !!bidTenderId,
  })

  const { data: activityLogs = [] } = useQuery({
    queryKey: ['requisition-logs', id],
    queryFn: () => api.requisitions.getActivity(id!),
    enabled: !!id,
  })

  const isCreator = req?.creator_id === user?.id

  const tabs = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'workflow', label: 'Workflow', icon: GitBranch },
    { id: 'documents', label: 'Documents', icon: Paperclip },
    { id: 'activity', label: 'Activity', icon: History, count: activityLogs.length },
  ], [activityLogs.length])

  const handleAction = useCallback(async (action: string) => {
    if (!id) return
    setActionLoading(action)
    try {
      switch (action) {
        case 'submit': await api.requisitions.submit(id); break
        case 'review': await api.requisitions.review(id, { reason: returnReason || undefined }); break
        case 'return': await api.requisitions.returnReq(id, { reason: returnReason || 'Returned for clarification' }); break
        case 'assign': await api.requisitions.assignToProcurement(id); break
        case 'process': await api.requisitions.process(id); break
        case 'complete': await api.requisitions.complete(id); break
        case 'delete': await api.requisitions.delete(id); navigate('/requisitions'); return
      }
      queryClient.invalidateQueries({ queryKey: ['requisition', id] })
      setShowReturnModal(false)
      setReturnReason('')
    } catch (err) { const msg = err instanceof Error ? err.message : 'Action failed'; console.error(err); toast({ type: 'error', title: msg }) }
    finally { setActionLoading(null) }
  }, [id, navigate, returnReason, queryClient])

  if (isLoading) {
    return <PageLayout title="Loading"><div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></PageLayout>
  }
  if (!req) return <PageLayout title="Not Found"><div className="text-center py-20 text-slate-400">Requisition not found</div></PageLayout>

  const canEdit = canEditRequisition(role, req.status, isCreator)
  const canSubmit = canSubmitRequisition(role, req.status, isCreator)
  const canReview = canReviewRequisition(role) && ['submitted', 'under_review'].includes(req.status)
  const canReturn = canReturnRequisition(role) && !['draft', 'returned', 'completed', 'cancelled'].includes(req.status)
  const canAssign = canAssignToProcurement(role) && ['submitted', 'under_review'].includes(req.status)
  const canProcess = canProcessRequisition(role) && ['processing', 'under_review'].includes(req.status)
  const canComplete = canCompleteRequisition(role) && ['order_created', 'receiving', 'inspection_pending'].includes(req.status)

  const workflowSteps = [
    { label: 'Requisition Created', status: 'completed', icon: FileText },
    { label: 'Submitted for Review', status: req.status !== 'draft' ? 'completed' : 'pending', icon: Send },
    { label: 'Internal Approval', status: ['submitted', 'under_review'].includes(req.status) ? 'current' : (['processing', 'tender_awaiting', 'tender_created', 'tender_awarded', 'order_created', 'completed'].includes(req.status) ? 'completed' : 'pending'), icon: Shield },
    { label: 'Tender Process', status: ['tender_awaiting', 'tender_created'].includes(req.status) ? 'current' : (['tender_awarded', 'order_created', 'completed'].includes(req.status) ? 'completed' : 'pending'), icon: ClipboardList },
    { label: 'Bid Evaluation', status: req.status === 'tender_awarded' ? 'current' : 'pending', icon: FileCheck },
    { label: 'Order & Contract', status: ['order_created', 'completed'].includes(req.status) ? 'current' : 'pending', icon: Award },
    { label: 'Completed', status: req.status === 'completed' ? 'completed' : 'pending', icon: CheckCircle },
  ]

  return (
    <PageLayout
      title={req.file_reference || 'Requisition Details'}
      actions={
        <div className="flex items-center gap-3">
          <Link to="/requisitions" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all shadow-sm">
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 lg:p-8">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500 rounded-full blur-3xl" />
          </div>
          <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {req.file_reference && (
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-mono font-bold rounded-full border border-amber-500/30">
                    {req.file_reference}
                  </span>
                )}
                <span className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-full backdrop-blur-sm border border-white/20">
                  {req.requisition_no}
                </span>
                <Badge variant={priorityBadgeColors[req.priority] || 'neutral'} className="font-semibold bg-white/20 text-white border-0">
                  {req.priority} Priority
                </Badge>
                <Badge variant={statusBadgeColors[req.status] || 'default'} className="font-semibold" dot>
                  {req.status?.replace(/_/g, ' ')}
                </Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                {req.title || req.job_description || 'Requisition'}
              </h1>
              {req.job_description && <p className="text-slate-300 text-sm max-w-2xl">{req.job_description}</p>}
            </div>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="text-center px-6 py-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                <p className="text-xs text-slate-400 mb-1">Estimated</p>
                <p className="text-xl font-bold text-white">₹{(req.total_estimate || req.cost_estimate || 0).toLocaleString()}</p>
              </div>
              <div className="text-center px-6 py-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                <p className="text-xs text-slate-400 mb-1">Quantity</p>
                <p className="text-xl font-bold text-white">{req.quantity || '-'}</p>
              </div>
              {tender && (
                <div className="text-center px-6 py-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                  <p className="text-xs text-slate-400 mb-1">Tender</p>
                  <p className="text-xl font-bold text-emerald-400">{tender.tender_no}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {tabs.map(tab => (
            <TabButton key={tab.id} {...tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Info Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <InfoBadge icon={Package} label="Category" value={req.category} color="indigo" />
                    <InfoBadge icon={DollarSign} label="Cost Estimate" value={req.cost_estimate ? `₹${req.cost_estimate.toLocaleString()}` : '-'} color="emerald" />
                    <InfoBadge icon={Calendar} label="Required By" value={formatDate(req.required_by_date)} color="amber" />
                    <InfoBadge icon={Building2} label="Department" value="Contract & Procurement" color="violet" />
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Zap size={16} className="text-amber-500" /> Financial Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Financial Year</span><span className="text-sm font-semibold text-slate-700">{req.financial_year || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-500">SAP Req No.</span><span className="text-sm font-mono font-semibold text-slate-700">{req.sap_requisition_number || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Contract Period</span><span className="text-sm font-semibold text-slate-700">{req.contract_period_months ? `${req.contract_period_months} months` : '-'}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Integrity Pact</span><span className="text-sm font-semibold text-slate-700">{req.integrity_pact ? 'Required' : 'Not Required'}</span></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Settings size={16} className="text-violet-500" /> Approval Status
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between"><span className="text-sm text-slate-500">HOD/CNP Approval</span><span className={cn('text-sm font-semibold px-2 py-0.5 rounded-full', req.hodi_cnp_approval === 'Approved' ? 'bg-emerald-100 text-emerald-700' : req.hodi_cnp_approval === 'Returned' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>{req.hodi_cnp_approval || 'Pending'}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Inventory Check</span><span className="text-sm font-semibold text-slate-700">{req.inventory_check_status || 'Not Checked'}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Procurement Method</span><span className="text-sm font-semibold text-slate-700">{req.procurement_method || 'Not Set'}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Startup Applicable</span><span className="text-sm font-semibold text-slate-700">{req.startup_applicable ? 'Yes' : 'No'}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                  {/* Actions */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Actions</h3>
                    <div className="space-y-2">
                      {canSubmit && <ActionButton icon={Send} label="Submit to CNP" color="indigo" onClick={() => handleAction('submit')} loading={actionLoading === 'submit'} />}
                      {canReview && <ActionButton icon={Shield} label="Review & Approve" color="emerald" onClick={() => handleAction('review')} loading={actionLoading === 'review'} />}
                      {canAssign && <ActionButton icon={Forward} label="Assign to PO" color="violet" onClick={() => handleAction('assign')} loading={actionLoading === 'assign'} />}
                      {canProcess && <ActionButton icon={Clock} label="Process" color="amber" onClick={() => handleAction('process')} loading={actionLoading === 'process'} />}
                      {canComplete && <ActionButton icon={CheckCircle} label="Complete" color="emerald" onClick={() => handleAction('complete')} loading={actionLoading === 'complete'} />}
                      {canEdit && <LinkButton icon={Edit} label="Edit Details" to={`/requisitions/${id}/edit`} />}
                      {canReturn && <ActionButton icon={RotateCcw} label="Return" color="amber" onClick={() => setShowReturnModal(true)} />}
                      {(role === 'admin' || role === 'procurement_officer') && req.status !== 'completed' && <ActionButton icon={Trash2} label="Delete" color="red" onClick={() => { if (confirm('Delete this requisition?')) handleAction('delete') }} />}
                    </div>
                  </div>

                  {/* Tender Info */}
                  {tender && (
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-700 mb-4">Linked Tender</h3>
                      <Link to={`/tenders/${tender.id}`} className="block p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-violet-600">{tender.tender_no}</span>
                          <Badge variant={tender.status === 'awarded' ? 'success' : tender.status === 'bidding' ? 'warning' : 'default'}>{tender.status}</Badge>
                        </div>
                        <p className="text-sm font-semibold text-slate-700 truncate">{tender.title}</p>
                      </Link>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Important Dates</h3>
                    <div className="space-y-3">
                      <DateRow label="Created" date={req.created_at} />
                      <DateRow label="Req. Create Date" date={req.requisition_create_date} />
                      <DateRow label="HOD Release" date={req.requisition_hod_release_date} />
                      <DateRow label="Required By" date={req.required_by_date} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'workflow' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Requisition Workflow</h3>
                <div className="space-y-4">
                  {workflowSteps.map((step, idx) => (
                    <StatusStep key={idx} {...step} isActive={step.status === 'current'} isPast={step.status === 'completed'} />
                  ))}
                </div>
                
                {/* Progress Bar */}
                <div className="mt-8 p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Overall Progress</span>
                    <span className="text-sm font-bold text-slate-700">{Math.round((workflowSteps.filter(s => s.status === 'completed').length / workflowSteps.length) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(workflowSteps.filter(s => s.status === 'completed').length / workflowSteps.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <DocumentsSectionWrapper requisitionId={id || ''} tenderId={tender?.id} status={req.status} role={role} />
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Activity Log</h3>
                {activityLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">No activity yet</div>
                ) : (
                  <div className="space-y-3">
                    {activityLogs.map((log, idx) => {
                      const style = actionColors[log.action] || actionColors.updated
                      return (
                        <motion.div 
                          key={log.id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={cn('p-4 rounded-xl border flex items-start gap-4', style.bg, style.border)}
                        >
                          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', style.icon)}>
                            <History size={16} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('font-semibold text-sm capitalize', style.text)}>{log.action.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{log.details}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                              <span>{log.user_name}</span>
                              <span>•</span>
                              <span>{formatDateTime(log.created_at)}</span>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
        </motion.div>
      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Return Requisition</h3>
            <p className="text-sm text-slate-500 mb-4">Provide a reason for returning this requisition.</p>
            <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none" rows={4} placeholder="Enter reason..." />
            <div className="flex gap-3 mt-5">
              <Button variant="secondary" onClick={() => { setShowReturnModal(false); setReturnReason('') }} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={() => handleAction('return')} loading={actionLoading === 'return'} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500">Return</Button>
            </div>
          </motion.div>
        </div>
      )}
    </PageLayout>
  )
}

function ActionButton({ icon: Icon, label, color, onClick, loading }: { icon: IconType; label: string; color: string; onClick: () => void; loading?: boolean }) {
  const colors: Record<string, string> = {
    indigo: 'from-indigo-50 to-violet-50 text-indigo-700 border-indigo-200 hover:border-indigo-300',
    emerald: 'from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200 hover:border-emerald-300',
    violet: 'from-violet-50 to-violet-100 text-violet-700 border-violet-200 hover:border-violet-300',
    amber: 'from-amber-50 to-amber-100 text-amber-700 border-amber-200 hover:border-amber-300',
    red: 'from-red-50 to-red-100 text-red-700 border-red-200 hover:border-red-300',
  }
  return (
    <button onClick={onClick} disabled={loading} className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:shadow-md disabled:opacity-50', colors[color])}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color === 'indigo' ? 'bg-indigo-500' : color === 'emerald' ? 'bg-emerald-500' : color === 'violet' ? 'bg-violet-500' : color === 'amber' ? 'bg-amber-500' : 'bg-red-500')}>
        <Icon size={14} className="text-white" />
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  )
}

function LinkButton({ icon: Icon, label, to }: { icon: IconType; label: string; to: string }) {
  return (
    <Link to={to} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border from-cyan-50 to-cyan-100 text-cyan-700 border-cyan-200 hover:border-cyan-300 transition-all hover:shadow-md">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500"><Icon size={14} className="text-white" /></div>
      <span className="text-sm font-semibold">{label}</span>
    </Link>
  )
}

function DateRow({ label, date }: { label: string; date: string | null | undefined }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-700">{formatDate(date)}</span>
    </div>
  )
}

function DocumentsSectionWrapper({ requisitionId, tenderId, status, role }: { requisitionId: string; tenderId?: string | null; status: string; role: string }) {
  return <DocumentsSection requisitionId={requisitionId} tenderId={tenderId} orderId={null} bidId={null} status={status} role={role} />
}