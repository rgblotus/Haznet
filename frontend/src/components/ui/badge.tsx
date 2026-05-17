import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant | string
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variantStyles: Record<string, string> = {
  default: 'bg-slate-100 text-slate-600 border-slate-200',
  primary: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  success: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  warning: 'bg-amber-100 text-amber-600 border-amber-200',
  danger: 'bg-red-100 text-red-600 border-red-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
}

export function Badge({ variant = 'default', children, className, dot = false }: BadgeProps) {
  const v = typeof variant === 'string' ? variant : 'default'
  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full border text-xs px-2.5 py-0.5',
        variantStyles[v] || variantStyles.default,
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', {
        default: 'bg-slate-400',
        primary: 'bg-indigo-500',
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        danger: 'bg-red-500',
        neutral: 'bg-slate-400',
      }[v as string] || 'bg-slate-400')} />}
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
    draft: { variant: 'default', label: 'Draft' },
    submitted: { variant: 'warning', label: 'Submitted' },
    under_review: { variant: 'primary', label: 'Under Review' },
    returned: { variant: 'danger', label: 'Returned' },
    processing: { variant: 'primary', label: 'Processing' },
    completed: { variant: 'success', label: 'Completed' },
    cancelled: { variant: 'danger', label: 'Cancelled' },
    pending: { variant: 'warning', label: 'Pending' },
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'neutral', label: 'Inactive' },
    awarded: { variant: 'success', label: 'Awarded' },
    closed: { variant: 'neutral', label: 'Closed' },
    bidding: { variant: 'primary', label: 'Bidding' },
    evaluation: { variant: 'warning', label: 'Evaluation' },
  }

  const config = statusMap[status] || { variant: 'default', label: status }
  
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  )
}