from enum import Enum


class UserRole(str, Enum):
    INDENTOR = "indentor"
    HOD = "hod"
    CNP_HOD = "cnp_hod"
    PROCUREMENT_OFFICER = "procurement_officer"
    INVENTORY_MANAGER = "inventory_manager"
    OIC = "oic"
    ADMIN = "admin"


class RequisitionStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    RETURNED = "returned"
    PENDING_INVENTORY = "pending_inventory"
    INVENTORY_CHECKED = "inventory_checked"
    PROCESSING = "processing"
    TENDER_CREATED = "tender_created"
    TENDER_AWARDED = "tender_awarded"
    ORDER_CREATED = "order_created"
    SHIPPED = "shipped"
    RECEIVING = "receiving"
    INSPECTION_PENDING = "inspection_pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TenderStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    BIDDING = "bidding"
    EVALUATING = "evaluating"
    AWARDED = "awarded"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class OrderStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    ISSUED = "issued"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    RECEIVED = "received"
    CANCELLED = "cancelled"


class PostOrderStatus(str, Enum):
    PENDING_INSPECTION = "pending_inspection"
    IN_PROGRESS = "in_progress"
    PASSED = "passed"
    FAILED = "failed"
    DISCREPANCY = "discrepancy"
    COMPLETED = "completed"


class Priority(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class HODCNPApproval(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    RETURNED = "Returned"
    REJECTED = "Rejected"


class InventoryCheckStatus(str, Enum):
    NOT_CHECKED = "NotChecked"
    AVAILABLE = "Available"
    SURPLUS = "Surplus"
    ORDERED = "Ordered"
    REQUIRED = "Required"


class ProcurementMethod(str, Enum):
    DIRECT = "Direct"
    TENDER = "Tender"


class QualityStatus(str, Enum):
    PENDING = "Pending"
    PASSED = "Passed"
    FAILED = "Failed"
    PARTIAL = "Partial"


class Designation(str, Enum):
    E1 = "Officer"
    E2 = "Senior Officer"
    E3 = "Manager"
    E4 = "Senior Manager"
    E5 = "Chief Manager"
    E6 = "Dy. General Manager"
    E7 = "General Manager"
    E8 = "Chief General Manager"


class VendorStatus(str, Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
