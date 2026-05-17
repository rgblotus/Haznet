import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  BarChart3,
  ClipboardList,
  FileText,
  Package,
  Truck,
  Users,
  Menu,
  X,
  Hexagon,
  MessageSquare,
  LogOut,
  Building2,
  Briefcase,
  Warehouse,
} from 'lucide-react'
import { useAuthStore, canAccess } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
}

const allNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: BarChart3, color: 'indigo' },
  { name: 'Requisitions', path: '/requisitions', icon: FileText, color: 'amber' },
  { name: 'Tenders', path: '/tenders', icon: ClipboardList, color: 'violet' },
  { name: 'Vendors', path: '/vendors', icon: Building2, color: 'emerald' },
  { name: 'Orders', path: '/orders', icon: Package, color: 'rose' },
  { name: 'Receiving', path: '/receiving', icon: Truck, color: 'cyan' },
  { name: 'Inventory', path: '/inventory', icon: Warehouse, color: 'teal' },
]

const bottomNavItems: NavItem[] = [
  { name: 'Messages', path: '/messages', icon: MessageSquare, color: 'indigo' },
]

const colorMap: Record<string, string> = {
  indigo: 'hover:from-indigo-500 hover:to-indigo-600',
  amber: 'hover:from-amber-500 hover:to-amber-600',
  violet: 'hover:from-violet-500 hover:to-violet-600',
  emerald: 'hover:from-emerald-500 hover:to-emerald-600',
  rose: 'hover:from-rose-500 hover:to-rose-600',
  cyan: 'hover:from-cyan-500 hover:to-cyan-600',
  slate: 'hover:from-slate-500 hover:to-slate-600',
  teal: 'hover:from-teal-500 hover:to-teal-600',
}

export default function Sidebar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const role = user?.role || 'indentor'

  const handleLogout = async () => {
    try { await api.auth.logout() } catch {}
    logout()
  }

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const navItems = allNavItems.filter(item => canAccess(role, item.path.replace('/', '') || 'dashboard'))

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname.startsWith(item.path)
    const IconComponent = item.icon
    
    return (
      <Link
        to={item.path}
        className={cn(
          'flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm',
          isActive 
            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
        )}
      >
        <IconComponent size={16} />
        <span>{item.name}</span>
      </Link>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm">
      <div className="p-4 border-b border-slate-100/50">
        <Link to="/" className="flex items-center gap-3 no-underline" onClick={() => setMobileOpen(false)}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Hexagon size={18} className="text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-slate-800">HAZNET</span>
            <span className="block text-xs text-slate-500 -mt-0.5">Supply Chain</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.name} item={item} />
        ))}
      </nav>

      <div className="p-3 border-t border-slate-100/50 space-y-1">
        {bottomNavItems.filter(item => canAccess(role, 'messages')).map((item) => (
          <NavLink key={item.name} item={item} />
        ))}
        
        {canAccess(role, 'department') && (
          <NavLink key="My Department" item={{ name: 'My Department', path: '/department', icon: Briefcase, color: 'amber' }} />
        )}
        
        {canAccess(role, 'admin_users') && (
          <NavLink key="User Management" item={{ name: 'User Management', path: '/admin/users', icon: Users, color: 'indigo' }} />
        )}
      </div>

      <div className="p-3 border-t border-slate-100/50">
        <Link
          to="/profile"
          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-rose-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {user?.first_name?.[0] || user?.last_name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role?.replace(/_/g, ' ') || 'Staff'}</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all mt-1"
        >
          <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-red-100 transition-colors">
            <LogOut size={14} />
          </div>
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        className="md:hidden fixed top-3 left-3 z-40 p-2.5 rounded-xl bg-white shadow-lg border border-slate-200/50 hover:shadow-xl transition-all"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <aside className="hidden md:flex w-60 flex-col bg-white/80 backdrop-blur-md border-r border-slate-200/50 shrink-0 h-screen sticky top-0 shadow-xl shadow-slate-200/10">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={cn(
        'fixed inset-y-0 left-0 z-40 w-60 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 md:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {sidebarContent}
      </div>
    </>
  )
}
