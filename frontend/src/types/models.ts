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

export type DocumentCategory = 
  | 'requisition_user_docs'
  | 'internal_approval_docs'
  | 'tender_document'
  | 'tender_vetted_docs'
  | 'bid_documents'
  | 'technical_evaluation'
  | 'technical_query_sheet'
  | 'commercial_evaluation'
  | 'commercial_query_sheet'
  | 'revised_evaluation'
  | 'comparative_statement'
  | 'price_bid_docs'
  | 'negotiation_docs'
  | 'tender_committee_docs'
  | 'order_documents'
  | 'contract_document'
  | 'security_deposit'
  | 'execution_docs'
  | 'other'

export type RequisitionStage = 
  | 'draft'
  | 'submitted'
  | 'internal_approval'
  | 'tender_creation'
  | 'tender_evaluation'
  | 'post_tender'
  | 'order_created'
  | 'contract_executed'
  | 'completed'
  | 'cancelled'

export type InternalApprovalStatus = 
  | 'pending'
  | 'in_progress'
  | 'clarification_required'
  | 'completed'
  | 'rejected'

export type TenderEvaluationStage = 
  | 'bid_opening'
  | 'technical_evaluation'
  | 'commercial_evaluation'
  | 'clarifications'
  | 'revised_evaluation'
  | 'final_technical'
  | 'final_commercial'
  | 'price_bid_opening'
  | 'comparative_statement'
  | 'negotiation'
  | 'tender_committee_recommendation'
  | 'order_placement'

export type TenderCancellationReason = 
  | 'technical_rejection'
  | 'budget_constraint'
  | 'no_bids_received'
  | 'l1_backout'
  | 'administrative'
  | 'other'

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
  file_reference: string | null
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

export interface InternalApprovalDetail {
  id: string
  requisition_id: string
  checklist_completed: boolean
  checklist_completed_at: string | null
  checklist_notes: string | null
  clarification_required: boolean
  clarification_sent_at: string | null
  clarification_response: string | null
  clarification_responded_at: string | null
  tender_committee_recommendation: string | null
  tender_committee_recommended_at: string | null
}

export interface TenderProcess {
  id: string
  tender_id: string
  pre_bid_meeting_date: string | null
  pre_bid_meeting_venue: string | null
  pre_bid_meeting_minutes: string | null
  bid_creation_date: string | null
  bid_opening_date: string | null
  bid_closing_date: string | null
  document_vetting_done: boolean
  document_vetted_at: string | null
}

export interface TenderEvaluation {
  id: string
  tender_id: string
  stage: TenderEvaluationStage
  status: string
  technical_query_raised: boolean
  technical_query_sheet: string | null
  commercial_query_raised: boolean
  commercial_query_sheet: string | null
  clarification_response_received: boolean
  revised_evaluation_done: boolean
  final_score: number | null
  completed_at: string | null
  notes: string | null
}

export interface BidEvaluationDetail {
  id: string
  bid_id: string
  tender_evaluation_id: string | null
  technical_score: number | null
  technical_evaluated_at: string | null
  technical_remarks: string | null
  commercial_score: number | null
  commercial_evaluated_at: string | null
  commercial_remarks: string | null
  is_technically_qualified: boolean
  is_commercially_acceptable: boolean
  is_final_recommended: boolean
}

export interface ComparativeStatement {
  id: string
  tender_id: string
  statement_data: string
  vetted: boolean
  vetted_at: string | null
  vetting_remarks: string | null
}

export interface TenderNegotiation {
  id: string
  tender_id: string
  bid_id: string
  negotiation_notes: string | null
  final_negotiated_price: number | null
  negotiated_at: string | null
  accounts_consulted: boolean
}

export interface TenderCommitteeRecommendation {
  id: string
  tender_id: string
  recommendation_type: string
  recommended_bid_id: string | null
  recommended_vendor_name: string | null
  recommended_amount: number | null
  recommendation_text: string | null
  recommended_at: string | null
  approved: boolean
  approved_at: string | null
}

export interface OrderExecutionDetail {
  id: string
  order_id: string
  bidder_accepted: boolean
  bidder_accepted_at: string | null
  contract_signed: boolean
  contract_signed_at: string | null
  contract_document_path: string | null
  security_deposit_submitted: boolean
  security_deposit_amount: number | null
  security_deposit_submitted_at: string | null
  forwarded_to_engineer: boolean
  forwarded_at: string | null
}

export interface WorkflowStatus {
  requisition_id: string
  current_stage: RequisitionStage | null
  internal_approval: InternalApprovalDetail | null
  tender_process: TenderProcess | null
  tender_status: TenderStatus | null
  evaluation_stage: TenderEvaluationStage | null
  comparative_statement_vetted: boolean
  negotiation_done: boolean
  order_placed: boolean
  contract_executed: boolean
  is_cancelled: boolean
  cancellation_reason: string | null
}

export interface Document {
  id: string
  requisition_id: string
  tender_id: string | null
  bid_id: string | null
  order_id: string | null
  category: DocumentCategory
  description: string | null
  file_name: string
  file_path: string
  file_type: string | null
  file_size: number | null
  uploaded_by: string
  uploader_name: string | null
  created_at: string
}

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string; stage: string }[] = [
  { value: 'requisition_user_docs', label: 'Indentor/User Documents', stage: 'Requisition Creation' },
  { value: 'internal_approval_docs', label: 'Internal Approval Documents', stage: 'Internal Approval' },
  { value: 'tender_document', label: 'Tender Documents', stage: 'Tender Creation' },
  { value: 'tender_vetted_docs', label: 'Vetted Tender Documents', stage: 'Tender Creation' },
  { value: 'bid_documents', label: 'Bid Documents', stage: 'Bidding' },
  { value: 'technical_evaluation', label: 'Technical Evaluation', stage: 'Technical Evaluation' },
  { value: 'technical_query_sheet', label: 'Technical Query Sheet', stage: 'Technical Evaluation' },
  { value: 'commercial_evaluation', label: 'Commercial Evaluation', stage: 'Commercial Evaluation' },
  { value: 'commercial_query_sheet', label: 'Commercial Query Sheet', stage: 'Commercial Evaluation' },
  { value: 'revised_evaluation', label: 'Revised Evaluation', stage: 'Revised Evaluation' },
  { value: 'comparative_statement', label: 'Comparative Statement', stage: 'Comparative Statement' },
  { value: 'price_bid_docs', label: 'Price Bid Documents', stage: 'Price Bid Opening' },
  { value: 'negotiation_docs', label: 'Negotiation Documents', stage: 'Negotiation' },
  { value: 'tender_committee_docs', label: 'Tender Committee Documents', stage: 'TC Recommendation' },
  { value: 'order_documents', label: 'Order Documents', stage: 'Order Placement' },
  { value: 'contract_document', label: 'Contract Document', stage: 'Contract Signing' },
  { value: 'security_deposit', label: 'Security Deposit', stage: 'Security Deposit' },
  { value: 'execution_docs', label: 'Execution Documents', stage: 'Contract Execution' },
  { value: 'other', label: 'Other Documents', stage: 'Other' },
]
