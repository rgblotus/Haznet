import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { api, HttpError } from '@/services/api'
import { Hexagon, Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface LoginModalProps {
  onClose: () => void
}

export function LoginModal({ onClose }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  
  const setAuth = useAuthStore((s) => s.setAuth)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const loginMutation = useMutation({
    mutationFn: (data: { username: string; password: string }) => api.auth.login(data),
    onSuccess: (data) => {
      if (isMounted.current) {
        setAuth(data.access_token, data.user)
        onClose()
      }
    },
    onError: (err: HttpError) => {
      if (isMounted.current) {
        setError(err.message || 'Invalid credentials. Please check your email and password.')
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    loginMutation.mutate({ username: email, password })
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-indigo-500/5" />
      
      <motion.div 
        className="relative p-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-8">
          <motion.div 
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-500 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-indigo-500/30"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Hexagon size={28} className="text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h2>
          <p className="text-sm text-slate-500">Sign in to continue to HAZNET</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-red-50/80 backdrop-blur border border-red-100 rounded-xl flex items-start gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700">Email Address</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 group-focus-within:bg-indigo-500 group-focus-within:border-indigo-500 group-focus-within:text-white transition-all duration-200">
                <Mail size={16} />
              </div>
              <input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 pr-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur text-slate-800 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 group-hover:border-slate-300"
                placeholder="you@company.com" 
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">Password</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 group-focus-within:bg-indigo-500 group-focus-within:border-indigo-500 group-focus-within:text-white transition-all duration-200">
                <Lock size={16} />
              </div>
              <input 
                id="password" 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-12 py-3.5 rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur text-slate-800 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 group-hover:border-slate-300"
                placeholder="Enter your password" 
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={cn(
                'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200',
                rememberMe 
                  ? 'bg-indigo-500 border-indigo-500' 
                  : 'border-slate-300 group-hover:border-slate-400'
              )}>
                {rememberMe && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Remember me</span>
            </label>
            <button type="button" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors">
              Forgot password?
            </button>
          </div>

          <Button 
            type="submit" 
            size="lg"
            className="w-full py-3.5 text-base" 
            loading={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing in...' : (
              <>
                Sign In to Continue
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={14} />
            <span>Secured with enterprise-grade encryption</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}