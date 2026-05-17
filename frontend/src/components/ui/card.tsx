import { ReactNode, MouseEventHandler, CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: MouseEventHandler<HTMLDivElement>
  hover?: boolean
  style?: CSSProperties
}

export function Card({ children, className = '', onClick, hover = false, style }: CardProps) {
  return (
    <div 
      className={cn(
        'bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/20 border border-slate-100/50 overflow-hidden',
        'transition-all duration-300',
        hover || onClick ? 'cursor-pointer hover:shadow-xl hover:shadow-slate-300/30 hover:-translate-y-1 hover:border-slate-200' : '',
        className
      )} 
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={cn('px-5 py-4 border-b border-slate-100/50 bg-gradient-to-b from-white to-slate-50/30', className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={cn('text-sm font-bold text-slate-800 tracking-tight', className)}>
      {children}
    </h3>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={cn('p-5', className)}>
      {children}
    </div>
  )
}