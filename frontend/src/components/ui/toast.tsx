import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  title: string
  message?: string
}

let toastHandler: ((toast: ToastItem) => void) | null = null

export function toast(options: Omit<ToastItem, 'id'>) {
  const id = Math.random().toString(36).substring(2)
  toastHandler?.({ ...options, id })
}

function ToastItem({ type, title, message, onDismiss }: ToastItem & { onDismiss: () => void }) {
  const icons = {
    success: <CheckCircle size={16} className="text-emerald-500" />,
    error: <AlertCircle size={16} className="text-red-500" />,
    warning: <AlertTriangle size={16} className="text-amber-500" />,
    info: <Info size={16} className="text-indigo-500" />,
  }

  const styles = {
    success: 'border-emerald-200 bg-emerald-50',
    error: 'border-red-200 bg-red-50',
    warning: 'border-amber-200 bg-amber-50',
    info: 'border-indigo-200 bg-indigo-50',
  }

  return (
    <div className={cn('flex items-start gap-2.5 p-3 rounded-lg border shadow-md', styles[type])}>
      <div className="shrink-0">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {message && <p className="text-xs text-slate-500 mt-0.5">{message}</p>}
      </div>
      <button onClick={onDismiss} className="shrink-0 p-1 rounded hover:bg-slate-100">
        <X size={12} className="text-slate-400" />
      </button>
    </div>
  )
}

function ToastContainerInner() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    toastHandler = (toast) => {
      setToasts(prev => [...prev, toast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, 4000)
    }
    return () => { toastHandler = null }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>,
    document.body
  )
}

export function ToastContainer() {
  return <ToastContainerInner />
}