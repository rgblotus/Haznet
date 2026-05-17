from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, ForeignKey, Text, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base
from app.models.enums import UserRole, RequisitionStatus, TenderStatus, OrderStatus, PostOrderStatus, Priority, HODCNPApproval, InventoryCheckStatus, ProcurementMethod, QualityStatus, Designation, VendorStatus


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
    requisition_id = Column(UUID(as_uuid=True), ForeignKey("requisitions.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=True)
    file_size = Column(Integer, nullable=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    requisition = relationship("Requisition", back_populates="documents")
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
