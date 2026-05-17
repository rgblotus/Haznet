import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/services/api'
import PageLayout from '@/components/PageLayout'
import { Button, Badge, Card } from '@/components/ui'
import StatusTimeline from '@/components/shared/StatusTimeline'
import { FadeIn } from '@/components/ui/AnimatedList'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, FileText, Clock, CheckCircle, AlertCircle, User, Send, 
  MessageSquare, Edit, Package, DollarSign, Calendar, 
  RotateCcw, Forward, Shield, Trash2, Award, ClipboardList 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore, canEditRequisition, canSubmitRequisition, canReviewRequisition, canReturnRequisition, canAssignToProcurement, canProcessRequisition, canDeleteRequisition, canCompleteRequisition } from '@/stores/authStore'

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

export default function RequisitionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [req, setReq] = useState<any | null>(null)
  const [tender, setTender] = useState<any | null>(null)
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  
  const user = useAuthStore((s) => s.user)
  const role = user?.role || 'indentor'
  const isCreator = req?.creator_id === user?.id

  useEffect(() => {
    if (!id) return
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
      <div className="grid grid-cols-[1fr_320px] gap-6">
        <div>
          <FadeIn>
            {/* Header Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 mb-6 shadow-lg shadow-slate-200/10">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 mb-2"
                  >
                    <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold rounded-full">{req.requisition_no}</span>
                  </motion.div>
                  <h1 className="text-2xl font-bold text-slate-800">{req.title || req.job_description?.slice(0, 50) || 'Requisition'}</h1>
                </div>
                <div className="flex gap-2">
                  <Badge variant={priorityBadgeColors[req.priority] || 'neutral'} className="font-semibold">
                    {req.priority} Priority
                  </Badge>
                  <Badge variant={statusBadgeColors[req.status] || 'default'} className="font-semibold" dot>
                    {req.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-4 gap-4 pt-5 border-t border-slate-100/50">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Package size={14} className="text-indigo-500" />
                    <p className="text-xs text-slate-400">Category</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{req.category || '-'}</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={14} className="text-emerald-500" />
                    <p className="text-xs text-slate-400">Estimated Amount</p>
                  </div>
                  <p className="text-sm font-bold text-slate-700">${req.total_estimate?.toLocaleString() || '0'}</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User size={14} className="text-amber-500" />
                    <p className="text-xs text-slate-400">Requested By</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">User #{req.creator_id?.slice(0, 8)}</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={14} className="text-violet-500" />
                    <p className="text-xs text-slate-400">Created Date</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{req.created_at ? new Date(req.created_at).toLocaleDateString() : '-'}</p>
                </motion.div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            {/* Description Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 mb-6 shadow-lg shadow-slate-200/10">
              <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-indigo-500" />
                Description
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">{req.description || req.job_description || 'No description provided.'}</p>
            </div>
          </FadeIn>

          {/* Details Card */}
          <FadeIn delay={0.2}>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 shadow-lg shadow-slate-200/10">
              <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Package size={18} className="text-violet-500" />
                Details
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Financial Year</p>
                  <p className="font-semibold text-slate-700">{req.financial_year || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">SAP Requisition Number</p>
                  <p className="font-semibold text-slate-700 font-mono">{req.sap_requisition_number || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Create Date</p>
                  <p className="font-semibold text-slate-700">{req.requisition_create_date ? new Date(req.requisition_create_date).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">HoD Release Date</p>
                  <p className="font-semibold text-slate-700">{req.requisition_hod_release_date ? new Date(req.requisition_hod_release_date).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Quantity</p>
                  <p className="font-semibold text-slate-700">{req.quantity || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Cost Estimate</p>
                  <p className="font-semibold text-slate-700">₹{req.cost_estimate?.toLocaleString() || req.total_estimate?.toLocaleString() || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Contract Period</p>
                  <p className="font-semibold text-slate-700">{req.contract_period_months ? `${req.contract_period_months} months` : '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Startup Applicable</p>
                  <p className="font-semibold text-slate-700">{req.startup_applicable ? 'Yes' : 'No'}</p>
                </div>
                {req.startup_applicable && (
                  <>
                    <div>
                      <p className="text-slate-400 text-xs">Industry</p>
                      <p className="font-semibold text-slate-700">{req.industry || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Sector</p>
                      <p className="font-semibold text-slate-700">{req.sector || '-'}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-slate-400 text-xs">Integrity Pact</p>
                  <p className={cn('font-semibold', req.integrity_pact ? 'text-amber-600' : 'text-slate-700')}>{req.integrity_pact ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Required By</p>
                  <p className="font-semibold text-slate-700">{req.required_by_date ? new Date(req.required_by_date).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Job Description Card */}
          {req.job_description && (
            <FadeIn delay={0.25}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 mb-6 shadow-lg shadow-slate-200/10">
                <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <ClipboardList size={18} className="text-emerald-500" />
                  Job Description
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">{req.job_description}</p>
              </div>
            </FadeIn>
          )}

          {/* File Reference Card */}
          {req.file_reference && (
            <FadeIn delay={0.3}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 mb-6 shadow-lg shadow-slate-200/10">
                <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-amber-500" />
                  File Reference
                </h2>
                <div className="p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200">
                  <p className="text-sm font-bold text-slate-700 font-mono">{req.file_reference}</p>
                </div>
              </div>
            </FadeIn>
          )}

          {/* Return Reason Alert */}
          {req.status === 'returned' && req.return_reason && (
            <FadeIn delay={0.25}>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
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
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions - Role Based */}
          <FadeIn>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-100/50">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</h2>
              </div>
              <div className="p-3 space-y-2">
                {canSubmit && (
                  <button
                    onClick={() => handleAction('submit')}
                    disabled={actionLoading === 'submit'}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-indigo-200 disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm">
                      <Forward size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-semibold">Submit to CNP</span>
                  </button>
                )}
                {canReview && (
                  <button
                    onClick={() => handleAction('review')}
                    disabled={actionLoading === 'review'}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-emerald-200 disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                      <Shield size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-semibold">Review & Approve</span>
                  </button>
                )}
                {canAssign && (
                  <button
                    onClick={() => handleAction('assign')}
                    disabled={actionLoading === 'assign'}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-50 to-violet-100/50 text-violet-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-violet-200 disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-sm">
                      <Forward size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-semibold">Assign to PO</span>
                  </button>
                )}
                {canProcess && (
                  <button
                    onClick={() => handleAction('process')}
                    disabled={actionLoading === 'process'}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-amber-200 disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
                      <Clock size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-semibold">Process</span>
                  </button>
                )}
                {canComplete && (
                  <button
                    onClick={() => handleAction('complete')}
                    disabled={actionLoading === 'complete'}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-emerald-200 disabled:opacity-50"
                  >
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
                  <button
                    onClick={() => setShowReturnModal(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-amber-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
                      <RotateCcw size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-semibold">Return</span>
                  </button>
                )}
                {(role === 'indentor' && isCreator && (req.status === 'draft' || req.status === 'returned')) && (
                  <button
                    onClick={() => { if (confirm('Cancel this requisition?')) handleAction('delete') }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-red-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
                      <Trash2 size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-semibold">Cancel</span>
                  </button>
                )}
                {canDelete && req.status !== 'completed' && (
                  <button
                    onClick={() => { if (confirm('Delete this requisition?')) handleAction('delete') }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-red-200"
                  >
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

          {/* Status Timeline */}
          <FadeIn delay={0.1}>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="p-3 bg-gradient-to-r from-indigo-500/5 to-violet-500/5 border-b border-slate-100/50">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</h2>
              </div>
              <div className="p-3">
                <StatusTimeline steps={statusFlow} currentIndex={currentStatusIndex >= 0 ? currentStatusIndex : 0} variant="primary" />
              </div>
            </div>
          </FadeIn>

          {/* Workflow Quick Stats */}
          <FadeIn delay={0.15}>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="p-3 bg-gradient-to-r from-violet-500/5 to-purple-500/5 border-b border-slate-100/50">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Workflow</h2>
              </div>
              <div className="p-3 space-y-1.5">
                {[
                  { label: 'Approval', value: req.hodi_cnp_approval || 'Pending', color: req.hodi_cnp_approval === 'Approved' ? 'emerald' : req.hodi_cnp_approval === 'Returned' ? 'red' : 'amber' },
                  { label: 'Inventory', value: req.inventory_check_status || 'N/A', color: req.inventory_check_status === 'Available' || req.inventory_check_status === 'Surplus' ? 'emerald' : 'slate' },
                  { label: 'Method', value: req.procurement_method || '-', color: 'slate' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50/50 transition-colors">
                    <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                    <span className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded-md',
                      item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                      item.color === 'red' ? 'bg-red-50 text-red-600' :
                      item.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                      'bg-slate-50 text-slate-600'
                    )}>
                      {item.value}
                    </span>
                  </div>
                ))}
                {req.assigned_to_procurement && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50">
                    <span className="text-xs text-emerald-600 font-medium">Assigned</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">Yes</span>
                  </div>
                )}
              </div>
            </div>
          </FadeIn>

          {/* Tender Tracking for Indentor */}
          {role === 'indentor' && isCreator && req.tender_id && tender && (
            <FadeIn delay={0.2}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
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

      {/* Return Modal */}
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
