import { ReactNode } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { FadeIn } from '@/components/ui/AnimatedList'

const roleColorMap: Record<string, string> = {
  admin: 'from-violet-500 to-violet-600',
  cnp_hod: 'from-rose-500 to-rose-600',
  hod: 'from-amber-500 to-amber-600',
  procurement_officer: 'from-emerald-500 to-emerald-600',
  inventory_manager: 'from-cyan-500 to-cyan-600',
  oic: 'from-blue-500 to-blue-600',
  indentor: 'from-indigo-500 to-indigo-600',
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getInitials(firstName?: string, lastName?: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase()
  return firstName?.[0]?.toUpperCase() || '?'
}

interface WelcomeHeaderProps {
  accentColor?: string
  children?: ReactNode
}

export default function WelcomeHeader({ accentColor = 'indigo', children }: WelcomeHeaderProps) {
  const user = useAuthStore((s) => s.user)
  const greeting = getGreeting()
  const initials = getInitials(user?.first_name, user?.last_name)
  const roleColor = user?.role ? roleColorMap[user.role] || 'from-indigo-500 to-violet-500' : 'from-indigo-500 to-violet-500'
  const gradientKey = accentColor === 'indigo' ? 'indigo' : accentColor

  const gradientMap: Record<string, { bl: string; tr: string; icon: string }> = {
    indigo: { bl: 'from-indigo-500/[0.08]', tr: 'from-violet-500/[0.08]', icon: 'from-indigo-500 to-violet-500' },
    amber: { bl: 'from-amber-500/[0.08]', tr: 'from-orange-500/[0.08]', icon: 'from-amber-500 to-orange-500' },
    emerald: { bl: 'from-emerald-500/[0.08]', tr: 'from-emerald-600/[0.08]', icon: 'from-emerald-500 to-emerald-600' },
    rose: { bl: 'from-rose-500/[0.08]', tr: 'from-rose-600/[0.08]', icon: 'from-rose-500 to-rose-600' },
    cyan: { bl: 'from-cyan-500/[0.08]', tr: 'from-cyan-600/[0.08]', icon: 'from-cyan-500 to-cyan-600' },
  }

  const gradients = gradientMap[gradientKey] || gradientMap.indigo

  return (
    <FadeIn>
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-6 shadow-lg shadow-slate-200/20">
        <div className={cn('absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl rounded-bl-[100%] to-transparent', gradients.bl)} />
        <div className={cn('absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr rounded-tr-[80%] to-transparent', gradients.tr)} />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg', roleColor)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <span className="text-white text-xl font-bold">{initials}</span>
            </motion.div>
            <div>
              <p className="text-sm font-medium text-slate-500">{greeting}</p>
              <motion.h1
                className="text-2xl font-bold text-slate-800"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {user?.first_name || 'Dashboard'}
              </motion.h1>
              {user?.role && (
                <p className="text-xs font-medium text-slate-500 capitalize">{user.role.replace(/_/g, ' ')}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs font-medium text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
              <span className="block text-sm font-semibold text-slate-700">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', gradients.icon)}>
              <Clock size={20} className="text-white" />
            </div>
          </div>
        </div>

        {children}
      </div>
    </FadeIn>
  )
}
