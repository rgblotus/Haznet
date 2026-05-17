import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger' | 'warning'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
  }
>(
  ({ variant = 'primary', size = 'md', className = '', loading = false, children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl active:scale-[0.98]'
    
    const variantClasses = {
      primary: 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5',
      secondary: 'bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5',
      outline: 'border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:shadow-md',
      ghost: 'text-slate-600 hover:text-slate-800 hover:bg-slate-100',
      success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5',
      danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-xl hover:shadow-red-500/25 hover:-translate-y-0.5',
      warning: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-xl hover:shadow-amber-500/25 hover:-translate-y-0.5',
    }

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        disabled={disabled || loading}
        type={props.type as 'button' | 'submit' | 'reset'}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'