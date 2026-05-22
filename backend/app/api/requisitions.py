from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Integer, or_, and_
from uuid import UUID
from datetime import datetime, timezone

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models import User, Requisition, Department, UserRole, RequisitionStatus
from app.schemas import (
    RequisitionCreate, RequisitionUpdate, RequisitionOut, WorkflowAction,
    PaginatedResponse, create_pagination_meta, ActivityLogOut,
)
from app.models import ActivityLog

router = APIRouter()


async def _log_activity(db: AsyncSession, requisition_id: UUID, user_id: UUID, action: str, details: str = None, old_value: str = None, new_value: str = None):
    log = ActivityLog(
        requisition_id=requisition_id,
        user_id=user_id,
        action=action,
        details=details,
        old_value=old_value,
        new_value=new_value,
    )
    db.add(log)
    await db.flush()


async def _gen_requisition_no(db: AsyncSession):
    result = await db.execute(
        select(func.max(cast(func.substring(Requisition.requisition_no, 5), Integer)))
    )
    num = result.scalar() or 0
    return f"REQ-{num + 1:05d}"


async def _gen_file_reference(db: AsyncSession, financial_year: str, sap_req_no: str) -> str:
    year_part = financial_year.replace("FY ", "") if financial_year.startswith("FY ") else financial_year
    result = await db.execute(
        select(func.max(cast(func.substring(Requisition.file_reference, -4), Integer)))
        .where(Requisition.file_reference.isnot(None))
    )
    num = result.scalar() or 0
    sequence = num + 1
    if sequence > 1000:
        sequence = 1
    return f"GAIL/HZR/CNP/{year_part}/{sap_req_no}/{sequence:04d}"


async def _gen_file_reference(db: AsyncSession, financial_year: str, sap_req_no: str) -> str:
    year_part = financial_year.replace("FY ", "") if financial_year.startswith("FY ") else financial_year
    result = await db.execute(
        select(func.max(cast(func.substring(Requisition.file_reference, -4), Integer)))
        .where(Requisition.file_reference.isnot(None))
    )
    num = result.scalar() or 0
    sequence = num + 1
    if sequence > 1000:
        sequence = 1
    return f"GAIL/HZR/CNP/{year_part}/{sap_req_no}/{sequence:04d}"


def _can_edit_req(user: User, req: Requisition) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    if user.role == UserRole.INDENTOR and req.creator_id == user.id:
        return req.status in (RequisitionStatus.DRAFT, RequisitionStatus.RETURNED)
    if user.role in (UserRole.CNP_HOD, UserRole.PROCUREMENT_OFFICER, UserRole.OIC):
        return req.status not in (RequisitionStatus.COMPLETED, RequisitionStatus.CANCELLED)
    return False


def _can_view_req(user: User, req: Requisition) -> bool:
    if user.role in (UserRole.ADMIN, UserRole.OIC):
        return True
    if user.role == UserRole.INDENTOR:
        return req.creator_id == user.id
    if user.role == UserRole.HOD:
        return req.department_id == user.department_id
    if user.role in (UserRole.CNP_HOD, UserRole.PROCUREMENT_OFFICER, UserRole.INVENTORY_MANAGER):
        return True
    return False


@router.get("", response_model=PaginatedResponse[RequisitionOut])
async def list_reqs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    department_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Requisition)
    count_query = select(func.count(Requisition.id))

    if status_filter:
        query = query.where(Requisition.status == RequisitionStatus(status_filter))
        count_query = count_query.where(Requisition.status == RequisitionStatus(status_filter))

    if priority:
        query = query.where(Requisition.priority == priority)
        count_query = count_query.where(Requisition.priority == priority)

    if search:
        search_filter = or_(
            Requisition.title.ilike(f"%{search}%"),
            Requisition.requisition_no.ilike(f"%{search}%"),
            Requisition.description.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if department_id:
        query = query.where(Requisition.department_id == UUID(department_id))
        count_query = count_query.where(Requisition.department_id == UUID(department_id))

    if current_user.role == UserRole.INDENTOR:
        query = query.where(Requisition.creator_id == current_user.id)
        count_query = count_query.where(Requisition.creator_id == current_user.id)
    elif current_user.role == UserRole.HOD:
        query = query.where(Requisition.department_id == current_user.department_id)
        count_query = count_query.where(Requisition.department_id == current_user.department_id)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Requisition.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    requisitions = result.scalars().all()

    return PaginatedResponse(
        data=[RequisitionOut.model_validate(r) for r in requisitions],
        meta=create_pagination_meta(total, page, page_size),
    )


@router.get("/{req_id}", response_model=RequisitionOut)
async def get_req(
    req_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")
    if not _can_view_req(current_user, req):
        raise HTTPException(403, "You do not have permission to view this requisition")
    return req


@router.post("", response_model=RequisitionOut, status_code=201)
async def create_req(
    body: RequisitionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    req_no = await _gen_requisition_no(db)

    dept_id = current_user.department_id
    if not dept_id:
        result = await db.execute(select(Department).where(Department.name == "Contract & Procurement"))
        dep = result.scalar_one_or_none()
        if dep:
            dept_id = dep.id

    integrity_pact = (body.cost_estimate or 0) > 10000000

    file_reference = None
    if body.financial_year and body.sap_requisition_number:
        file_reference = await _gen_file_reference(db, body.financial_year, body.sap_requisition_number)

    requisition_create_date = body.requisition_create_date or datetime.now(timezone.utc)

    title = body.title or (body.job_description[:50] if body.job_description else f"REQ-{body.sap_requisition_number or 'NEW'}")
    description = body.description or body.job_description or ""
    total_estimate = body.total_estimate or body.cost_estimate

    req = Requisition(
        requisition_no=req_no,
        title=title,
        description=description,
        category=body.category,
        priority=body.priority,
        quantity=body.quantity,
        unit_price_estimate=body.unit_price_estimate,
        total_estimate=total_estimate,
        currency=body.currency,
        required_by_date=body.required_by_date,
        justification=body.justification,
        specifications=body.specifications,
        creator_id=current_user.id,
        department_id=dept_id,
        current_owner_id=current_user.id,
        status=RequisitionStatus.DRAFT,
        financial_year=body.financial_year,
        sap_requisition_number=body.sap_requisition_number,
        requisition_create_date=requisition_create_date,
        requisition_hod_release_date=body.requisition_hod_release_date,
        job_description=body.job_description,
        cost_estimate=body.cost_estimate,
        startup_applicable=body.startup_applicable,
        industry=body.industry,
        sector=body.sector,
        contract_period_months=body.contract_period_months,
        integrity_pact=integrity_pact,
        file_reference=file_reference,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)

    await _log_activity(db, req.id, current_user.id, "created", f"Requisition {req_no} created with title: {title}")

    return req


@router.patch("/{req_id}", response_model=RequisitionOut)
async def update_req(
    req_id: UUID,
    body: RequisitionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")

    if not _can_edit_req(current_user, req):
        raise HTTPException(403, "You do not have permission to edit this requisition")

    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(req, k, v)
    await db.commit()
    await db.refresh(req)
    return req


@router.delete("/{req_id}")
async def delete_req(
    req_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(403, "Only administrators can delete requisitions")

    await db.delete(req)
    await db.commit()
    return {"message": "Requisition deleted successfully"}


@router.post("/{req_id}/submit", response_model=RequisitionOut)
async def submit_req(
    req_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Requisition).where(
            Requisition.id == req_id,
            Requisition.creator_id == current_user.id
        )
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")
    if req.status not in (RequisitionStatus.DRAFT, RequisitionStatus.RETURNED):
        raise HTTPException(400, "Can only submit draft or returned requisitions")

    req.status = RequisitionStatus.SUBMITTED
    req.return_reason = None
    req.returned_to_indentor = False

    await _log_activity(db, req_id, current_user.id, "submitted", "Requisition submitted for review")

    cnphod_result = await db.execute(
        select(User).where(User.role == UserRole.CNP_HOD, User.is_active == True)
    )
    cnphod = cnphod_result.scalars().first()
    if cnphod:
        req.current_owner_id = cnphod.id

    await db.commit()
    await db.refresh(req)
    return req


@router.post("/{req_id}/review", response_model=RequisitionOut)
async def review_req(
    req_id: UUID,
    body: WorkflowAction = WorkflowAction(),
    current_user: User = Depends(require_role(UserRole.CNP_HOD, UserRole.OIC)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")
    if req.status not in (RequisitionStatus.SUBMITTED, RequisitionStatus.UNDER_REVIEW):
        raise HTTPException(400, "Requisition is not pending review")

    req.status = RequisitionStatus.UNDER_REVIEW
    req.hodi_cnp_approval = "Approved"
    if body.reason:
        req.return_reason = body.reason

    await _log_activity(db, req_id, current_user.id, "reviewed", "Requisition reviewed and approved")

    await db.commit()
    await db.refresh(req)
    return req


@router.post("/{req_id}/return", response_model=RequisitionOut)
async def return_req(
    req_id: UUID,
    body: WorkflowAction = WorkflowAction(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in (UserRole.CNP_HOD, UserRole.PROCUREMENT_OFFICER, UserRole.OIC):
        raise HTTPException(403, "You do not have permission to return this requisition")

    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")

    reason = body.reason or "Returned for clarification"
    await _log_activity(db, req_id, current_user.id, "returned", reason, old_value=req.status.value, new_value="returned")
    req.status = RequisitionStatus.RETURNED
    req.return_reason = reason
    req.returned_to_indentor = True
    req.current_owner_id = req.creator_id

    await db.commit()
    await db.refresh(req)
    return req


@router.post("/{req_id}/assign-to-procurement", response_model=RequisitionOut)
async def assign_to_procurement(
    req_id: UUID,
    body: WorkflowAction = WorkflowAction(),
    current_user: User = Depends(require_role(UserRole.CNP_HOD, UserRole.OIC)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")
    if req.status not in (RequisitionStatus.SUBMITTED, RequisitionStatus.UNDER_REVIEW):
        raise HTTPException(400, "Requisition must be under review before assigning")

    if body.assign_to:
        req.current_owner_id = body.assign_to
    else:
        po_result = await db.execute(
            select(User).where(User.role == UserRole.PROCUREMENT_OFFICER, User.is_active == True)
        )
        po = po_result.scalars().first()
        if po:
            req.current_owner_id = po.id

    req.status = RequisitionStatus.PROCESSING
    req.assigned_to_procurement = True
    req.hodi_cnp_approval = "Approved"

    await _log_activity(db, req_id, current_user.id, "assigned", "Requisition assigned to procurement")

    await db.commit()
    await db.refresh(req)
    return req


@router.post("/{req_id}/process", response_model=RequisitionOut)
async def process_req(
    req_id: UUID,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")
    if req.status not in (RequisitionStatus.PROCESSING, RequisitionStatus.UNDER_REVIEW):
        raise HTTPException(400, "Requisition is not ready for processing")

    await _log_activity(db, req_id, current_user.id, "processing", "Requisition moved to processing")
    req.status = RequisitionStatus.PROCESSING
    req.current_owner_id = current_user.id

    await db.commit()
    await db.refresh(req)
    return req


@router.post("/{req_id}/cancel", response_model=RequisitionOut)
async def cancel_req(
    req_id: UUID,
    body: WorkflowAction = WorkflowAction(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")

    if current_user.role == UserRole.INDENTOR:
        if req.status not in (RequisitionStatus.DRAFT, RequisitionStatus.RETURNED):
            raise HTTPException(400, "Can only cancel draft or returned requisitions")
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(403, "Only indentor or admin can cancel this requisition")

    req.status = RequisitionStatus.CANCELLED
    if body.reason:
        req.return_reason = body.reason

    await db.commit()
    await db.refresh(req)
    return req


@router.post("/{req_id}/complete", response_model=RequisitionOut)
async def complete_req(
    req_id: UUID,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")
    if req.status not in (RequisitionStatus.ORDER_CREATED, RequisitionStatus.RECEIVING, RequisitionStatus.INSPECTION_PENDING):
        raise HTTPException(400, "Requisition is not ready for completion")

    await _log_activity(db, req_id, current_user.id, "completed", f"Requisition marked as completed")
    req.status = RequisitionStatus.COMPLETED
    await db.commit()
    await db.refresh(req)
    return req


@router.get("/{req_id}/activity", response_model=list[ActivityLogOut])
async def get_activity_logs(
    req_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")

    query = (
        select(ActivityLog, User.first_name, User.last_name)
        .join(User, ActivityLog.user_id == User.id)
        .where(ActivityLog.requisition_id == req_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(50)
    )
    res = await db.execute(query)
    rows = res.all()

    return [
        ActivityLogOut(
            id=log.id,
            requisition_id=log.requisition_id,
            user_id=log.user_id,
            action=log.action,
            details=log.details,
            old_value=log.old_value,
            new_value=log.new_value,
            created_at=log.created_at,
            user_name=f"{first_name} {last_name}" if first_name and last_name else None,
        )
        for log, first_name, last_name in rows
    ]
