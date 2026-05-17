import { cn } from '@/lib/utils'

export interface TimelineStep {
  key: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color?: string
}

interface StatusTimelineProps {
  steps: TimelineStep[]
  currentIndex: number
  variant?: 'default' | 'primary' | 'warning' | 'success' | 'info'
}

const variantColors = {
  default: { line: 'bg-gray-300', currentLine: 'ring-2 ring-warning-400', bg: 'bg-primary-500', text: 'text-text', mutedText: 'text-text-muted', dotBg: 'bg-surface-muted' },
  primary: { line: 'bg-border', currentLine: 'ring-2 ring-warning-400', bg: 'bg-primary-500', text: 'text-text', mutedText: 'text-text-muted', dotBg: 'bg-surface-muted' },
  warning: { line: 'bg-border', currentLine: 'ring-2 ring-warning-400', bg: 'bg-warning-500', text: 'text-text', mutedText: 'text-text-muted', dotBg: 'bg-surface-muted' },
  success: { line: 'bg-border', currentLine: 'ring-2 ring-warning-400', bg: 'bg-success-500', text: 'text-text', mutedText: 'text-text-muted', dotBg: 'bg-surface-muted' },
  info: { line: 'bg-border', currentLine: 'ring-2 ring-info-400', bg: 'bg-info-500', text: 'text-text', mutedText: 'text-text-muted', dotBg: 'bg-surface-muted' },
}

export default function StatusTimeline({ steps, currentIndex, variant = 'default' }: StatusTimelineProps) {
  const colors = variantColors[variant] || variantColors.primary

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const isCompleted = i <= currentIndex
        const isCurrent = i === currentIndex
        const IconComponent = step.icon

        return (
          <div key={step.key} className="flex items-start gap-3 relative">
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className={cn(
                'absolute left-[14px] top-8 -bottom-3 w-0.5',
                isCompleted ? colors.bg : colors.line
              )} />
            )}

            {/* Icon circle */}
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 transition-all duration-200',
              isCurrent ? `${colors.currentLine} ring-[3px] ring-offset-2` : '',
              isCompleted ? colors.bg : colors.dotBg,
            )}>
              <IconComponent
                size={14}
                className={cn(
                  'transition-colors duration-200',
                  isCompleted ? 'text-white' : `text-text-muted`,
                )}
              />
            </div>

            {/* Label */}
            <div className="flex-1 pb-5">
              <p className={cn(
                'text-sm transition-colors duration-200',
                isCurrent ? 'font-semibold' : '',
                isCompleted ? colors.text : `${colors.mutedText}`,
              )}>
                {step.label}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
