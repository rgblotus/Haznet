import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { IconType } from '@/types/common'
import {
  FileText, Send, Shield, ClipboardList, Users, FileCheck,
  DollarSign, CheckCircle, XCircle, Clock, AlertTriangle,
  Briefcase, Handshake, FileSignature, Truck
} from 'lucide-react'

export type WorkflowPhase = 
  | 'creation'
  | 'internal_approval'
  | 'tender_creation'
  | 'bidding'
  | 'evaluation'
  | 'post_tender'
  | 'order_placement'
  | 'contract_execution'
  | 'completed'
  | 'cancelled'

interface PhaseConfig {
  key: WorkflowPhase
  label: string
  icon: IconType
  color: string
  subphases?: { key: string; label: string }[]
}

const phases: PhaseConfig[] = [
  { key: 'creation', label: 'Requisition Creation', icon: FileText, color: 'slate' },
  { key: 'internal_approval', label: 'Internal Approval', icon: Shield, color: 'indigo', subphases: [
    { key: 'checklist', label: 'Checklist Completion' },
    { key: 'clarification', label: 'Clarification to User' },
    { key: 'tender_committee', label: 'Tender Committee Recommendation' },
  ]},
  { key: 'tender_creation', label: 'Tender Creation', icon: ClipboardList, color: 'violet', subphases: [
    { key: 'doc_vetting', label: 'Document Vetting' },
    { key: 'bid_dates', label: 'Bid Dates Set' },
  ]},
  { key: 'bidding', label: 'Bidding', icon: Users, color: 'amber', subphases: [
    { key: 'pre_bid', label: 'Pre-Bid Meeting' },
    { key: 'bid_submission', label: 'Bid Submission' },
    { key: 'bid_opening', label: 'Bid Opening' },
  ]},
  { key: 'evaluation', label: 'Evaluation', icon: FileCheck, color: 'cyan', subphases: [
    { key: 'technical_eval', label: 'Technical Evaluation' },
    { key: 'commercial_eval', label: 'Commercial Evaluation' },
    { key: 'clarifications', label: 'Clarifications' },
    { key: 'revised_eval', label: 'Revised Evaluation' },
    { key: 'final_tech', label: 'Final Technical' },
    { key: 'final_com', label: 'Final Commercial' },
    { key: 'price_opening', label: 'Price Bid Opening' },
    { key: 'comp_statement', label: 'Comparative Statement' },
  ]},
  { key: 'post_tender', label: 'Post Tender', icon: DollarSign, color: 'emerald', subphases: [
    { key: 'negotiation', label: 'Negotiation (if required)' },
    { key: 'tc_recommendation', label: 'TC Recommendation for Order' },
    { key: 'bidder_acceptance', label: 'Bidder Acceptance' },
  ]},
  { key: 'order_placement', label: 'Order Placement', icon: Briefcase, color: 'orange', subphases: [
    { key: 'order_created', label: 'Order Created' },
    { key: 'contract_signing', label: 'Contract Signing' },
    { key: 'security_deposit', label: 'Security Deposit' },
  ]},
  { key: 'contract_execution', label: 'Contract Execution', icon: Handshake, color: 'rose', subphases: [
    { key: 'forwarded_engineer', label: 'Forwarded to Engineer' },
    { key: 'execution', label: 'Execution as per Terms' },
  ]},
  { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'green' },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'red' },
]

const phaseColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  slate: { bg: 'from-slate-50 to-slate-100', border: 'border-slate-200', text: 'text-slate-600', icon: 'bg-slate-500' },
  indigo: { bg: 'from-indigo-50 to-indigo-100', border: 'border-indigo-200', text: 'text-indigo-600', icon: 'bg-indigo-500' },
  violet: { bg: 'from-violet-50 to-violet-100', border: 'border-violet-200', text: 'text-violet-600', icon: 'bg-violet-500' },
  amber: { bg: 'from-amber-50 to-amber-100', border: 'border-amber-200', text: 'text-amber-600', icon: 'bg-amber-500' },
  cyan: { bg: 'from-cyan-50 to-cyan-100', border: 'border-cyan-200', text: 'text-cyan-600', icon: 'bg-cyan-500' },
  emerald: { bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200', text: 'text-emerald-600', icon: 'bg-emerald-500' },
  orange: { bg: 'from-orange-50 to-orange-100', border: 'border-orange-200', text: 'text-orange-600', icon: 'bg-orange-500' },
  rose: { bg: 'from-rose-50 to-rose-100', border: 'border-rose-200', text: 'text-rose-600', icon: 'bg-rose-500' },
  green: { bg: 'from-green-50 to-green-100', border: 'border-green-200', text: 'text-green-600', icon: 'bg-green-500' },
  red: { bg: 'from-red-50 to-red-100', border: 'border-red-200', text: 'text-red-600', icon: 'bg-red-500' },
}

interface WorkflowTimelineProps {
  currentPhase: WorkflowPhase
  completedPhases?: WorkflowPhase[]
  completedSubphases?: Record<string, string[]>
  onSubphaseClick?: (phase: string, subphase: string) => void
}

export default function WorkflowTimeline({ 
  currentPhase, 
  completedPhases = [],
  completedSubphases = {},
  onSubphaseClick 
}: WorkflowTimelineProps) {
  const currentIndex = phases.findIndex(p => p.key === currentPhase)
  const isCancelled = currentPhase === 'cancelled'

  return (
    <div className="space-y-1">
      {phases.map((phase, index) => {
        const isCompleted = completedPhases.includes(phase.key) || index < currentIndex
        const isCurrent = phase.key === currentPhase
        const colors = phaseColors[phase.color] || phaseColors.slate
        
        const isPast = index < currentIndex
        const isFuture = index > currentIndex

        return (
          <motion.div
            key={phase.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'relative pl-8 pb-4 border-l-2',
              isFuture ? 'border-slate-200' : isCancelled && !isPast ? 'border-red-200' : 'border-indigo-300'
            )}
          >
            <div className={cn(
              'absolute left-0 top-0 -translate-x-1/2 w-6 h-6 rounded-full border-4 flex items-center justify-center',
              isCompleted || isPast 
                ? 'bg-indigo-500 border-white' 
                : isCurrent 
                  ? 'bg-amber-400 border-white animate-pulse'
                  : 'bg-slate-200 border-white'
            )}>
              {isCompleted || isPast ? (
                <CheckCircle size={12} className="text-white" />
              ) : isCurrent ? (
                <Clock size={10} className="text-white" />
              ) : (
                <div className="w-2 h-2 bg-slate-400 rounded-full" />
              )}
            </div>

            <button
              onClick={() => phase.subphases?.length && onSubphaseClick?.(phase.key, '')}
              disabled={!phase.subphases}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-all',
                isCurrent ? 'bg-amber-50 border-2 border-amber-200' : 
                isCompleted ? 'bg-emerald-50 border-2 border-emerald-100 hover:border-emerald-200' :
                'bg-slate-50 border-2 border-slate-100',
                !phase.subphases && 'cursor-default'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                isCurrent ? 'bg-amber-400' : isCompleted ? colors.icon : 'bg-slate-300'
              )}>
                <phase.icon size={18} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className={cn(
                  'font-semibold text-sm',
                  isCurrent ? 'text-amber-800' : isCompleted ? 'text-emerald-700' : 'text-slate-500'
                )}>
                  {phase.label}
                  {isCurrent && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">In Progress</span>}
                </p>
                {phase.subphases && phase.subphases.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {phase.subphases.length} steps
                  </p>
                )}
              </div>
            </button>

            {phase.subphases && phase.subphases.length > 0 && (isCompleted || isCurrent) && (
              <div className="mt-2 ml-4 space-y-1">
                {phase.subphases.map((sub, subIdx) => {
                  const subKey = `${phase.key}_${sub.key}`
                  const isSubCompleted = completedSubphases[phase.key]?.includes(sub.key)
                  const isSubCurrent = isCurrent && subIdx === (completedSubphases[phase.key]?.length || 0)

                  return (
                    <div
                      key={sub.key}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all',
                        isSubCompleted 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : isSubCurrent 
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-slate-50 text-slate-400'
                      )}
                    >
                      <div className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isSubCompleted ? 'bg-emerald-500' : isSubCurrent ? 'bg-amber-500' : 'bg-slate-300'
                      )} />
                      {sub.label}
                      {isSubCompleted && <CheckCircle size={10} className="ml-auto text-emerald-500" />}
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

export function getRequisitionPhase(status: string, tenderStatus?: string): WorkflowPhase {
  switch (status) {
    case 'draft':
    case 'returned':
      return 'creation'
    case 'submitted':
    case 'under_review':
      return 'internal_approval'
    case 'processing':
    case 'tender_awaiting':
    case 'tender_created':
      return 'tender_creation'
    case 'bidding':
    case 'evaluating':
      return tenderStatus === 'bidding' ? 'bidding' : 'evaluation'
    case 'tender_awarded':
      return 'post_tender'
    case 'order_created':
    case 'issued':
      return 'order_placement'
    case 'shipped':
    case 'delivered':
    case 'receiving':
    case 'inspection_pending':
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'creation'
  }
}