import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import type { IconType } from '@/types/common'
import type { WorkflowStatus } from '@/types/models'
import {
  Shield, ClipboardList, Users, FileCheck, DollarSign, AlertTriangle,
  CheckCircle, XCircle, Clock, ChevronDown, ChevronRight, MessageSquare,
  FileText, Edit, Send, Calculator, UsersRound, Briefcase, Handshake
} from 'lucide-react'

interface WorkflowStatusDetailProps {
  requisitionId: string
  status: string
  tenderStatus?: string
  role: string
}

const phaseIcons: Record<string, IconType> = {
  checklist: FileCheck,
  clarification: MessageSquare,
  tender_committee: UsersRound,
  doc_vetting: FileText,
  bid_dates: Calendar,
  pre_bid: Users,
  bid_submission: Send,
  bid_opening: ClipboardList,
  technical_eval: FileCheck,
  commercial_eval: Calculator,
  clarifications: MessageSquare,
  revised_eval: Edit,
  final_tech: FileCheck,
  final_com: Calculator,
  price_opening: DollarSign,
  comp_statement: ClipboardList,
  negotiation: DollarSign,
  tc_recommendation: UsersRound,
  bidder_acceptance: CheckCircle,
  order_created: Briefcase,
  contract_signing: Handshake,
  security_deposit: DollarSign,
  forwarded_engineer: Send,
  execution: Briefcase,
}

function Calendar({ className, size }: { className?: string; size?: number }) {
  return <Clock className={className} size={size} />
}

interface PhaseStepProps {
  label: string
  status: 'completed' | 'current' | 'pending'
  icon?: IconType
  notes?: string
  date?: string
  onClick?: () => void
}

function PhaseStep({ label, status, icon: Icon, notes, date, onClick }: PhaseStepProps) {
  const statusClasses = {
    completed: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    current: 'bg-amber-50 border-amber-300 text-amber-700',
    pending: 'bg-slate-50 border-slate-200 text-slate-400',
  }
  
  const iconClasses = {
    completed: 'bg-emerald-500',
    current: 'bg-amber-500',
    pending: 'bg-slate-300',
  }

  return (
    <button
      onClick={onClick}
      disabled={status === 'pending'}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
        statusClasses[status],
        status !== 'pending' && 'hover:shadow-md'
      )}
    >
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconClasses[status])}>
        {status === 'completed' ? (
          <CheckCircle size={16} className="text-white" />
        ) : status === 'current' ? (
          <Clock size={14} className="text-white animate-pulse" />
        ) : Icon ? (
          <Icon size={14} className="text-white" />
        ) : (
          <div className="w-2 h-2 bg-white rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{label}</p>
        {notes && <p className="text-xs opacity-75 truncate">{notes}</p>}
      </div>
      {date && <p className="text-xs shrink-0 opacity-60">{date}</p>}
      {status !== 'pending' && <ChevronRight size={16} className="shrink-0 opacity-40" />}
    </button>
  )
}

export default function WorkflowStatusDetail({ requisitionId, status, tenderStatus, role }: WorkflowStatusDetailProps) {
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedPhase, setExpandedPhase] = useState<string | null>('internal_approval')
  
  useEffect(() => {
    if (!requisitionId) return
    setLoading(true)
    api.workflow.getStatus(requisitionId)
      .then(setWorkflowStatus)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [requisitionId])

  const canPerformAction = ['procurement_officer', 'cnp_hod', 'oic', 'admin'].includes(role)

  const phases = [
    {
      key: 'internal_approval',
      label: 'Internal Approval Process',
      steps: [
        { key: 'checklist', label: 'Checklist Completion', status: workflowStatus?.internal_approval?.checklist_completed ? 'completed' : (status === 'submitted' || status === 'under_review' ? 'current' : 'pending') },
        { key: 'clarification', label: 'Clarification to User', status: workflowStatus?.internal_approval?.clarification_required ? 'current' : (workflowStatus?.internal_approval?.clarification_responded_at ? 'completed' : 'pending') },
        { key: 'tender_committee', label: 'Tender Committee Recommendation', status: workflowStatus?.internal_approval?.tender_committee_recommendation ? 'completed' : 'pending' },
      ]
    },
    {
      key: 'tender_creation',
      label: 'Tender Creation & Vetting',
      steps: [
        { key: 'doc_vetting', label: 'Document Vetting', status: workflowStatus?.tender_process?.document_vetting_done ? 'completed' : (tenderStatus === 'draft' ? 'current' : 'pending') },
        { key: 'bid_dates', label: 'Bid Dates (Creation, Pre-Bid, Opening)', status: workflowStatus?.tender_process?.bid_opening_date ? 'completed' : (tenderStatus ? 'current' : 'pending') },
      ]
    },
    {
      key: 'bidding',
      label: 'Bidding Process',
      steps: [
        { key: 'pre_bid', label: 'Pre-Bid Meeting', status: workflowStatus?.tender_process?.pre_bid_meeting_date ? 'completed' : 'pending' },
        { key: 'bid_submission', label: 'Bid Submission', status: workflowStatus?.tender_process?.bid_closing_date ? 'completed' : 'pending' },
        { key: 'bid_opening', label: 'Bid Opening', status: workflowStatus?.tender_process?.bid_opening_date ? 'completed' : 'pending' },
      ]
    },
    {
      key: 'evaluation',
      label: 'Evaluation Process',
      steps: [
        { key: 'technical_eval', label: 'Technical Evaluation', status: 'pending' },
        { key: 'commercial_eval', label: 'Commercial Evaluation', status: 'pending' },
        { key: 'clarifications', label: 'Clarifications to Bidders', status: 'pending' },
        { key: 'revised_eval', label: 'Revised Evaluation', status: 'pending' },
        { key: 'final_tech', label: 'Final Technical Evaluation', status: 'pending' },
        { key: 'final_com', label: 'Final Commercial Evaluation', status: 'pending' },
        { key: 'price_opening', label: 'Price Bid Opening (TC Recommendation)', status: 'pending' },
        { key: 'comp_statement', label: 'Comparative Statement & Vetting', status: workflowStatus?.comparative_statement_vetted ? 'completed' : 'pending' },
      ]
    },
    {
      key: 'post_tender',
      label: 'Post Tender Process',
      steps: [
        { key: 'negotiation', label: 'Negotiation (if required)', status: workflowStatus?.negotiation_done ? 'completed' : 'pending' },
        { key: 'tc_recommendation', label: 'TC Recommendation for Order Placement', status: 'pending' },
        { key: 'bidder_acceptance', label: 'Bidder Acceptance of Order', status: 'pending' },
      ]
    },
    {
      key: 'order_placement',
      label: 'Order Placement & Contract',
      steps: [
        { key: 'order_created', label: 'Order Created', status: status === 'order_created' || status === 'tender_awarded' ? 'completed' : 'pending' },
        { key: 'contract_signing', label: 'Contract Agreement Signing', status: 'pending' },
        { key: 'security_deposit', label: 'Security Deposit Submission', status: 'pending' },
      ]
    },
    {
      key: 'contract_execution',
      label: 'Contract Execution',
      steps: [
        { key: 'forwarded_engineer', label: 'Forwarded to Engineer In-Charge', status: 'pending' },
        { key: 'execution', label: 'Execution as per Terms & Conditions', status: status === 'completed' ? 'completed' : 'pending' },
      ]
    },
  ]

  if (status === 'cancelled') {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
            <XCircle size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-800">Requisition Cancelled</h3>
            <p className="text-sm text-red-600">This requisition workflow has been terminated</p>
          </div>
        </div>
        {workflowStatus?.cancellation_reason && (
          <div className="bg-white/50 rounded-xl p-4">
            <p className="text-sm text-red-700"><span className="font-semibold">Reason:</span> {workflowStatus.cancellation_reason}</p>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {phases.map((phase) => {
        const isExpanded = expandedPhase === phase.key
        const hasCurrentStep = phase.steps.some(s => s.status === 'current')
        
        return (
          <motion.div
            key={phase.key}
            className="rounded-xl border-2 border-slate-100 overflow-hidden"
          >
            <button
              onClick={() => setExpandedPhase(isExpanded ? null : phase.key)}
              className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              {hasCurrentStep ? (
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              ) : phase.steps.every(s => s.status === 'completed') ? (
                <CheckCircle size={16} className="text-emerald-500" />
              ) : (
                <div className="w-3 h-3 rounded-full bg-slate-300" />
              )}
              <span className="font-semibold text-sm text-slate-700 flex-1 text-left">{phase.label}</span>
              {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-3 space-y-2 bg-white"
                >
                  {phase.steps.map((step) => {
                    const Icon = phaseIcons[step.key]
                    return (
                      <PhaseStep
                        key={step.key}
                        label={step.label}
                        status={step.status as 'completed' | 'current' | 'pending'}
                        icon={Icon}
                      />
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}