export type UserRole =
  | 'indentor'
  | 'hod'
  | 'cnp_hod'
  | 'procurement_officer'
  | 'inventory_manager'
  | 'oic'
  | 'admin'

export type RequisitionStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'returned'
  | 'pending_inventory'
  | 'inventory_checked'
  | 'processing'
  | 'tender_awaiting'
  | 'order_created'
  | 'shipped'
  | 'receiving'
  | 'inspection_pending'
  | 'completed'
  | 'cancelled'

export type TenderStatus =
  | 'draft'
  | 'published'
  | 'bidding'
  | 'evaluating'
  | 'awarded'
  | 'closed'
  | 'cancelled'

export type OrderStatus =
  | 'draft'
  | 'approved'
  | 'issued'
  | 'shipped'
  | 'delivered'
  | 'received'
  | 'cancelled'

export type PostOrderStatus =
  | 'pending_inspection'
  | 'in_progress'
  | 'passed'
  | 'failed'
  | 'discrepancy'
  | 'completed'

export type Priority = 'High' | 'Medium' | 'Low'

export type HODCNPApproval = 'Pending' | 'Approved' | 'Returned' | 'Rejected'

export type InventoryCheckStatus = 'NotChecked' | 'Available' | 'Surplus' | 'Ordered' | 'Required'

export type ProcurementMethod = 'Direct' | 'Tender'

export type QualityStatus = 'Pending' | 'Passed' | 'Failed' | 'Partial'

export type VendorStatus = 'Active' | 'Inactive'

export type Designation =
  | 'Officer'
  | 'Senior Officer'
  | 'Manager'
  | 'Senior Manager'
  | 'Chief Manager'
  | 'Dy. General Manager'
  | 'General Manager'
  | 'Chief General Manager'

export interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  employee_id: string | null
  contact: string | null
  designation: Designation | null
  department_name: string | null
  avatar: string | null
  bio: string | null
  role: UserRole
  department_id: string | null
  is_active: boolean
  created_at: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface Requisition {
  id: string
  requisition_no: string
  title: string
  description: string
  category: string
  status: RequisitionStatus
  priority: Priority
  creator_id: string
  current_owner_id: string | null
  department_id: string
  quantity: number
  unit_price_estimate: number | null
  total_estimate: number | null
  currency: string
  required_by_date: string | null
  justification: string | null
  specifications: string | null
  hodi_cnp_approval: HODCNPApproval | null
  inventory_check_status: InventoryCheckStatus | null
  procurement_method: ProcurementMethod | null
  tender_id: string | null
  created_at: string
  updated_at: string
}

export interface Tender {
  id: string
  tender_no: string
  requisition_id: string | null
  title: string
  description: string
  status: TenderStatus
  issue_date: string | null
  closing_date: string | null
  evaluation_method: string | null
  created_at: string
  updated_at: string
}

export interface Bid {
  id: string
  tender_id: string
  vendor_id: string
  amount: number
  currency: string
  validity_days: number | null
  technical_score: number | null
  financial_score: number | null
  total_score: number | null
  is_awarded: boolean
  created_at: string
}

export interface Vendor {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  category: string | null
  status: VendorStatus
  rating: number | null
  created_at: string
}

export interface Order {
  id: string
  order_no: string
  requisition_id: string | null
  tender_id: string | null
  vendor_id: string | null
  title: string
  description: string | null
  status: OrderStatus
  quantity: number
  unit_price: number | null
  total_amount: number | null
  currency: string
  order_date: string | null
  delivery_date: string | null
  delivery_address: string | null
  payment_terms: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PostOrder {
  id: string
  order_id: string
  requisition_id: string | null
  received_quantity: number | null
  ordered_quantity: number | null
  quality_status: QualityStatus
  inspection_notes: string | null
  discrepancy_description: string | null
  status: PostOrderStatus
  received_by: string | null
  received_date: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  content: string
  sender_id: string
  receiver_id: string | null
  requisition_id: string | null
  created_at: string
}

export interface DashboardStats {
  total_requisitions: number
  pending_approval: number
  in_progress: number
  completed: number
  overdue: number
  total_vendors: number
  active_tenders: number
  pending_orders: number
  pending_receipts: number
  my_pending: number
}

export interface Department {
  id: string
  name: string
  code: string
  description: string
  hod_user_id: string | null
  created_at: string
}

export interface ActivityItem {
  id: string
  type: string
  title: string
  status: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  requisition_id: string
  user_id: string
  action: string
  details: string | null
  old_value: string | null
  new_value: string | null
  created_at: string
  user_name: string | null
}
