import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div 
      className={cn('animate-shimmer bg-slate-100 rounded-md', className)}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-2 w-12" />
          </div>
        </div>
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {icon && <div className="mb-3 text-slate-400">{icon}</div>}
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-500 text-center max-w-sm mb-3">{description}</p>}
      {action}
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}