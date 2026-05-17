import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/services/api'
import PageLayout from '@/components/PageLayout'
import { Button, Badge, Card } from '@/components/ui'
import StatusTimeline from '@/components/shared/StatusTimeline'
import { AnimatedList, AnimatedItem, FadeIn } from '@/components/ui/AnimatedList'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Clock, CheckCircle, AlertCircle, User, Send, MessageSquare, Edit, Printer, Package, DollarSign, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusFlow = [
  { key: 'draft', label: 'Draft', icon: FileText },
  { key: 'submitted', label: 'Submitted', icon: Send },
  { key: 'under_review', label: 'Under Review', icon: AlertCircle },
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'order_created', label: 'Order Created', icon: CheckCircle },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
]

const statusBadgeColors: Record<string, string> = {
  draft: 'neutral',
  submitted: 'default',
  under_review: 'warning',
  processing: 'info',
  order_created: 'success',
  completed: 'success',
}

const priorityBadgeColors: Record<string, string> = {
  High: 'danger',
  Medium: 'warning',
  Low: 'neutral',
}

export default function RequisitionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [req, setReq] = useState<Awaited<ReturnType<typeof api.requisitions.get>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.requisitions.get(id)
      .then(setReq)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const currentStatusIndex = statusFlow.findIndex(s => s.key === req?.status)

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

  return (
    <PageLayout
      title={`Requisition ${req.requisition_no}`}
      actions={
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" className="bg-white/80 backdrop-blur-sm border border-slate-200/50">
            <Printer size={16} /> Print
          </Button>
          <Link to={`/message/${id}`} className="no-underline">
            <Button variant="secondary" size="sm" className="bg-white/80 backdrop-blur-sm border border-slate-200/50">
              <MessageSquare size={16} /> Message
            </Button>
          </Link>
          {req.status === 'draft' && (
            <Button variant="primary" size="sm" className="bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20 btn-shine">
              <Edit size={16} /> Edit
            </Button>
          )}
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
                  <h1 className="text-2xl font-bold text-slate-800">{req.title}</h1>
                </div>
                <div className="flex gap-2">
                  <Badge variant={priorityBadgeColors[req.priority] || 'neutral'} className="font-semibold">
                    {req.priority} Priority
                  </Badge>
                  <Badge variant={statusBadgeColors[req.status] || 'default'} className="font-semibold">
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
              <p className="text-sm text-slate-500 leading-relaxed">{req.description || 'No description provided.'}</p>
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
                  <p className="text-slate-400 text-xs">Quantity</p>
                  <p className="font-semibold text-slate-700">{req.quantity || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Unit Price Estimate</p>
                  <p className="font-semibold text-slate-700">${req.unit_price_estimate?.toLocaleString() || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Currency</p>
                  <p className="font-semibold text-slate-700">{req.currency || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Required By</p>
                  <p className="font-semibold text-slate-700">{req.required_by_date ? new Date(req.required_by_date).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <FadeIn delay={0.15}>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 shadow-lg shadow-slate-200/10">
              <h2 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" />
                Status Timeline
              </h2>
              <StatusTimeline steps={statusFlow} currentIndex={currentStatusIndex >= 0 ? currentStatusIndex : 0} variant="primary" />
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            {/* Workflow Status */}
            {req.hodi_cnp_approval && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-100/50 shadow-lg shadow-slate-200/10">
                <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <User size={16} className="text-violet-500" />
                  Workflow Status
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">HOD/CNP Approval</span>
                    <span className="font-semibold text-slate-700">{req.hodi_cnp_approval}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Inventory Check</span>
                    <span className="font-semibold text-slate-700">{req.inventory_check_status || 'Not checked'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Procurement Method</span>
                    <span className="font-semibold text-slate-700">{req.procurement_method || '-'}</span>
                  </div>
                </div>
              </div>
            )}
          </FadeIn>

          <FadeIn delay={0.25}>
            {/* Quick Actions */}
            <Link 
              to={`/message/${id}`} 
              className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl no-underline text-indigo-600 text-sm font-semibold hover:from-indigo-100 hover:to-violet-100 transition-all border border-indigo-100"
            >
              <MessageSquare size={16} /> Send Message
            </Link>
          </FadeIn>
        </div>
      </div>
    </PageLayout>
  )
}