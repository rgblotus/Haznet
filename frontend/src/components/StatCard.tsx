import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  color?: string
  onClick?: () => void
  loading?: boolean
}

export function StatCard({
  title,
  value,
  icon,
  color = 'from-indigo-500 to-violet-500',
  onClick,
  loading,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100/50 p-5 shadow-lg shadow-slate-200/20 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-slate-100 rounded" />
            <div className="h-7 w-14 bg-slate-100 rounded" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100" />
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        'bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100/50 p-5 shadow-lg shadow-slate-200/20',
        'transition-all duration-300 hover:shadow-xl hover:shadow-slate-300/30 hover:-translate-y-1 hover:border-slate-200',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <h3 className="mt-1.5 text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        {icon && (
          <div className={cn('p-3 rounded-xl bg-gradient-to-br text-white shadow-lg', color)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}