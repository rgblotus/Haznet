import { cn } from '@/lib/utils'

interface StatItem {
  label: string
  value: number | string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
  delay?: number
}

interface StatGridProps {
  stats: StatItem[]
  columns?: 'grid-cols-2' | 'grid-cols-3' | 'grid-cols-4' | 'grid-cols-5' | 'grid-cols-6'
  className?: string
}

export default function StatGrid({ stats, columns = 'grid-cols-4', className }: StatGridProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6', columns, className)}>
      {stats.map((stat, i) => (
        <div key={stat.label} className="bg-surface rounded-2xl p-5 border border-border hover:shadow-md transition-shadow" style={{ animationDelay: `${(stat.delay || i * 50)}ms` }}>
          <div className="flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', stat.color)}>
              {typeof stat.icon === 'function' && <stat.icon size={22} className="text-white" />}
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-text truncate">{stat.value}</p>
              <p className="text-sm text-text-secondary truncate">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}