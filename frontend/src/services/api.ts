import type {
  User,
  UserRole,
  Requisition,
  Tender,
  Bid,
  Vendor,
  Order,
  PostOrder,
  Message,
  DashboardStats,
  Department,
  LoginPayload,
  TokenResponse,
  ActivityItem,
} from '@/types/models'

export type {
  User, UserRole, Requisition, Tender, Bid, Vendor,
  Order, PostOrder, Message, DashboardStats, Department,
  LoginPayload, TokenResponse, ActivityItem,
}

export interface PaginationMeta {
  total: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ApiError {
  detail: string
  errors?: { field: string; message: string; type: string }[]
}

const API_BASE = '/api'

class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

import { useAuthStore } from '@/stores/authStore'

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
      credentials: 'include',
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
      throw new HttpError(res.status, body.detail || `Request failed with status ${res.status}`)
    }

    return await res.json() as Promise<T>
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }
    if (error instanceof Error) {
      throw new HttpError(0, error.message)
    }
    throw new HttpError(0, 'An unexpected error occurred')
  }
}

function qs(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') searchParams.set(key, String(value))
  }
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export const api = {
  auth: {
    login: (data: LoginPayload) =>
      request<TokenResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMe: () => request<User>('/auth/me'),
    logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
    refresh: () => request<TokenResponse>('/auth/refresh', { method: 'POST' }),
  },

  requisitions: {
    list: (params: { page?: number; page_size?: number; status_filter?: string; priority?: string; search?: string; department_id?: string } = {}) =>
      request<PaginatedResponse<Requisition>>(`/requisitions${qs({
        page: params.page,
        page_size: params.page_size,
        status_filter: params.status_filter,
        priority: params.priority,
        search: params.search,
        department_id: params.department_id,
      })}`),
    get: (id: string) => request<Requisition>(`/requisitions/${id}`),
    create: (data: Partial<Requisition>) =>
      request<Requisition>('/requisitions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Requisition>) =>
      request<Requisition>(`/requisitions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    submit: (id: string) =>
      request<Requisition>(`/requisitions/${id}/submit`, { method: 'POST' }),
    approve: (id: string, assignTo?: string) =>
      request<Requisition>(`/requisitions/${id}/approve${assignTo ? `?assign_to=${assignTo}` : ''}`, { method: 'POST' }),
    reject: (id: string, reason?: string) =>
      request<Requisition>(`/requisitions/${id}/reject${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`, { method: 'POST' }),
    returnReq: (id: string, reason?: string) =>
      request<Requisition>(`/requisitions/${id}/return${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`, { method: 'POST' }),
  },

  tenders: {
    list: (params: { page?: number; page_size?: number; status?: string; search?: string } = {}) =>
      request<PaginatedResponse<Tender>>(`/tenders${qs({
        page: params.page,
        page_size: params.page_size,
        status: params.status,
        search: params.search,
      })}`),
    get: (id: string) => request<Tender>(`/tenders/${id}`),
    create: (data: Partial<Tender>) =>
      request<Tender>('/tenders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Tender>) =>
      request<Tender>(`/tenders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    publish: (id: string) =>
      request<Tender>(`/tenders/${id}/publish`, { method: 'POST' }),
    bids: (id: string) => request<Bid[]>(`/tenders/${id}/bids`),
    createBid: (tenderId: string, data: Partial<Bid>) =>
      request<Bid>(`/tenders/${tenderId}/bids`, { method: 'POST', body: JSON.stringify(data) }),
    evaluateBid: (tenderId: string, bidId: string, technical: number, financial: number) =>
      request<{ total_score: number }>(
        `/tenders/${tenderId}/bids/${bidId}/evaluate?technical_score=${technical}&financial_score=${financial}`,
        { method: 'POST' }
      ),
    awardBid: (tenderId: string, bidId: string) =>
      request<{ message: string }>(`/tenders/${tenderId}/bids/${bidId}/award`, { method: 'POST' }),
  },

  vendors: {
    list: (params: { page?: number; page_size?: number; status?: string; category?: string; search?: string } = {}) =>
      request<PaginatedResponse<Vendor>>(`/vendors${qs({
        page: params.page,
        page_size: params.page_size,
        status: params.status,
        category: params.category,
        search: params.search,
      })}`),
    get: (id: string) => request<Vendor>(`/vendors/${id}`),
    create: (data: Partial<Vendor>) =>
      request<Vendor>('/vendors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Vendor>) =>
      request<Vendor>(`/vendors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/vendors/${id}`, { method: 'DELETE' }),
  },

  orders: {
    list: (params: { page?: number; page_size?: number; status?: string; search?: string } = {}) =>
      request<PaginatedResponse<Order>>(`/orders${qs({
        page: params.page,
        page_size: params.page_size,
        status: params.status,
        search: params.search,
      })}`),
    get: (id: string) => request<Order>(`/orders/${id}`),
    create: (data: Partial<Order>) =>
      request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Order>) =>
      request<Order>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    issue: (id: string) =>
      request<Order>(`/orders/${id}/issue`, { method: 'POST' }),
  },

  postOrders: {
    list: () => request<PostOrder[]>('/post-orders'),
    get: (id: string) => request<PostOrder>(`/post-orders/${id}`),
    update: (id: string, data: Partial<PostOrder>) =>
      request<PostOrder>(`/post-orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  messages: {
    list: () => request<Message[]>('/messages'),
    listByReq: (reqId: string) => request<Message[]>(`/messages/requisition/${reqId}`),
    send: (data: { content: string; receiver_id?: string; requisition_id?: string }) =>
      request<Message>('/messages', { method: 'POST', body: JSON.stringify(data) }),
  },

  admin: {
    users: (params: { page?: number; page_size?: number; search?: string; role?: string; is_active?: boolean } = {}) =>
      request<PaginatedResponse<User>>(`/admin/users${qs({
        page: params.page,
        page_size: params.page_size,
        search: params.search,
        role: params.role,
        is_active: params.is_active !== undefined ? String(params.is_active) : undefined,
      })}`),
    createUser: (data: Partial<User> & { password: string }) =>
      request<User>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (id: string, data: Partial<User>) =>
      request<User>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteUser: (id: string) =>
      request<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),
    departments: (params: { page?: number; page_size?: number; search?: string } = {}) =>
      request<PaginatedResponse<Department>>(`/admin/departments${qs({
        page: params.page,
        page_size: params.page_size,
        search: params.search,
      })}`),
    getDepartment: (id: string) => request<Department>(`/admin/departments/${id}`),
    updateDepartment: (id: string, data: Partial<Department>) =>
      request<Department>(`/admin/departments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  dashboard: {
    stats: () => request<DashboardStats>('/dashboard/stats'),
    activity: (params: { page?: number; page_size?: number } = {}) =>
      request<PaginatedResponse<ActivityItem>>(
        `/dashboard/activity${qs({ page: params.page, page_size: params.page_size })}`
      ),
    summary: () => request<{
      my_requisitions: { id: string; requisition_no: string; title: string; status: string; priority: string; created_at: string | null }[]
      assigned_count: number
      user_role: string
      user_department: string | null
    }>('/dashboard/summary'),
  },

  health: {
    check: () => request<{ status: string; app: string; version: string; timestamp: string }>('/health'),
    dbCheck: () => request<{ status: string; database: string; timestamp: string }>('/health/db'),
    info: () => request<{ name: string; version: string; environment: string; features: { docs: boolean; debug_mode: boolean } }>('/info'),
  },
}

export { HttpError }
