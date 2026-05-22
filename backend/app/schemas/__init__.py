from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Generic, TypeVar, List
from datetime import datetime
from uuid import UUID
from app.models.enums import (
    UserRole,
    RequisitionStatus,
    TenderStatus,
    OrderStatus,
    PostOrderStatus,
    Designation,
    Priority,
    VendorStatus,
    HODCNPApproval,
    InventoryCheckStatus,
    ProcurementMethod,
    QualityStatus,
    RequisitionStage,
    InternalApprovalStatus,
    TenderEvaluationStage,
    TenderCancellationReason,
    OrderStatusExtended,
    DocumentCategory,
)

T = TypeVar("T")


class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    meta: PaginationMeta


class CursorParams(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


def create_pagination_meta(total: int, page: int, page_size: int) -> PaginationMeta:
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return PaginationMeta(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


# ── Auth ──────────────────────────────────────────────


class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: UUID
    username: str
    email: str
    first_name: str
    last_name: str
    employee_id: Optional[str] = None
    contact: Optional[str] = None
    designation: Optional[Designation] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    role: UserRole
    department_id: Optional[UUID] = None
    is_active: bool
    created_at: Optional[datetime] = None

    department_name: Optional[str] = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    employee_id: Optional[str] = Field(None, max_length=50)
    contact: Optional[str] = Field(None, max_length=20)
    designation: Optional[Designation] = None
    avatar: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = None
    role: UserRole
    department_id: Optional[UUID] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    employee_id: Optional[str] = Field(None, max_length=50)
    contact: Optional[str] = Field(None, max_length=20)
    designation: Optional[Designation] = None
    avatar: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = None
    role: Optional[UserRole] = None
    department_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6)


# ── Department ───────────────────────────────────────


class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=20)
    description: str = ""
    hod_user_id: Optional[UUID] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    description: Optional[str] = None
    hod_user_id: Optional[UUID] = None


class DepartmentOut(BaseModel):
    id: UUID
    name: str
    code: str
    description: str
    hod_user_id: Optional[UUID] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Requisition ──────────────────────────────────────


class RequisitionCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)
    priority: Priority = Priority.MEDIUM
    quantity: int = Field(..., ge=1)
    unit_price_estimate: Optional[float] = None
    total_estimate: Optional[float] = None
    currency: str = "USD"
    required_by_date: Optional[datetime] = None
    justification: Optional[str] = None
    specifications: Optional[str] = None
    financial_year: Optional[str] = None
    sap_requisition_number: Optional[str] = Field(None, max_length=8)
    requisition_create_date: Optional[datetime] = None
    requisition_hod_release_date: Optional[datetime] = None
    job_description: Optional[str] = Field(None, max_length=300)
    cost_estimate: Optional[float] = None
    startup_applicable: bool = False
    industry: Optional[str] = Field(None, max_length=100)
    sector: Optional[str] = Field(None, max_length=100)
    contract_period_months: Optional[int] = None


class RequisitionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[Priority] = None
    quantity: Optional[int] = None
    unit_price_estimate: Optional[float] = None
    total_estimate: Optional[float] = None
    currency: Optional[str] = None
    required_by_date: Optional[datetime] = None
    justification: Optional[str] = None
    specifications: Optional[str] = None
    financial_year: Optional[str] = None
    sap_requisition_number: Optional[str] = None
    requisition_hod_release_date: Optional[datetime] = None
    job_description: Optional[str] = None
    cost_estimate: Optional[float] = None
    startup_applicable: Optional[bool] = None
    industry: Optional[str] = None
    sector: Optional[str] = None
    contract_period_months: Optional[int] = None


class RequisitionOut(BaseModel):
    id: UUID
    requisition_no: str
    title: str
    description: str
    category: str
    status: RequisitionStatus
    priority: Priority
    creator_id: UUID
    current_owner_id: Optional[UUID] = None
    department_id: UUID
    quantity: int
    unit_price_estimate: Optional[float] = None
    total_estimate: Optional[float] = None
    currency: str
    required_by_date: Optional[datetime] = None
    justification: Optional[str] = None
    specifications: Optional[str] = None
    hodi_cnp_approval: Optional[HODCNPApproval] = None
    inventory_check_status: Optional[InventoryCheckStatus] = None
    procurement_method: Optional[ProcurementMethod] = None
    tender_id: Optional[UUID] = None
    financial_year: Optional[str] = None
    sap_requisition_number: Optional[str] = None
    requisition_create_date: Optional[datetime] = None
    requisition_hod_release_date: Optional[datetime] = None
    job_description: Optional[str] = None
    cost_estimate: Optional[float] = None
    startup_applicable: bool = False
    industry: Optional[str] = None
    sector: Optional[str] = None
    contract_period_months: Optional[int] = None
    integrity_pact: bool = False
    file_reference: Optional[str] = None
    return_reason: Optional[str] = None
    returned_to_indentor: bool = False
    assigned_to_procurement: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkflowAction(BaseModel):
    reason: Optional[str] = None
    assign_to: Optional[UUID] = None


# ── Document ─────────────────────────────────────────


class DocumentCreate(BaseModel):
    requisition_id: Optional[UUID] = None
    tender_id: Optional[UUID] = None
    bid_id: Optional[UUID] = None
    order_id: Optional[UUID] = None
    category: DocumentCategory = DocumentCategory.OTHER
    description: Optional[str] = None
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None


class DocumentOut(BaseModel):
    id: UUID
    requisition_id: UUID
    tender_id: Optional[UUID] = None
    bid_id: Optional[UUID] = None
    order_id: Optional[UUID] = None
    category: DocumentCategory = DocumentCategory.OTHER
    description: Optional[str] = None
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_by: UUID
    uploader_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Tender ───────────────────────────────────────────


class TenderCreate(BaseModel):
    requisition_id: Optional[UUID] = None
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    issue_date: Optional[datetime] = None
    closing_date: Optional[datetime] = None
    evaluation_method: Optional[str] = None


class TenderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TenderStatus] = None
    issue_date: Optional[datetime] = None
    closing_date: Optional[datetime] = None
    evaluation_method: Optional[str] = None


class TenderOut(BaseModel):
    id: UUID
    tender_no: str
    requisition_id: Optional[UUID] = None
    title: str
    description: str
    status: TenderStatus
    issue_date: Optional[datetime] = None
    closing_date: Optional[datetime] = None
    evaluation_method: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Bid ──────────────────────────────────────────────


class BidCreate(BaseModel):
    tender_id: UUID
    vendor_id: UUID
    amount: float = Field(..., gt=0)
    currency: str = "USD"
    validity_days: Optional[int] = None


class BidOut(BaseModel):
    id: UUID
    tender_id: UUID
    vendor_id: UUID
    amount: float
    currency: str
    validity_days: Optional[int] = None
    technical_score: Optional[float] = None
    financial_score: Optional[float] = None
    total_score: Optional[float] = None
    is_awarded: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Vendor ───────────────────────────────────────────


class VendorCreate(BaseModel):
    name: str = Field(..., min_length=1)
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    category: Optional[str] = None


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    category: Optional[str] = None
    status: Optional[VendorStatus] = None
    rating: Optional[float] = None


class VendorOut(BaseModel):
    id: UUID
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    category: Optional[str] = None
    status: VendorStatus
    rating: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Order ────────────────────────────────────────────


class OrderCreate(BaseModel):
    requisition_id: Optional[UUID] = None
    tender_id: Optional[UUID] = None
    vendor_id: UUID
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    quantity: int = Field(..., ge=1)
    unit_price: Optional[float] = None
    total_amount: Optional[float] = None
    currency: str = "USD"
    delivery_date: Optional[datetime] = None
    delivery_address: Optional[str] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    total_amount: Optional[float] = None
    delivery_date: Optional[datetime] = None
    delivery_address: Optional[str] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None


class OrderOut(BaseModel):
    id: UUID
    order_no: str
    requisition_id: Optional[UUID] = None
    tender_id: Optional[UUID] = None
    vendor_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    status: OrderStatus
    quantity: int
    unit_price: Optional[float] = None
    total_amount: Optional[float] = None
    currency: str
    order_date: Optional[datetime] = None
    delivery_date: Optional[datetime] = None
    delivery_address: Optional[str] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Post-Order ───────────────────────────────────────


class PostOrderCreate(BaseModel):
    order_id: UUID
    requisition_id: Optional[UUID] = None
    received_quantity: Optional[int] = None
    ordered_quantity: Optional[int] = None
    inspection_notes: Optional[str] = None


class PostOrderUpdate(BaseModel):
    quality_status: Optional[QualityStatus] = None
    discrepancy_description: Optional[str] = None
    status: Optional[PostOrderStatus] = None
    inspection_notes: Optional[str] = None


class PostOrderOut(BaseModel):
    id: UUID
    order_id: UUID
    requisition_id: Optional[UUID] = None
    received_quantity: Optional[int] = None
    ordered_quantity: Optional[int] = None
    quality_status: QualityStatus
    inspection_notes: Optional[str] = None
    discrepancy_description: Optional[str] = None
    status: PostOrderStatus
    received_by: Optional[UUID] = None
    received_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Message ──────────────────────────────────────────


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    receiver_id: Optional[UUID] = None
    requisition_id: Optional[UUID] = None


class MessageOut(BaseModel):
    id: UUID
    content: str
    sender_id: UUID
    receiver_id: Optional[UUID] = None
    requisition_id: Optional[UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Dashboard / Stats ────────────────────────────────


class DashboardStats(BaseModel):
    total_requisitions: int
    pending_approval: int
    in_progress: int
    completed: int
    overdue: int
    total_vendors: int
    active_tenders: int
    pending_orders: int
    pending_receipts: int
    my_pending: int


# ── Activity Log ─────────────────────────────────────


class ActivityItem(BaseModel):
    id: str
    type: str
    title: str
    status: str
    updated_at: str


class ActivityLogOut(BaseModel):
    id: UUID
    requisition_id: UUID
    user_id: UUID
    action: str
    details: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: datetime
    user_name: Optional[str] = None

    model_config = {"from_attributes": True}


class RequisitionStageHistoryOut(BaseModel):
    id: UUID
    requisition_id: UUID
    stage: RequisitionStage
    status: InternalApprovalStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    completed_by: Optional[UUID] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class InternalApprovalDetailOut(BaseModel):
    id: UUID
    requisition_id: UUID
    checklist_completed: bool = False
    checklist_completed_at: Optional[datetime] = None
    checklist_notes: Optional[str] = None
    clarification_required: bool = False
    clarification_sent_at: Optional[datetime] = None
    clarification_response: Optional[str] = None
    clarification_responded_at: Optional[datetime] = None
    tender_committee_recommendation: Optional[str] = None
    tender_committee_recommended_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class InternalApprovalDetailUpdate(BaseModel):
    checklist_completed: Optional[bool] = None
    checklist_notes: Optional[str] = None
    clarification_required: Optional[bool] = None
    clarification_response: Optional[str] = None
    tender_committee_recommendation: Optional[str] = None


class TenderProcessOut(BaseModel):
    id: UUID
    tender_id: UUID
    pre_bid_meeting_date: Optional[datetime] = None
    pre_bid_meeting_venue: Optional[str] = None
    pre_bid_meeting_minutes: Optional[str] = None
    bid_creation_date: Optional[datetime] = None
    bid_opening_date: Optional[datetime] = None
    bid_closing_date: Optional[datetime] = None
    document_vetting_done: bool = False
    document_vetted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TenderProcessUpdate(BaseModel):
    pre_bid_meeting_date: Optional[datetime] = None
    pre_bid_meeting_venue: Optional[str] = None
    pre_bid_meeting_minutes: Optional[str] = None
    bid_creation_date: Optional[datetime] = None
    bid_opening_date: Optional[datetime] = None
    bid_closing_date: Optional[datetime] = None
    document_vetting_done: Optional[bool] = None


class TenderEvaluationOut(BaseModel):
    id: UUID
    tender_id: UUID
    stage: TenderEvaluationStage
    status: str = "pending"
    technical_query_raised: bool = False
    technical_query_sheet: Optional[str] = None
    commercial_query_raised: bool = False
    commercial_query_sheet: Optional[str] = None
    clarification_response_received: bool = False
    revised_evaluation_done: bool = False
    final_score: Optional[float] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class TenderEvaluationCreate(BaseModel):
    tender_id: UUID
    stage: TenderEvaluationStage


class TenderEvaluationUpdate(BaseModel):
    status: Optional[str] = None
    technical_query_raised: Optional[bool] = None
    technical_query_sheet: Optional[str] = None
    commercial_query_raised: Optional[bool] = None
    commercial_query_sheet: Optional[str] = None
    clarification_response_received: Optional[bool] = None
    revised_evaluation_done: Optional[bool] = None
    final_score: Optional[float] = None
    notes: Optional[str] = None


class BidEvaluationDetailOut(BaseModel):
    id: UUID
    bid_id: UUID
    tender_evaluation_id: Optional[UUID] = None
    technical_score: Optional[float] = None
    technical_evaluated_at: Optional[datetime] = None
    technical_remarks: Optional[str] = None
    commercial_score: Optional[float] = None
    commercial_evaluated_at: Optional[datetime] = None
    commercial_remarks: Optional[str] = None
    is_technically_qualified: bool = False
    is_commercially_acceptable: bool = False
    is_final_recommended: bool = False

    model_config = {"from_attributes": True}


class BidEvaluationDetailUpdate(BaseModel):
    technical_score: Optional[float] = None
    technical_remarks: Optional[str] = None
    commercial_score: Optional[float] = None
    commercial_remarks: Optional[str] = None
    is_technically_qualified: Optional[bool] = None
    is_commercially_acceptable: Optional[bool] = None
    is_final_recommended: Optional[bool] = None


class ComparativeStatementOut(BaseModel):
    id: UUID
    tender_id: UUID
    statement_data: str
    vetted: bool = False
    vetted_at: Optional[datetime] = None
    vetting_remarks: Optional[str] = None

    model_config = {"from_attributes": True}


class ComparativeStatementCreate(BaseModel):
    tender_id: UUID
    statement_data: str


class ComparativeStatementUpdate(BaseModel):
    statement_data: Optional[str] = None
    vetted: Optional[bool] = None
    vetting_remarks: Optional[str] = None


class TenderNegotiationOut(BaseModel):
    id: UUID
    tender_id: UUID
    bid_id: UUID
    negotiation_notes: Optional[str] = None
    final_negotiated_price: Optional[float] = None
    negotiated_at: Optional[datetime] = None
    accounts_consulted: bool = False

    model_config = {"from_attributes": True}


class TenderNegotiationCreate(BaseModel):
    tender_id: UUID
    bid_id: UUID
    negotiation_notes: Optional[str] = None
    final_negotiated_price: Optional[float] = None
    accounts_consulted: Optional[bool] = None


class TenderCommitteeRecommendationOut(BaseModel):
    id: UUID
    tender_id: UUID
    recommendation_type: str
    recommended_bid_id: Optional[UUID] = None
    recommended_vendor_name: Optional[str] = None
    recommended_amount: Optional[float] = None
    recommendation_text: Optional[str] = None
    recommended_at: Optional[datetime] = None
    approved: bool = False
    approved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TenderCommitteeRecommendationCreate(BaseModel):
    tender_id: UUID
    recommendation_type: str
    recommended_bid_id: Optional[UUID] = None
    recommended_vendor_name: Optional[str] = None
    recommended_amount: Optional[float] = None
    recommendation_text: Optional[str] = None


class OrderExecutionDetailOut(BaseModel):
    id: UUID
    order_id: UUID
    bidder_accepted: bool = False
    bidder_accepted_at: Optional[datetime] = None
    contract_signed: bool = False
    contract_signed_at: Optional[datetime] = None
    contract_document_path: Optional[str] = None
    security_deposit_submitted: bool = False
    security_deposit_amount: Optional[float] = None
    security_deposit_submitted_at: Optional[datetime] = None
    forwarded_to_engineer: bool = False
    forwarded_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class OrderExecutionDetailUpdate(BaseModel):
    bidder_accepted: Optional[bool] = None
    contract_signed: Optional[bool] = None
    contract_document_path: Optional[str] = None
    security_deposit_submitted: Optional[bool] = None
    security_deposit_amount: Optional[float] = None
    security_deposit_details: Optional[str] = None
    forwarded_to_engineer: Optional[bool] = None
    engineer_in_charge_id: Optional[UUID] = None


class TenderCancellationOut(BaseModel):
    id: UUID
    tender_id: UUID
    requisition_id: Optional[UUID] = None
    reason: TenderCancellationReason
    cancellation_notes: Optional[str] = None
    l1_backout: bool = False
    new_lowest_bid_id: Optional[UUID] = None
    cancelled_by: Optional[UUID] = None
    cancelled_at: datetime
    requisition_status_after: Optional[str] = None

    model_config = {"from_attributes": True}


class TenderCancellationCreate(BaseModel):
    tender_id: UUID
    requisition_id: Optional[UUID] = None
    reason: TenderCancellationReason
    cancellation_notes: Optional[str] = None
    l1_backout: Optional[bool] = None
    new_lowest_bid_id: Optional[UUID] = None


class WorkflowStatusOut(BaseModel):
    requisition_id: UUID
    current_stage: Optional[RequisitionStage] = None
    internal_approval: Optional[InternalApprovalDetailOut] = None
    tender_process: Optional[TenderProcessOut] = None
    tender_status: Optional[TenderStatus] = None
    evaluation_stage: Optional[TenderEvaluationStage] = None
    comparative_statement_vetted: bool = False
    negotiation_done: bool = False
    order_placed: bool = False
    contract_executed: bool = False
    is_cancelled: bool = False
    cancellation_reason: Optional[str] = None
