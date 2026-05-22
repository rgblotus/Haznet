from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, ForeignKey, Text, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base
from app.models.enums import (
    UserRole, RequisitionStatus, TenderStatus, OrderStatus, PostOrderStatus,
    Priority, HODCNPApproval, InventoryCheckStatus, ProcurementMethod, QualityStatus,
    Designation, VendorStatus, RequisitionStage, InternalApprovalStatus,
    TenderEvaluationStage, TenderCancellationReason, OrderStatusExtended,
    DocumentCategory,
)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    employee_id = Column(String(50), unique=True, nullable=True)
    contact = Column(String(20), nullable=True)
    designation = Column(SAEnum(Designation, name="designation"), nullable=True)
    avatar = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    role = Column(SAEnum(UserRole, name="user_role"), nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    department = relationship("Department", back_populates="users", foreign_keys=[department_id])
    requisitions_created = relationship("Requisition", back_populates="creator", foreign_keys="Requisition.creator_id")
    requisitions_owned = relationship("Requisition", back_populates="current_owner", foreign_keys="Requisition.current_owner_id")
    sent_messages = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")
    received_messages = relationship("Message", back_populates="receiver", foreign_keys="Message.receiver_id")


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(Text, default="")
    hod_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="department", foreign_keys="User.department_id")
    hod = relationship("User", foreign_keys=[hod_user_id])


class Requisition(Base):
    __tablename__ = "requisitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requisition_no = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)  # materials / services / equipment
    status = Column(SAEnum(RequisitionStatus, name="requisition_status"), default=RequisitionStatus.DRAFT)
    priority = Column(SAEnum(Priority, name="priority"), default=Priority.MEDIUM)

    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    current_owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=False)

    quantity = Column(Integer, default=1)
    unit_price_estimate = Column(Float, nullable=True)
    total_estimate = Column(Float, nullable=True)
    currency = Column(String(10), default="USD")
    required_by_date = Column(DateTime(timezone=True), nullable=True)
    justification = Column(Text, nullable=True)
    specifications = Column(Text, nullable=True)

    # Workflow tracking
    hodi_cnp_approval = Column(SAEnum(HODCNPApproval, name="hodi_cnp_approval"), default=HODCNPApproval.PENDING)
    inventory_check_status = Column(SAEnum(InventoryCheckStatus, name="inventory_check_status"), default=InventoryCheckStatus.NOT_CHECKED)
    procurement_method = Column(SAEnum(ProcurementMethod, name="procurement_method"), nullable=True)
    tender_id = Column(UUID(as_uuid=True), ForeignKey("tenders.id"), nullable=True)

    # New fields
    financial_year = Column(String(20), nullable=True)
    sap_requisition_number = Column(String(8), nullable=True, index=True)
    requisition_create_date = Column(DateTime(timezone=True), nullable=True)
    requisition_hod_release_date = Column(DateTime(timezone=True), nullable=True)
    job_description = Column(String(300), nullable=True)
    cost_estimate = Column(Float, nullable=True)
    startup_applicable = Column(Boolean, default=False)
    industry = Column(String(100), nullable=True)
    sector = Column(String(100), nullable=True)
    contract_period_months = Column(Integer, nullable=True)
    integrity_pact = Column(Boolean, default=False)
    file_reference = Column(String(100), unique=True, nullable=True, index=True)

    # Workflow history
    return_reason = Column(Text, nullable=True)
    returned_to_indentor = Column(Boolean, default=False)
    assigned_to_procurement = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    creator = relationship("User", back_populates="requisitions_created", foreign_keys=[creator_id])
    current_owner = relationship("User", back_populates="requisitions_owned", foreign_keys=[current_owner_id])
    department = relationship("Department")
    tender = relationship("Tender", back_populates="requisition", foreign_keys="Tender.requisition_id")
    messages = relationship("Message", back_populates="requisition")
    orders = relationship("Order", back_populates="requisition")
    documents = relationship("Document", back_populates="requisition", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requisition_id = Column(UUID(as_uuid=True), ForeignKey("requisitions.id"), nullable=False, index=True)
    tender_id = Column(UUID(as_uuid=True), ForeignKey("tenders.id"), nullable=True, index=True)
    bid_id = Column(UUID(as_uuid=True), ForeignKey("bids.id"), nullable=True, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True, index=True)
    
    category = Column(SAEnum(DocumentCategory, name="document_category"), default=DocumentCategory.OTHER)
    description = Column(String(255), nullable=True)
    
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=True)
    file_size = Column(Integer, nullable=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    requisition = relationship("Requisition", back_populates="documents")
    tender = relationship("Tender", foreign_keys=[tender_id])
    bid = relationship("Bid", foreign_keys=[bid_id])
    order = relationship("Order", foreign_keys=[order_id])
    uploader = relationship("User")


class Tender(Base):
    __tablename__ = "tenders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_no = Column(String(50), unique=True, nullable=False)
    requisition_id = Column(UUID(as_uuid=True), ForeignKey("requisitions.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(SAEnum(TenderStatus, name="tender_status"), default=TenderStatus.DRAFT)

    issue_date = Column(DateTime(timezone=True), nullable=True)
    closing_date = Column(DateTime(timezone=True), nullable=True)
    evaluation_method = Column(String(100), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    requisition = relationship("Requisition", back_populates="tender", foreign_keys=[requisition_id])
    bids = relationship("Bid", back_populates="tender")


class Bid(Base):
    __tablename__ = "bids"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id = Column(UUID(as_uuid=True), ForeignKey("tenders.id"), nullable=False)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    validity_days = Column(Integer, nullable=True)
    technical_score = Column(Float, nullable=True)
    financial_score = Column(Float, nullable=True)
    total_score = Column(Float, nullable=True)
    is_awarded = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tender = relationship("Tender", back_populates="bids")
    vendor = relationship("Vendor")


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    contact_person = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    status = Column(SAEnum(VendorStatus, name="vendor_status"), default=VendorStatus.ACTIVE)
    rating = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_no = Column(String(50), unique=True, nullable=False, index=True)
    requisition_id = Column(UUID(as_uuid=True), ForeignKey("requisitions.id"), nullable=True)
    tender_id = Column(UUID(as_uuid=True), ForeignKey("tenders.id"), nullable=True)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id"), nullable=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SAEnum(OrderStatus, name="order_status"), default=OrderStatus.DRAFT)

    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    currency = Column(String(10), default="USD")

    order_date = Column(DateTime(timezone=True), nullable=True)
    delivery_date = Column(DateTime(timezone=True), nullable=True)
    delivery_address = Column(Text, nullable=True)
    payment_terms = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    requisition = relationship("Requisition", back_populates="orders")
    vendor = relationship("Vendor")


class PostOrder(Base):
    __tablename__ = "post_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    requisition_id = Column(UUID(as_uuid=True), ForeignKey("requisitions.id"), nullable=True)

    received_quantity = Column(Integer, nullable=True)
    ordered_quantity = Column(Integer, nullable=True)
    quality_status = Column(SAEnum(QualityStatus, name="quality_status"), default=QualityStatus.PENDING)
    inspection_notes = Column(Text, nullable=True)
    discrepancy_description = Column(Text, nullable=True)

    status = Column(SAEnum(PostOrderStatus, name="post_order_status"), default=PostOrderStatus.PENDING_INSPECTION)

    received_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    received_date = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    order = relationship("Order")
    requisition = relationship("Requisition")
    receiver = relationship("User", foreign_keys=[received_by])


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    requisition_id = Column(UUID(as_uuid=True), ForeignKey("requisitions.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sender = relationship("User", back_populates="sent_messages", foreign_keys=[sender_id])
    receiver = relationship("User", back_populates="received_messages", foreign_keys=[receiver_id])
    requisition = relationship("Requisition", back_populates="messages")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requisition_id = Column(UUID(as_uuid=True), ForeignKey("requisitions.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    requisition = relationship("Requisition", foreign_keys=[requisition_id])
    user = relationship("User", foreign_keys=[user_id])


class RequisitionStageHistory(Base):
    __tablename__ = "requisition_stage_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requisition_id = Column(UUID(as_uuid=True), ForeignKey("requisitions.id"), nullable=False, index=True)
    stage = Column(SAEnum(RequisitionStage, name="requisition_stage"), nullable=False)
    status = Column(SAEnum(InternalApprovalStatus, name="internal_approval_status"), default=InternalApprovalStatus.PENDING)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    completed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    requisition = relationship("Requisition", foreign_keys=[requisition_id])
    completer = relationship("User", foreign_keys=[completed_by])


class InternalApprovalDetail(Base):
    __tablename__ = "internal_approval_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requisition_id = Column(UUID(as_uuid=True), ForeignKey("requisitions.id"), nullable=False, index=True)
    
    checklist_completed = Column(Boolean, default=False)
    checklist_completed_at = Column(DateTime(timezone=True), nullable=True)
    checklist_completed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    checklist_notes = Column(Text, nullable=True)
    
    clarification_required = Column(Boolean, default=False)
    clarification_sent_at = Column(DateTime(timezone=True), nullable=True)
    clarification_response = Column(Text, nullable=True)
    clarification_responded_at = Column(DateTime(timezone=True), nullable=True)
    
    tender_committee_recommendation = Column(Text, nullable=True)
    tender_committee_recommended_at = Column(DateTime(timezone=True), nullable=True)
    tender_committee_recommended_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    requisition = relationship("Requisition", foreign_keys=[requisition_id])


class TenderProcess(Base):
    __tablename__ = "tender_process"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id = Column(UUID(as_uuid=True), ForeignKey("tenders.id"), nullable=False, index=True)
    
    pre_bid_meeting_date = Column(DateTime(timezone=True), nullable=True)
    pre_bid_meeting_venue = Column(String(255), nullable=True)
    pre_bid_meeting_minutes = Column(Text, nullable=True)
    
    bid_creation_date = Column(DateTime(timezone=True), nullable=True)
    bid_opening_date = Column(DateTime(timezone=True), nullable=True)
    bid_closing_date = Column(DateTime(timezone=True), nullable=True)
    
    document_vetting_done = Column(Boolean, default=False)
    document_vetted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    document_vetted_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tender = relationship("Tender", foreign_keys=[tender_id])
    vetting_user = relationship("User", foreign_keys=[document_vetted_by])


class TenderEvaluation(Base):
    __tablename__ = "tender_evaluation"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id = Column(UUID(as_uuid=True), ForeignKey("tenders.id"), nullable=False, index=True)
    
    stage = Column(SAEnum(TenderEvaluationStage, name="tender_evaluation_stage"), nullable=False)
    status = Column(String(50), default="pending")
    
    technical_query_raised = Column(Boolean, default=False)
    technical_query_sheet = Column(Text, nullable=True)
    technical_query_raised_at = Column(DateTime(timezone=True), nullable=True)
    
    commercial_query_raised = Column(Boolean, default=False)
    commercial_query_sheet = Column(Text, nullable=True)
    commercial_query_raised_at = Column(DateTime(timezone=True), nullable=True)
    
    clarification_response_received = Column(Boolean, default=False)
    clarification_response_at = Column(DateTime(timezone=True), nullable=True)
    
    revised_evaluation_done = Column(Boolean, default=False)
    revised_evaluation_at = Column(DateTime(timezone=True), nullable=True)
    
    final_score = Column(Float, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    completed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tender = relationship("Tender", foreign_keys=[tender_id])
    completer = relationship("User", foreign_keys=[completed_by])


class BidEvaluationDetail(Base):
    __tablename__ = "bid_evaluation_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bid_id = Column(UUID(as_uuid=True), ForeignKey("bids.id"), nullable=False, index=True)
    tender_evaluation_id = Column(UUID(as_uuid=True), ForeignKey("tender_evaluation.id"), nullable=True)
    
    technical_score = Column(Float, nullable=True)
    technical_evaluated_at = Column(DateTime(timezone=True), nullable=True)
    technical_evaluated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    technical_remarks = Column(Text, nullable=True)
    
    commercial_score = Column(Float, nullable=True)
    commercial_evaluated_at = Column(DateTime(timezone=True), nullable=True)
    commercial_evaluated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    commercial_remarks = Column(Text, nullable=True)
    
    is_technically_qualified = Column(Boolean, default=False)
    is_commercially_acceptable = Column(Boolean, default=False)
    is_final_recommended = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    bid = relationship("Bid", foreign_keys=[bid_id])
    tender_evaluation = relationship("TenderEvaluation", foreign_keys=[tender_evaluation_id])


class ComparativeStatement(Base):
    __tablename__ = "comparative_statements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id = Column(UUID(as_uuid=True), ForeignKey("tenders.id"), nullable=False, index=True)
    
    statement_data = Column(Text, nullable=False)
    vetted = Column(Boolean, default=False)
    vetted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    vetted_at = Column(DateTime(timezone=True), nullable=True)
    vetting_remarks = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tender = relationship("Tender", foreign_keys=[tender_id])
    vetter = relationship("User", foreign_keys=[vetted_by])


class TenderNegotiation(Base):
    __tablename__ = "tender_negotiations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id = Column(UUID(as_uuid=True), ForeignKey("tenders.id"), nullable=False, index=True)
    bid_id = Column(UUID(as_uuid=True), ForeignKey("bids.id"), nullable=False)
    
    negotiation_notes = Column(Text, nullable=True)
    final_negotiated_price = Column(Float, nullable=True)
    negotiated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    negotiated_at = Column(DateTime(timezone=True), nullable=True)
    accounts_consulted = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tender = relationship("Tender", foreign_keys=[tender_id])
    bid = relationship("Bid", foreign_keys=[bid_id])
    negotiator = relationship("User", foreign_keys=[negotiated_by])


class TenderCommitteeRecommendation(Base):
    __tablename__ = "tender_committee_recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id = Column(UUID(as_uuid=True), ForeignKey("tenders.id"), nullable=False, index=True)
    
    recommendation_type = Column(String(100), nullable=False)
    recommended_bid_id = Column(UUID(as_uuid=True), ForeignKey("bids.id"), nullable=True)
    recommended_vendor_name = Column(String(255), nullable=True)
    recommended_amount = Column(Float, nullable=True)
    
    recommendation_text = Column(Text, nullable=True)
    recommended_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    recommended_at = Column(DateTime(timezone=True), nullable=True)
    
    approved = Column(Boolean, default=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tender = relationship("Tender", foreign_keys=[tender_id])
    recommended_bid = relationship("Bid", foreign_keys=[recommended_bid_id])
    recommender = relationship("User", foreign_keys=[recommended_by])
    approver = relationship("User", foreign_keys=[approved_by])


class OrderExecutionDetail(Base):
    __tablename__ = "order_execution_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    
    bidder_accepted = Column(Boolean, default=False)
    bidder_accepted_at = Column(DateTime(timezone=True), nullable=True)
    
    contract_signed = Column(Boolean, default=False)
    contract_signed_at = Column(DateTime(timezone=True), nullable=True)
    contract_document_path = Column(String(500), nullable=True)
    
    security_deposit_submitted = Column(Boolean, default=False)
    security_deposit_amount = Column(Float, nullable=True)
    security_deposit_submitted_at = Column(DateTime(timezone=True), nullable=True)
    security_deposit_details = Column(Text, nullable=True)
    
    forwarded_to_engineer = Column(Boolean, default=False)
    forwarded_at = Column(DateTime(timezone=True), nullable=True)
    engineer_in_charge_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    order = relationship("Order", foreign_keys=[order_id])
    engineer = relationship("User", foreign_keys=[engineer_in_charge_id])


class TenderCancellation(Base):
    __tablename__ = "tender_cancellations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id = Column(UUID(as_uuid=True), ForeignKey("tenders.id"), nullable=False, index=True)
    requisition_id = Column(UUID(as_uuid=True), ForeignKey("requisitions.id"), nullable=True)
    
    reason = Column(SAEnum(TenderCancellationReason, name="tender_cancellation_reason"), nullable=False)
    cancellation_notes = Column(Text, nullable=True)
    
    l1_backout = Column(Boolean, default=False)
    new_lowest_bid_id = Column(UUID(as_uuid=True), ForeignKey("bids.id"), nullable=True)
    
    cancelled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), server_default=func.now())
    
    requisition_status_after = Column(String(50), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tender = relationship("Tender", foreign_keys=[tender_id])
    requisition = relationship("Requisition", foreign_keys=[requisition_id])
    canceller = relationship("User", foreign_keys=[cancelled_by])
    new_lowest_bid = relationship("Bid", foreign_keys=[new_lowest_bid_id])
