import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole } from '@/types/models'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setRehydrated: () => void
  clearSession: () => void
  setAuth: (token: string, user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: (user, token) => {
        set({ user, token, isAuthenticated: true, isLoading: false })
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false })
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setRehydrated: () => set({ isLoading: false }),

      setAuth: (token, user) => {
        set({ token, user, isAuthenticated: true, isLoading: false })
      },

      clearSession: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },
    }),
    {
      name: 'scm-auth',
      onRehydrateStorage: () => (state) => {
        state?.setRehydrated()
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

export function getUserRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'Administrator',
    cnp_hod: 'HoD - Contract & Procurement',
    hod: 'Head of Department',
    procurement_officer: 'Procurement Officer',
    inventory_manager: 'Inventory Manager',
    indentor: 'Indentor',
    oic: 'Officer in Charge',
  }
  return labels[role] || role
}

export function canAccess(role: UserRole, feature: string): boolean {
  const permissions: Record<UserRole, string[]> = {
    admin: ['dashboard', 'requisitions', 'tenders', 'vendors', 'orders', 'receiving', 'messages', 'department', 'admin_users', 'inventory', 'profile'],
    oic: ['dashboard', 'requisitions', 'tenders', 'vendors', 'orders', 'receiving', 'messages', 'department', 'inventory', 'profile'],
    cnp_hod: ['dashboard', 'requisitions', 'tenders', 'vendors', 'orders', 'receiving', 'messages', 'department', 'inventory', 'profile'],
    procurement_officer: ['dashboard', 'requisitions', 'tenders', 'vendors', 'orders', 'receiving', 'messages', 'department', 'profile'],
    hod: ['dashboard', 'requisitions', 'messages', 'department', 'profile'],
    inventory_manager: ['dashboard', 'requisitions', 'orders', 'receiving', 'messages', 'department', 'inventory', 'profile'],
    indentor: ['dashboard', 'requisitions', 'vendors', 'messages', 'department', 'profile'],
  }
  return (permissions[role] || []).includes(feature)
}

export function canCreateRequisition(role: UserRole): boolean {
  return ['indentor', 'hod', 'cnp_hod', 'procurement_officer', 'admin', 'oic'].includes(role)
}

export function canEditRequisition(role: UserRole, status: string, isCreator: boolean): boolean {
  if (role === 'admin') return true
  if (role === 'indentor' && isCreator) return status === 'draft' || status === 'returned'
  if (['cnp_hod', 'procurement_officer', 'oic'].includes(role)) {
    return !['completed', 'cancelled'].includes(status)
  }
  return false
}

export function canDeleteRequisition(role: UserRole): boolean {
  return role === 'admin'
}

export function canSubmitRequisition(role: UserRole, status: string, isCreator: boolean): boolean {
  if (role !== 'indentor' || !isCreator) return false
  return status === 'draft' || status === 'returned'
}

export function canReviewRequisition(role: UserRole): boolean {
  return ['cnp_hod', 'oic'].includes(role)
}

export function canReturnRequisition(role: UserRole): boolean {
  return ['cnp_hod', 'procurement_officer', 'oic'].includes(role)
}

export function canAssignToProcurement(role: UserRole): boolean {
  return ['cnp_hod', 'oic'].includes(role)
}

export function canProcessRequisition(role: UserRole): boolean {
  return ['procurement_officer', 'cnp_hod', 'oic'].includes(role)
}

export function canCreateTender(role: UserRole): boolean {
  return ['procurement_officer', 'cnp_hod', 'oic'].includes(role)
}

export function canAwardBid(role: UserRole): boolean {
  return ['procurement_officer', 'cnp_hod', 'oic'].includes(role)
}

export function canManageVendors(role: UserRole): boolean {
  return ['indentor', 'cnp_hod', 'procurement_officer', 'admin', 'oic'].includes(role)
}

export function canManageOrders(role: UserRole): boolean {
  return ['procurement_officer', 'cnp_hod', 'admin', 'oic', 'inventory_manager'].includes(role)
}

export function canAccessInventory(role: UserRole): boolean {
  return ['inventory_manager', 'cnp_hod', 'admin', 'oic'].includes(role)
}

export function canCompleteRequisition(role: UserRole): boolean {
  return ['procurement_officer', 'cnp_hod', 'oic', 'admin'].includes(role)
}
