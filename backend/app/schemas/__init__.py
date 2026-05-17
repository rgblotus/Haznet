from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Generic, TypeVar, List
from datetime import datetime
from uuid import UUID
from app.models.enums import UserRole, RequisitionStatus, TenderStatus, OrderStatus, PostOrderStatus, Designation, Priority, VendorStatus, HODCNPApproval, InventoryCheckStatus, ProcurementMethod, QualityStatus

__all__ = [
    "UserRole", "RequisitionStatus", "TenderStatus", "OrderStatus",
    "PostOrderStatus", "Designation", "Priority", "VendorStatus",
    "HODCNPApproval", "InventoryCheckStatus", "ProcurementMethod", "QualityStatus",
]

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
    created_at: datetime
    updated_at: datetime

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
