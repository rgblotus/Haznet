import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
}

const sizeMap: Record<string, string> = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={cn('relative w-full bg-white rounded-xl shadow-xl max-h-[90vh] flex flex-col', sizeMap[size])}>
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
              <X size={14} className="text-slate-400" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <div className="px-4 py-3 border-t border-slate-100">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'primary', loading = false }: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center py-2">
        <p className="text-sm text-slate-500 mb-4">{message}</p>
        <div className="flex gap-2 justify-center">
          <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelText}</Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmText}</Button>
        </div>
      </div>
    </Modal>
  )
}