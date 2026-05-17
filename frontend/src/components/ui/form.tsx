import { InputHTMLAttributes, forwardRef, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface FormFieldProps {
  label?: string
  children: ReactNode
  className?: string
  error?: string
  hint?: string
  required?: boolean
}

export function FormField({ label, children, className, error, hint, required }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400',
        'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
        className
      )}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = '', ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 resize-none',
        'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
        className
      )}
      {...props}
    />
  )
})

Textarea.displayName = 'Textarea'

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className = '', ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 cursor-pointer appearance-none',
        'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23718396\' stroke-width=\'2\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")] bg-no-repeat bg-[right_0.5rem_center] pr-8',
        'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
        className
      )}
      {...props}
    />
  )
})

Select.displayName = 'Select'