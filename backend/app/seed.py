import sys
import os
from uuid import uuid4
from datetime import datetime, timezone, timedelta
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.models import (
    User,
    Department as DepartmentModel,
    Requisition,
    Vendor,
    Order,
    Tender,
    Bid,
    Message,
    PostOrder,
    Document,
    ActivityLog,
    RequisitionStageHistory,
    InternalApprovalDetail,
    TenderProcess,
    TenderEvaluation,
    BidEvaluationDetail,
    ComparativeStatement,
    TenderNegotiation,
    TenderCommitteeRecommendation,
    OrderExecutionDetail,
    TenderCancellation,
)
from app.models.enums import (
    UserRole,
    RequisitionStatus,
    OrderStatus,
    TenderStatus,
    PostOrderStatus,
    Priority,
    QualityStatus,
    Designation,
    VendorStatus,
    HODCNPApproval,
    InventoryCheckStatus,
    RequisitionStage,
    InternalApprovalStatus,
    DocumentCategory,
)
from app.middleware.auth import hash_password
from app.database import get_sync_engine, Base

DESIGNATION_MAP = {
    "E1": Designation.E1,
    "E2": Designation.E2,
    "E3": Designation.E3,
    "E4": Designation.E4,
    "E5": Designation.E5,
    "E6": Designation.E6,
    "E7": Designation.E7,
    "E8": Designation.E8,
}

ROLE_MAP = {
    "admin": UserRole.ADMIN,
    "oic": UserRole.OIC,
    "cnp_hod": UserRole.CNP_HOD,
    "procurement_officer": UserRole.PROCUREMENT_OFFICER,
    "inventory_manager": UserRole.INVENTORY_MANAGER,
    "hod": UserRole.HOD,
    "indentor": UserRole.INDENTOR,
}

DELETION_ORDER = [
    Document,
    ActivityLog,
    Message,
    PostOrder,
    Bid,
    Order,
    TenderCancellation,
    OrderExecutionDetail,
    TenderCommitteeRecommendation,
    TenderNegotiation,
    ComparativeStatement,
    BidEvaluationDetail,
    TenderEvaluation,
    TenderProcess,
    Tender,
    InternalApprovalDetail,
    RequisitionStageHistory,
    Requisition,
    Vendor,
    User,
    DepartmentModel,
]


def seed(db: Session, force: bool = False):
    if force:
        print("Force seeding... Clearing existing data.")
        from sqlalchemy import text
        db.execute(text("SET session_replication_role = 'replica'"))
        for model in DELETION_ORDER:
            db.query(model).delete()
        db.commit()
        db.execute(text("SET session_replication_role = 'origin'"))
        db.commit()

    if not force and db.query(DepartmentModel).first():
        print("Database already seeded. Use --force to re-seed.")
        return

    now = datetime.now(timezone.utc)

    # ── Departments ─────────────────────────────────────
    departments_data = [
        {
            "name": "Contract & Procurement",
            "code": "CNP",
            "description": "Central Contract & Procurement department handling all major procurement activities",
        },
        {
            "name": "Electrical",
            "code": "ELEC",
            "description": "Electrical Engineering Department",
        },
        {
            "name": "Mechanical",
            "code": "MECH",
            "description": "Mechanical Engineering Department",
        },
        {
            "name": "Civil",
            "code": "CIVIL",
            "description": "Civil Engineering Department",
        },
        {"name": "Operation", "code": "OPS", "description": "Operations Department"},
        {
            "name": "Finance & Accounts",
            "code": "FIN",
            "description": "Finance & Accounts Department",
        },
        {
            "name": "Humane & Resource",
            "code": "HR",
            "description": "Human Resources Department",
        },
        {
            "name": "Instrumentation",
            "code": "INST",
            "description": "Instrumentation & IT Department",
        },
        {
            "name": "Fire & Safety",
            "code": "SAF",
            "description": "Fire & Safety Department",
        },
    ]

    departments = []
    for d in departments_data:
        dept = DepartmentModel(id=uuid4(), **d)
        departments.append(dept)
    db.add_all(departments)
    db.commit()

    dept_map = {d.name: d for d in departments}

    # ── Users ────────────────────────────────────────────
    excel_path = os.path.join(
        os.path.dirname(__file__), "seed_data", "users_import.xlsx"
    )

    try:
        import pandas as pd

        df = pd.read_excel(excel_path, engine="openpyxl")

        users = []
        for _, row in df.iterrows():
            dept_name = row.get("department", "")

            user = User(
                id=uuid4(),
                username=row["username"],
                email=row["email"],
                hashed_password=hash_password(row["password"]),
                first_name=row["first_name"],
                last_name=row["last_name"],
                employee_id=row.get("employee_id"),
                contact=row.get("contact"),
                designation=DESIGNATION_MAP.get(row.get("designation", "")),
                role=ROLE_MAP.get(row.get("role", ""), UserRole.INDENTOR),
                department_id=dept_map[dept_name].id
                if dept_name and dept_name in dept_map
                else None,
                is_active=True,
            )
            db.add(user)
            users.append(user)
        db.commit()
        print(f"Imported {len(users)} users from Excel")

    except Exception as e:
        print(f"Error reading Excel file: {e}")
        print("Please ensure pandas and openpyxl are installed")
        return

    user_map = {u.username: u for u in users}
    # Set CNP_HOD as hod of CNP dept
    cnp_dept = dept_map["Contract & Procurement"]
    cnp_hod = user_map.get("cnp.hod")
    if cnp_hod:
        cnp_dept.hod_user_id = cnp_hod.id
        db.commit()

    # ── Vendors ──────────────────────────────────────────
    vendors_data = [
        {
            "name": "SteelWorks Industries",
            "contact_person": "Mr. Chandrashekar Rao",
            "email": "chandru@steelworks.com",
            "phone": "+91-9876543210",
            "address": "Plot 45, Industrial Area Phase II, Mumbai 400072",
            "category": "Raw Materials",
            "rating": 4.5,
        },
        {
            "name": "ElectroSupply Co.",
            "contact_person": "Ms. Lakshmi Narayanan",
            "email": "lakshmi@electrosupply.com",
            "phone": "+91-9876543211",
            "address": "No. 12, Electronics City, Bangalore 560100",
            "category": "Electrical Equipment",
            "rating": 4.2,
        },
        {
            "name": "BuildRight Materials",
            "contact_person": "Mr. Suresh Desai",
            "email": "desai@buildright.com",
            "phone": "+91-9876543212",
            "address": "78, Construction Avenue, Chennai 600001",
            "category": "Construction",
            "rating": 4.0,
        },
        {
            "name": "MachineryPro Ltd.",
            "contact_person": "Dr. Sunil Verma",
            "email": "verma@machinerypro.com",
            "phone": "+91-9876543213",
            "address": "Industrial Zone, Pune 411001",
            "category": "Heavy Machinery",
            "rating": 4.7,
        },
        {
            "name": "SafetyFirst Supplies",
            "contact_person": "Ms. Priya Gupta",
            "email": "gupta@safetyfirst.com",
            "phone": "+91-9876543214",
            "address": "42, Safety Park, Hyderabad 500001",
            "category": "Safety Equipment",
            "rating": 4.3,
        },
        {
            "name": "TechComponents Inc.",
            "contact_person": "Mr. Rajesh Kumar",
            "email": "rajesh@techcomp.com",
            "phone": "+91-9876543215",
            "address": "IT Hub, Cyberabad 500081",
            "category": "IT Equipment",
            "rating": 4.6,
        },
        {
            "name": "HydraWorks Hydraulics",
            "contact_person": "Mr. Anand Sharma",
            "email": "anand@hydraworks.com",
            "phone": "+91-9876543216",
            "address": "Sector 15, Gurgaon 122001",
            "category": "Hydraulic Systems",
            "rating": 4.1,
        },
        {
            "name": "Precision Tools Ltd.",
            "contact_person": "Ms. Anita Joshi",
            "email": "anita@precisiontools.com",
            "phone": "+91-9876543217",
            "address": "Industrial Estate, Coimbatore 641001",
            "category": "Precision Instruments",
            "rating": 4.4,
        },
    ]

    vendors = []
    for vd in vendors_data:
        v = Vendor(
            id=uuid4(),
            name=vd["name"],
            contact_person=vd.get("contact_person"),
            email=vd.get("email"),
            phone=vd.get("phone"),
            address=vd.get("address"),
            category=vd.get("category"),
            status=VendorStatus.ACTIVE,
            rating=vd.get("rating"),
        )
        db.add(v)
        vendors.append(v)
    db.flush()

    # ── Requisitions ─────────────────────────────────────
    requisitions_data = [
        {
            "title": "High-Grade Copper Cables (500mm)",
            "description": "Premium quality copper cables for electrical substation upgrade project. Must comply with IS 694:2010 standards.",
            "category": "materials",
            "priority": "High",
            "quantity": 200,
            "unit_price_estimate": 1500.0,
            "total_estimate": 300000.0,
            "required_by": now + timedelta(days=30),
            "creator": "eng.electrical1",
            "dept": "Electrical",
            "status": RequisitionStatus.PROCESSING,
        },
        {
            "title": "50-Ton Hydraulic Press Machine",
            "description": "Industrial grade hydraulic press for mechanical workshop. Includes installation and commissioning.",
            "category": "equipment",
            "priority": "High",
            "quantity": 1,
            "unit_price_estimate": 2500000.0,
            "total_estimate": 2500000.0,
            "required_by": now + timedelta(days=60),
            "creator": "eng.mechanical1",
            "dept": "Mechanical",
            "status": RequisitionStatus.SUBMITTED,
        },
        {
            "title": "Portland Cement (OPC 53 Grade)",
            "description": "500 bags of OPC 53 grade cement for civil construction phase 2. BIS certified.",
            "category": "materials",
            "priority": "High",
            "quantity": 500,
            "unit_price_estimate": 450.0,
            "total_estimate": 225000.0,
            "required_by": now + timedelta(days=15),
            "creator": "eng.civil1",
            "dept": "Civil",
            "status": RequisitionStatus.UNDER_REVIEW,
        },
        {
            "title": "Safety Helmets & High-Vis Vests",
            "description": "200 sets of IS-certified safety helmets and high-visibility vests for field workers.",
            "category": "materials",
            "priority": "Medium",
            "quantity": 200,
            "unit_price_estimate": 350.0,
            "total_estimate": 70000.0,
            "required_by": now + timedelta(days=20),
            "creator": "eng.electrical1",
            "dept": "Electrical",
            "status": RequisitionStatus.ORDER_CREATED,
        },
        {
            "title": "Complete Lab Equipment Set",
            "description": "Quality testing equipment for new materials testing lab.",
            "category": "equipment",
            "priority": "Low",
            "quantity": 5,
            "unit_price_estimate": 80000.0,
            "total_estimate": 400000.0,
            "required_by": now + timedelta(days=90),
            "creator": "eng.mechanical1",
            "dept": "Mechanical",
            "status": RequisitionStatus.DRAFT,
        },
        {
            "title": "Network Switches & Routers",
            "description": "Enterprise-grade networking equipment for office expansion project.",
            "category": "equipment",
            "priority": "Medium",
            "quantity": 20,
            "unit_price_estimate": 15000.0,
            "total_estimate": 300000.0,
            "required_by": now + timedelta(days=45),
            "creator": "eng.it1",
            "dept": "Instrumentation",
            "status": RequisitionStatus.SUBMITTED,
        },
        {
            "title": "Fire Safety Equipment Set",
            "description": "Complete fire safety package including extinguishers, alarms, and suppression systems.",
            "category": "equipment",
            "priority": "High",
            "quantity": 50,
            "unit_price_estimate": 12000.0,
            "total_estimate": 600000.0,
            "required_by": now + timedelta(days=30),
            "creator": "eng.safety1",
            "dept": "Fire & Safety",
            "status": RequisitionStatus.PROCESSING,
        },
        {
            "title": "Industrial Air Compressors",
            "description": "Heavy-duty air compressors for manufacturing unit.",
            "category": "equipment",
            "priority": "Medium",
            "quantity": 4,
            "unit_price_estimate": 175000.0,
            "total_estimate": 700000.0,
            "required_by": now + timedelta(days=75),
            "creator": "eng.mechanical1",
            "dept": "Mechanical",
            "status": RequisitionStatus.SUBMITTED,
        },
    ]

    requisitions = []
    for i, rd in enumerate(requisitions_data):
        sap_no = f"{20010001 + i:08d}"
        financial_year = "FY 2025-2026"
        job_desc = rd["description"][:50] + "..."
        cost_est = rd["total_estimate"]
        status = rd["status"]
        is_draft = status == RequisitionStatus.DRAFT
        is_submitted = status == RequisitionStatus.SUBMITTED

        r = Requisition(
            id=uuid4(),
            requisition_no=f"REQ-{i + 1:05d}",
            title=rd["title"],
            description=rd["description"],
            category=rd["category"],
            priority=Priority(rd["priority"]),
            status=status,
            quantity=rd["quantity"],
            unit_price_estimate=rd["unit_price_estimate"],
            total_estimate=rd["total_estimate"],
            currency="USD",
            required_by_date=rd["required_by"],
            creator_id=user_map[rd["creator"]].id,
            department_id=dept_map[rd["dept"]].id,
            current_owner_id=None
            if is_draft
            else (
                user_map["proc.officer1"].id
                if not is_submitted
                else user_map["cnp.hod"].id
            ),
            hodi_cnp_approval=HODCNPApproval.PENDING
            if is_submitted
            else HODCNPApproval.APPROVED,
            inventory_check_status=InventoryCheckStatus.NOT_CHECKED,
            financial_year=financial_year,
            sap_requisition_number=sap_no,
            requisition_create_date=now - timedelta(days=random.randint(5, 30)),
            requisition_hod_release_date=None
            if is_draft
            else now - timedelta(days=random.randint(1, 5)),
            job_description=job_desc,
            cost_estimate=cost_est,
            startup_applicable=(i % 3) == 0,
            industry="Construction & Engineering",
            sector="Procurement",
            contract_period_months=12 if (i % 2) == 0 else None,
            integrity_pact=cost_est > 10000000,
            file_reference=f"GAIL/HZR/CNP/2025-2026/{sap_no}/{(i % 1000) + 1:04d}",
        )
        db.add(r)
        requisitions.append(r)
    db.flush()

    # ── Tenders ──────────────────────────────────────────
    tenders_data = [
        {
            "requisition": requisitions[1],
            "title": "Hydraulic Press Machine - Competitive Bidding",
            "description": "Inviting bids from registered vendors for supply and installation of 50-ton hydraulic press machine. Technical specifications attached.",
            "status": TenderStatus.BIDDING,
            "issue_date": now - timedelta(days=10),
            "closing_date": now + timedelta(days=20),
        },
        {
            "requisition": requisitions[6],
            "title": "Fire Safety Equipment Package",
            "description": "Comprehensive fire safety system including extinguishers, alarm systems, and suppression equipment.",
            "status": TenderStatus.PUBLISHED,
            "issue_date": now - timedelta(days=5),
            "closing_date": now + timedelta(days=25),
        },
        {
            "requisition": requisitions[7],
            "title": "Industrial Air Compressors Supply",
            "description": "Supply of 4 heavy-duty industrial air compressors with installation support.",
            "status": TenderStatus.DRAFT,
            "issue_date": None,
            "closing_date": None,
        },
    ]

    tenders = []
    for i, td in enumerate(tenders_data):
        t = Tender(
            id=uuid4(),
            tender_no=f"TND-{i + 1:05d}",
            requisition_id=td["requisition"].id,
            title=td["title"],
            description=td["description"],
            status=td["status"],
            issue_date=td["issue_date"],
            closing_date=td["closing_date"],
            evaluation_method="Technical 40%, Financial 60%",
        )
        db.add(t)
        tenders.append(t)
    db.flush()

    # Link requisitions back to their tenders
    for td in tenders_data:
        req = td["requisition"]
        tender = tenders[tenders_data.index(td)]
        req.tender_id = tender.id
    db.flush()

    # ── Bids ─────────────────────────────────────────────
    for tender in tenders:
        if tender.status in (TenderStatus.BIDDING, TenderStatus.EVALUATING):
            for j in range(random.randint(3, 5)):
                vendor = random.choice(vendors)
                amount = random.uniform(100000, 500000)
                technical_score = random.uniform(60, 95)
                financial_score = random.uniform(60, 95)
                total_score = (technical_score + financial_score) / 2
                is_awarded = j == 0 and tender.status == TenderStatus.EVALUATING

                bid = Bid(
                    id=uuid4(),
                    tender_id=tender.id,
                    vendor_id=vendor.id,
                    amount=amount,
                    currency="USD",
                    validity_days=30,
                    technical_score=technical_score,
                    financial_score=financial_score,
                    total_score=total_score,
                    is_awarded=is_awarded,
                )
                db.add(bid)
    db.commit()

    # ── Orders ───────────────────────────────────────────
    orders_data = [
        {
            "requisition": requisitions[3],
            "vendor": vendors[4],
            "title": "Safety Helmets & Vests Supply",
            "description": "Supply of 200 safety helmet and vest sets.",
            "status": OrderStatus.ISSUED,
            "quantity": 200,
            "unit_price": 350.0,
            "total_amount": 70000.0,
            "order_date": now - timedelta(days=5),
            "delivery_date": now + timedelta(days=15),
        },
        {
            "requisition": requisitions[0],
            "vendor": vendors[0],
            "title": "Copper Cables Supply",
            "description": "Supply of 500mm copper cables for electrical project.",
            "status": OrderStatus.APPROVED,
            "quantity": 200,
            "unit_price": 1500.0,
            "total_amount": 300000.0,
            "order_date": now - timedelta(days=2),
            "delivery_date": now + timedelta(days=30),
        },
        {
            "requisition": requisitions[2],
            "vendor": vendors[2],
            "title": "Cement Supply - Phase 2",
            "description": "500 bags OPC 53 cement.",
            "status": OrderStatus.DRAFT,
            "quantity": 500,
            "unit_price": 450.0,
            "total_amount": 225000.0,
            "order_date": None,
            "delivery_date": now + timedelta(days=15),
        },
    ]

    orders = []
    for i, od in enumerate(orders_data):
        o = Order(
            id=uuid4(),
            order_no=f"PO-{i + 1:05d}",
            requisition_id=od["requisition"].id,
            tender_id=od["requisition"].tender_id,
            vendor_id=od["vendor"].id,
            title=od["title"],
            description=od["description"],
            status=od["status"],
            quantity=od["quantity"],
            unit_price=od["unit_price"],
            total_amount=od["total_amount"],
            currency="USD",
            order_date=od["order_date"],
            delivery_date=od["delivery_date"],
            payment_terms="Net 30",
        )
        db.add(o)
        orders.append(o)
    db.flush()

    # ── PostOrders ───────────────────────────────────────
    post_orders_data = [
        {
            "order": orders[0],
            "requisition": requisitions[3],
            "status": PostOrderStatus.PENDING_INSPECTION,
            "ordered_quantity": 200,
            "received_by": user_map["inventory.manager1"].id,
        },
    ]

    for pod in post_orders_data:
        po = PostOrder(
            id=uuid4(),
            order_id=pod["order"].id,
            requisition_id=pod["requisition"].id,
            ordered_quantity=pod["ordered_quantity"],
            received_quantity=None,
            status=pod["status"],
            quality_status=QualityStatus.PENDING,
            received_by=pod.get("received_by"),
        )
        db.add(po)
    db.commit()

    # ── Documents ────────────────────────────────────────
    sample_docs = [
        {
            "req": requisitions[0],
            "category": DocumentCategory.TENDER_DOCUMENT,
            "description": "Technical specification sheet for copper cables",
            "file_name": "cable_specs.pdf",
        },
        {
            "req": requisitions[1],
            "category": DocumentCategory.TENDER_DOCUMENT,
            "description": "Hydraulic press technical requirements",
            "file_name": "hydraulic_press_specs.pdf",
        },
        {
            "req": requisitions[2],
            "category": DocumentCategory.REQUISITION_USER_DOCS,
            "description": "Cement quality certification",
            "file_name": "cement_bis_cert.pdf",
        },
        {
            "req": requisitions[3],
            "category": DocumentCategory.ORDER_DOCUMENTS,
            "description": "Signed purchase order for safety equipment",
            "file_name": "po_safety_helmets.pdf",
        },
        {
            "req": requisitions[4],
            "category": DocumentCategory.REQUISITION_USER_DOCS,
            "description": "Lab equipment quotation from supplier",
            "file_name": "lab_equip_quote.pdf",
        },
    ]

    for sd in sample_docs:
        doc = Document(
            id=uuid4(),
            requisition_id=sd["req"].id,
            tender_id=sd["req"].tender_id,
            category=sd["category"],
            description=sd["description"],
            file_name=sd["file_name"],
            file_path=f"seed/{uuid4().hex}.pdf",
            file_type="application/pdf",
            file_size=random.randint(50000, 500000),
            uploaded_by=sd["req"].creator_id,
        )
        db.add(doc)
    db.commit()

    # ── ActivityLogs ─────────────────────────────────────
    actions = [
        {
            "req": requisitions[0],
            "user": user_map["eng.electrical1"],
            "action": "created",
            "details": "Requisition REQ-00001 created",
        },
        {
            "req": requisitions[0],
            "user": user_map["cnp.hod"],
            "action": "reviewed",
            "details": "Requisition reviewed and approved",
        },
        {
            "req": requisitions[0],
            "user": user_map["proc.officer1"],
            "action": "processing",
            "details": "Requisition moved to processing",
        },
        {
            "req": requisitions[1],
            "user": user_map["eng.mechanical1"],
            "action": "created",
            "details": "Requisition REQ-00002 created",
        },
        {
            "req": requisitions[1],
            "user": user_map["cnp.hod"],
            "action": "submitted",
            "details": "Requisition submitted for review",
        },
        {
            "req": requisitions[2],
            "user": user_map["eng.civil1"],
            "action": "created",
            "details": "Requisition REQ-00003 created",
        },
        {
            "req": requisitions[2],
            "user": user_map["cnp.hod"],
            "action": "reviewed",
            "details": "Requisition reviewed and approved",
        },
        {
            "req": requisitions[3],
            "user": user_map["eng.electrical1"],
            "action": "created",
            "details": "Requisition REQ-00004 created",
        },
        {
            "req": requisitions[3],
            "user": user_map["proc.officer1"],
            "action": "order_placed",
            "details": "Purchase order PO-00001 issued",
        },
        {
            "req": requisitions[6],
            "user": user_map["eng.safety1"],
            "action": "created",
            "details": "Requisition REQ-00007 created",
        },
        {
            "req": requisitions[6],
            "user": user_map["cnp.hod"],
            "action": "reviewed",
            "details": "Requisition reviewed",
        },
        {
            "req": requisitions[7],
            "user": user_map["eng.mechanical1"],
            "action": "created",
            "details": "Requisition REQ-00008 created",
        },
    ]

    for a in actions:
        log = ActivityLog(
            id=uuid4(),
            requisition_id=a["req"].id,
            user_id=a["user"].id,
            action=a["action"],
            details=a["details"],
            created_at=now - timedelta(days=random.randint(1, 10)),
        )
        db.add(log)
    db.commit()

    # ── RequisitionStageHistory ──────────────────────────
    requisition_stages = [
        {
            "req": requisitions[0],
            "stage": RequisitionStage.DRAFT,
            "status": InternalApprovalStatus.COMPLETED,
        },
        {
            "req": requisitions[0],
            "stage": RequisitionStage.SUBMITTED,
            "status": InternalApprovalStatus.COMPLETED,
        },
        {
            "req": requisitions[0],
            "stage": RequisitionStage.INTERNAL_APPROVAL,
            "status": InternalApprovalStatus.COMPLETED,
        },
        {
            "req": requisitions[0],
            "stage": RequisitionStage.ORDER_CREATED,
            "status": InternalApprovalStatus.IN_PROGRESS,
        },
        {
            "req": requisitions[1],
            "stage": RequisitionStage.DRAFT,
            "status": InternalApprovalStatus.COMPLETED,
        },
        {
            "req": requisitions[1],
            "stage": RequisitionStage.SUBMITTED,
            "status": InternalApprovalStatus.PENDING,
        },
        {
            "req": requisitions[2],
            "stage": RequisitionStage.DRAFT,
            "status": InternalApprovalStatus.COMPLETED,
        },
        {
            "req": requisitions[2],
            "stage": RequisitionStage.SUBMITTED,
            "status": InternalApprovalStatus.COMPLETED,
        },
        {
            "req": requisitions[2],
            "stage": RequisitionStage.INTERNAL_APPROVAL,
            "status": InternalApprovalStatus.IN_PROGRESS,
        },
        {
            "req": requisitions[3],
            "stage": RequisitionStage.DRAFT,
            "status": InternalApprovalStatus.COMPLETED,
        },
        {
            "req": requisitions[3],
            "stage": RequisitionStage.ORDER_CREATED,
            "status": InternalApprovalStatus.COMPLETED,
        },
    ]

    for rs in requisition_stages:
        rsh = RequisitionStageHistory(
            id=uuid4(),
            requisition_id=rs["req"].id,
            stage=rs["stage"],
            status=rs["status"],
        )
        db.add(rsh)
    db.commit()

    # ── Workflow detail tables ───────────────────────────

    # InternalApprovalDetail for requisitions that passed internal approval
    for req in [requisitions[0], requisitions[2], requisitions[3]]:
        detail = InternalApprovalDetail(
            id=uuid4(),
            requisition_id=req.id,
            checklist_completed=True,
            checklist_completed_at=now - timedelta(days=random.randint(2, 8)),
            checklist_completed_by=user_map["cnp.hod"].id,
            checklist_notes="All documents verified and approved.",
        )
        db.add(detail)
    db.commit()

    # TenderProcess for tenders that have been published or are bidding
    for tender in [
        tenders[i]
        for i, td in enumerate(tenders_data)
        if td["status"] in (TenderStatus.PUBLISHED, TenderStatus.BIDDING)
    ]:
        tp = TenderProcess(
            id=uuid4(),
            tender_id=tender.id,
            bid_creation_date=now - timedelta(days=5),
            bid_opening_date=now + timedelta(days=15),
            bid_closing_date=now + timedelta(days=20),
            document_vetting_done=tender.status == TenderStatus.BIDDING,
            document_vetted_by=user_map["proc.officer1"].id
            if tender.status == TenderStatus.BIDDING
            else None,
            document_vetted_at=now - timedelta(days=3)
            if tender.status == TenderStatus.BIDDING
            else None,
        )
        db.add(tp)
    db.commit()

    # ── Messages ─────────────────────────────────────────
    messages_data = [
        {
            "sender": "eng.electrical1",
            "receiver": "proc.officer1",
            "content": "Please expedite the copper cables order - our project timeline is at risk.",
            "requisition": requisitions[0],
        },
        {
            "sender": "proc.officer1",
            "receiver": "eng.electrical1",
            "content": "Order is in process. Expected delivery in 3 weeks.",
            "requisition": requisitions[0],
        },
        {
            "sender": "cnp.hod",
            "receiver": "proc.officer1",
            "content": "Please review and approve the hydraulic press tender bids.",
            "requisition": requisitions[1],
        },
    ]

    for md in messages_data:
        msg = Message(
            id=uuid4(),
            sender_id=user_map[md["sender"]].id,
            receiver_id=user_map[md["receiver"]].id,
            content=md["content"],
            requisition_id=md["requisition"].id,
        )
        db.add(msg)
    db.commit()

    print("Database seeded successfully!")
    print(f"  - {len(departments)} departments")
    print(f"  - {len(users)} users")
    print(f"  - {len(vendors)} vendors")
    print(f"  - {len(requisitions)} requisitions")
    print(f"  - {len(tenders)} tenders")
    print(f"  - {len(orders)} orders")
    print(f"  - {len(sample_docs)} documents")
    print(f"  - {len(actions)} activity logs")
    print(f"  - {len(requisition_stages)} stage history entries")


if __name__ == "__main__":
    force = "--force" in sys.argv

    sync_engine, sync_session_factory = get_sync_engine()
    Base.metadata.create_all(sync_engine)

    with sync_session_factory() as db:
        seed(db, force=force)
