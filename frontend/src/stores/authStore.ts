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

export function canAccessAdmin(role: UserRole): boolean {
  return role === 'admin'
}

export function canCreateRequisition(role: UserRole): boolean {
  return ['indentor', 'hod', 'cnp_hod', 'procurement_officer', 'admin'].includes(role)
}

export function canApproveRequisition(role: UserRole): boolean {
  return ['hod', 'cnp_hod', 'procurement_officer', 'admin'].includes(role)
}

export function canManageVendors(role: UserRole): boolean {
  return ['cnp_hod', 'procurement_officer', 'admin'].includes(role)
}

export function canManageOrders(role: UserRole): boolean {
  return ['procurement_officer', 'cnp_hod', 'admin'].includes(role)
}