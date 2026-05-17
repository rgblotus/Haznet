import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './stores/authStore'
import { ToastContainer } from './components/ui/toast'
import { AnimatePresence, motion } from 'framer-motion'
import { Hexagon } from 'lucide-react'

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
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AppShell />} />
        <Route path="/dashboard" element={<AuthGuard><Suspense fallback={<PageLoader />}><DashboardPage /></Suspense></AuthGuard>} />
        <Route path="/requisitions" element={<AuthGuard><Suspense fallback={<PageLoader />}><RequisitionsPage /></Suspense></AuthGuard>} />
        <Route path="/requisitions/:id" element={<AuthGuard><Suspense fallback={<PageLoader />}><RequisitionDetailPage /></Suspense></AuthGuard>} />
        <Route path="/tenders" element={<AuthGuard><Suspense fallback={<PageLoader />}><TendersPage /></Suspense></AuthGuard>} />
        <Route path="/tenders/:id" element={<AuthGuard><Suspense fallback={<PageLoader />}><TenderDetailPage /></Suspense></AuthGuard>} />
        <Route path="/vendors" element={<AuthGuard><Suspense fallback={<PageLoader />}><VendorsPage /></Suspense></AuthGuard>} />
        <Route path="/vendors/:id" element={<AuthGuard><Suspense fallback={<PageLoader />}><VendorDetailPage /></Suspense></AuthGuard>} />
        <Route path="/orders" element={<AuthGuard><Suspense fallback={<PageLoader />}><OrdersPage /></Suspense></AuthGuard>} />
        <Route path="/orders/:id" element={<AuthGuard><Suspense fallback={<PageLoader />}><OrderDetailPage /></Suspense></AuthGuard>} />
        <Route path="/receiving" element={<AuthGuard><Suspense fallback={<PageLoader />}><ReceivingPage /></Suspense></AuthGuard>} />
        <Route path="/messages" element={<AuthGuard><Suspense fallback={<PageLoader />}><MessagesPage /></Suspense></AuthGuard>} />
        <Route path="/messages/:reqId" element={<AuthGuard><Suspense fallback={<PageLoader />}><MessagesPage /></Suspense></AuthGuard>} />
        <Route path="/department" element={<AuthGuard><Suspense fallback={<PageLoader />}><DepartmentPage /></Suspense></AuthGuard>} />
        <Route path="/admin/users" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><AdminUsersPage /></Suspense></ProtectedRoute>} />
        <Route path="/profile" element={<AuthGuard><Suspense fallback={<PageLoader />}><ProfilePage /></Suspense></AuthGuard>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function PageLoader() {
  return (
    <motion.div 
      className="min-h-[400px] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </motion.div>
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