from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Integer, or_, and_
from uuid import UUID

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models import User, Requisition, Department, UserRole, RequisitionStatus
from app.schemas import (
    RequisitionCreate, RequisitionUpdate, RequisitionOut,
    PaginatedResponse, create_pagination_meta,
)

router = APIRouter()


async def _gen_requisition_no(db: AsyncSession):
    result = await db.execute(
        select(func.max(cast(func.substring(Requisition.requisition_no, 5), Integer)))
    )
    num = result.scalar() or 0
    return f"REQ-{num + 1:05d}"


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

    req = Requisition(
        requisition_no=req_no,
        title=body.title,
        description=body.description,
        category=body.category,
        priority=body.priority,
        quantity=body.quantity,
        unit_price_estimate=body.unit_price_estimate,
        total_estimate=body.total_estimate,
        currency=body.currency,
        required_by_date=body.required_by_date,
        justification=body.justification,
        specifications=body.specifications,
        creator_id=current_user.id,
        department_id=dept_id,
        status=RequisitionStatus.SUBMITTED,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
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

    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(req, k, v)
    await db.commit()
    await db.refresh(req)
    return req


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
    if not req or req.status != RequisitionStatus.DRAFT:
        raise HTTPException(400, "Cannot submit requisition")

    req.status = RequisitionStatus.SUBMITTED
    await db.commit()
    await db.refresh(req)
    return req


@router.post("/{req_id}/return", response_model=RequisitionOut)
async def return_req(
    req_id: UUID,
    reason: str | None = None,
    processor_user: User = Depends(require_role(UserRole.HOD, UserRole.CNP_HOD)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")

    if processor_user.role == UserRole.CNP_HOD and req.current_owner_id == processor_user.id:
        req.status = RequisitionStatus.RETURNED
    elif processor_user.role == UserRole.HOD and req.department_id == processor_user.department_id:
        req.status = RequisitionStatus.RETURNED
    else:
        raise HTTPException(403, "You do not have permission to return this requisition")

    await db.commit()
    await db.refresh(req)
    return req


@router.post("/{req_id}/approve", response_model=RequisitionOut)
async def approve_req(
    req_id: UUID,
    assign_to: UUID | None = None,
    processor_user: User = Depends(require_role(UserRole.HOD, UserRole.CNP_HOD)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")

    if assign_to:
        req.current_owner_id = assign_to
    elif processor_user.role == UserRole.CNP_HOD:
        req.current_owner_id = processor_user.id

    req.status = RequisitionStatus.UNDER_REVIEW
    await db.commit()
    await db.refresh(req)
    return req


@router.post("/{req_id}/reject", response_model=RequisitionOut)
async def reject_req(
    req_id: UUID,
    reason: str | None = None,
    processor_user: User = Depends(require_role(UserRole.HOD, UserRole.CNP_HOD)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")

    req.status = RequisitionStatus.CANCELLED
    await db.commit()
    await db.refresh(req)
    return req