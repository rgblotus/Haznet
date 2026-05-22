import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Component, useState, useEffect, lazy, Suspense } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './stores/authStore'
import { ToastContainer } from './components/ui/toast'
import { motion } from 'framer-motion'
import { Hexagon } from 'lucide-react'
import { PageLoader } from '@/components/PageLoader'
import { PageErrorBoundary } from '@/components/PageErrorBoundary'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const RequisitionsPage = lazy(() => import('./pages/RequisitionsPage'))
const TendersPage = lazy(() => import('./pages/TendersPage'))
const VendorsPage = lazy(() => import('./pages/VendorsPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const ReceivingPage = lazy(() => import('./pages/ReceivingPage'))
const MessagesPage = lazy(() => import('./pages/MessagesPage'))
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'))
const RequisitionDetailPage = lazy(() => import('./pages/RequisitionDetailPage'))
const TenderDetailPage = lazy(() => import('./pages/TenderDetailPage'))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const VendorDetailPage = lazy(() => import('./pages/VendorDetailPage'))
const DepartmentPage = lazy(() => import('./pages/DepartmentPage'))

import { LoginModal } from './components/LoginModal'

class RouteErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Route error:', error, info) }
  render() {
    if (this.state.error) {
      return (
        <motion.div className="min-h-[400px] flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-center p-8">
            <p className="text-lg font-semibold text-slate-800 mb-2">Something went wrong</p>
            <p className="text-sm text-slate-500 mb-4">{this.state.error.message}</p>
            <button onClick={() => { this.setState({ error: null }); window.location.href = '/dashboard' }}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors">
              Go to Dashboard
            </button>
          </div>
        </motion.div>
      )
    }
    return this.props.children
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
})

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (user?.role === 'admin') return <>{children}</>
  return <Navigate to="/dashboard" replace />
}

function AppShell() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    const handleOpenLogin = () => setShowLogin(true)
    window.addEventListener('open-login', handleOpenLogin)
    return () => window.removeEventListener('open-login', handleOpenLogin)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
            <Hexagon size={20} className="text-white" />
          </div>
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <>
      <LandingPage />
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md" onClick={() => setShowLogin(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-500/20 border border-white/20 overflow-hidden"
          >
            <LoginModal onClose={() => setShowLogin(false)} />
          </motion.div>
        </div>
      )}
    </>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  const wrap = (el: ReactNode) => <RouteErrorBoundary>{el}</RouteErrorBoundary>
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={wrap(<AppShell />)} />
      <Route path="/dashboard" element={wrap(<AuthGuard><Suspense fallback={<PageLoader />}><PageErrorBoundary name="Dashboard"><DashboardPage /></PageErrorBoundary></Suspense></AuthGuard>)} />
      <Route path="/requisitions" element={wrap(<AuthGuard><Suspense fallback={<PageLoader />}><PageErrorBoundary name="Requisitions"><RequisitionsPage /></PageErrorBoundary></Suspense></AuthGuard>)} />
      <Route path="/requisitions/:id" element={wrap(<AuthGuard><Suspense fallback={<PageLoader />}><PageErrorBoundary name="RequisitionDetail"><RequisitionDetailPage /></PageErrorBoundary></Suspense></AuthGuard>)} />
      <Route path="/tenders" element={wrap(<AuthGuard><Suspense fallback={<PageLoader />}><PageErrorBoundary name="Tenders"><TendersPage /></PageErrorBoundary></Suspense></AuthGuard>)} />
      <Route path="/tenders/:id" element={wrap(<AuthGuard><Suspense fallback={<PageLoader />}><PageErrorBoundary name="TenderDetail"><TenderDetailPage /></PageErrorBoundary></Suspense></AuthGuard>)} />
      <Route path="/vendors" element={wrap(<AuthGuard><Suspense fallback={<PageLoader />}><PageErrorBoundary name="Vendors"><VendorsPage /></PageErrorBoundary></Suspense></AuthGuard>)} />
      <Route path="/vendors/:id" element={wrap(<AuthGuard><Suspense fallback={<PageLoader />}><PageErrorBoundary name="VendorDetail"><VendorDetailPage /></PageErrorBoundary></Suspense></AuthGuard>)} />
      <Route path="/orders" element={wrap(<AuthGuard><Suspense fallback={<PageLoader />}><PageErrorBoundary name="Orders"><OrdersPage /></PageErrorBoundary></Suspense></AuthGuard>)} />
      <Route path="/orders/:id" element={wrap(<AuthGuard><Suspense fallback={<PageLoader />}><PageErrorBoundary name="OrderDetail"><OrderDetailPage /></PageErrorBoundary></Suspense></AuthGuard>)} />
      <Route path="/receiving" element={wrap(<AuthGuard><Suspense fallback={<PageLoader />}><PageErrorBoundary name="Receiving"><ReceivingPage /></PageErrorBoundary></Suspense></AuthGuard>)} />
      <Route path="/messages" element={wrap(<AuthGuard><Suspense fallback={<PageLoader />}><PageErrorBoundary name="Messages"><MessagesPage /></PageErrorBoundary></Suspense></AuthGuard>)} />
      <Route path="/messages/:reqId" element={wrap(<AuthGuard><Suspense fallback={<PageLoader />}><PageErrorBoundary name="Messages"><MessagesPage /></PageErrorBoundary></Suspense></AuthGuard>)} />
      <Route path="/department" element={wrap(<AuthGuard><Suspense fallback={<PageLoader />}><PageErrorBoundary name="Department"><DepartmentPage /></PageErrorBoundary></Suspense></AuthGuard>)} />
      <Route path="/admin/users" element={wrap(<ProtectedRoute><Suspense fallback={<PageLoader />}><PageErrorBoundary name="AdminUsers"><AdminUsersPage /></PageErrorBoundary></Suspense></ProtectedRoute>)} />
      <Route path="/profile" element={wrap(<AuthGuard><Suspense fallback={<PageLoader />}><PageErrorBoundary name="Profile"><ProfilePage /></PageErrorBoundary></Suspense></AuthGuard>)} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatedRoutes />
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  )
}