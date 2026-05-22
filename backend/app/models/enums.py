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
    TENDER_AWAITING = "tender_awaiting"
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


class RequisitionStage(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    INTERNAL_APPROVAL = "internal_approval"
    TENDER_CREATION = "tender_creation"
    TENDER_EVALUATION = "tender_evaluation"
    POST_TENDER = "post_tender"
    ORDER_CREATED = "order_created"
    CONTRACT_EXECUTED = "contract_executed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class InternalApprovalStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    CLARIFICATION_REQUIRED = "clarification_required"
    COMPLETED = "completed"
    REJECTED = "rejected"


class TenderEvaluationStage(str, Enum):
    BID_OPENING = "bid_opening"
    TECHNICAL_EVALUATION = "technical_evaluation"
    COMMERCIAL_EVALUATION = "commercial_evaluation"
    CLARIFICATIONS = "clarifications"
    REVISED_EVALUATION = "revised_evaluation"
    FINAL_TECHNICAL = "final_technical"
    FINAL_COMMERCIAL = "final_commercial"
    PRICE_BID_OPENING = "price_bid_opening"
    COMPARATIVE_STATEMENT = "comparative_statement"
    NEGOTIATION = "negotiation"
    TENDER_COMMITTEE_RECOMMENDATION = "tender_committee_recommendation"
    ORDER_PLACEMENT = "order_placement"


class TenderCancellationReason(str, Enum):
    TECHNICAL_REJECTION = "technical_rejection"
    BUDGET_CONSTRAINT = "budget_constraint"
    NO_BIDS_RECEIVED = "no_bids_received"
    L1_BACKOUT = "l1_backout"
    ADMINISTRATIVE = "administrative"
    OTHER = "other"


class OrderStatusExtended(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    ISSUED = "issued"
    ACCEPTED = "accepted"
    CONTRACT_SIGNED = "contract_signed"
    SECURITY_DEPOSIT_SUBMITTED = "security_deposit_submitted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DocumentCategory(str, Enum):
    REQUISITION_USER_DOCS = "requisition_user_docs"
    INTERNAL_APPROVAL_DOCS = "internal_approval_docs"
    TENDER_DOCUMENT = "tender_document"
    TENDER_VETTED_DOCS = "tender_vetted_docs"
    BID_DOCUMENTS = "bid_documents"
    TECHNICAL_EVALUATION = "technical_evaluation"
    TECHNICAL_QUERY_SHEET = "technical_query_sheet"
    COMMERCIAL_EVALUATION = "commercial_evaluation"
    COMMERCIAL_QUERY_SHEET = "commercial_query_sheet"
    REVISED_EVALUATION = "revised_evaluation"
    COMPARATIVE_STATEMENT = "comparative_statement"
    PRICE_BID_DOCS = "price_bid_docs"
    NEGOTIATION_DOCS = "negotiation_docs"
    TENDER_COMMITTEE_DOCS = "tender_committee_docs"
    ORDER_DOCUMENTS = "order_documents"
    CONTRACT_DOCUMENT = "contract_document"
    SECURITY_DEPOSIT = "security_deposit"
    EXECUTION_DOCS = "execution_docs"
    OTHER = "other"
