from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Integer, or_
from uuid import UUID
from datetime import datetime, timezone

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models import User, Requisition, Department, UserRole, RequisitionStatus
from app.schemas import (
    RequisitionCreate,
    RequisitionUpdate,
    RequisitionOut,
    WorkflowAction,
    PaginatedResponse,
    create_pagination_meta,
    ActivityLogOut,
)
from app.models import ActivityLog
from app.services.requisition import RequisitionService, RequisitionError

router = APIRouter()


async def _log_activity(
    db: AsyncSession, requisition_id: UUID, user_id: UUID, action: str, details: str
):
    log = ActivityLog(
        requisition_id=requisition_id,
        user_id=user_id,
        action=action,
        details=details,
    )
    db.add(log)


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
    """List requisitions with optional filtering and pagination.

    Returns paginated requisitions filtered by status, priority, search, or department.
    """
    service = RequisitionService(db)
    rows, meta = await service.list(
        current_user, page, page_size, status_filter, priority, search, department_id
    )
    return PaginatedResponse(
        data=[RequisitionOut.model_validate(r) for r in rows],
        meta=meta,
    )


@router.get("/{req_id}", response_model=RequisitionOut)
async def get_req(
    req_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single requisition by ID.

    Returns the requisition details.
    """
    service = RequisitionService(db)
    req = await service.get_by_id(req_id)
    if not req:
        raise HTTPException(404, "Requisition not found")
    if not service.can_view(current_user, req):
        raise HTTPException(403, "You do not have permission to view this requisition")
    return req


@router.post("", response_model=RequisitionOut, status_code=201)
async def create_req(
    body: RequisitionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new requisition.

    Returns the created requisition with generated number.
    """
    service = RequisitionService(db)
    try:
        req = await service.create(body, current_user)
    except RequisitionError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

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
    """Update an existing requisition.

    Returns the updated requisition.
    """
    service = RequisitionService(db)
    req = await service.get_by_id(req_id)
    if not req:
        raise HTTPException(404, "Requisition not found")

    try:
        req = await service.update(req, body, current_user)
    except RequisitionError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    await db.commit()
    await db.refresh(req)
    return req


@router.delete("/{req_id}")
async def delete_req(
    req_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a requisition.

    Returns a success confirmation message.
    """
    service = RequisitionService(db)
    req = await service.get_by_id(req_id)
    if not req:
        raise HTTPException(404, "Requisition not found")

    try:
        await service.delete(req, current_user)
    except RequisitionError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    await db.commit()
    return {"message": "Requisition deleted successfully"}


@router.post("/{req_id}/submit", response_model=RequisitionOut)
async def submit_req(
    req_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a requisition for review.

    Returns the requisition with updated status.
    """
    service = RequisitionService(db)
    req = await service.get_by_id(req_id)
    if not req or req.creator_id != current_user.id:
        raise HTTPException(404, "Requisition not found")

    try:
        req = await service.submit(req, current_user)
    except RequisitionError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

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
    """Review and approve a submitted requisition.

    Returns the requisition with updated status.
    """
    service = RequisitionService(db)
    req = await service.get_by_id(req_id)
    if not req:
        raise HTTPException(404, "Requisition not found")

    try:
        req = await service.review(req, current_user, body.reason)
    except RequisitionError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

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
    """Return a requisition to the indentor for clarification.

    Returns the requisition with returned status and reason.
    """
    if current_user.role not in (
        UserRole.CNP_HOD,
        UserRole.PROCUREMENT_OFFICER,
        UserRole.OIC,
    ):
        raise HTTPException(
            403, "You do not have permission to return this requisition"
        )

    service = RequisitionService(db)
    req = await service.get_by_id(req_id)
    if not req:
        raise HTTPException(404, "Requisition not found")

    reason = body.reason or "Returned for clarification"
    req = await service.return_req(req, current_user, reason)

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
    """Assign a requisition to a procurement officer.

    Returns the requisition with the assigned owner.
    """
    service = RequisitionService(db)
    req = await service.get_by_id(req_id)
    if not req:
        raise HTTPException(404, "Requisition not found")

    try:
        req = await service.assign_to_procurement(req, current_user, body.assign_to)
    except RequisitionError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    await db.commit()
    await db.refresh(req)
    return req


@router.post("/{req_id}/process", response_model=RequisitionOut)
async def process_req(
    req_id: UUID,
    current_user: User = Depends(
        require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)
    ),
    db: AsyncSession = Depends(get_db),
):
    """Process a requisition in the procurement workflow.

    Returns the requisition with updated processing status.
    """
    service = RequisitionService(db)
    req = await service.get_by_id(req_id)
    if not req:
        raise HTTPException(404, "Requisition not found")

    try:
        req = await service.process(req, current_user)
    except RequisitionError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

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
    """Cancel a requisition.

    Returns the requisition with cancelled status.
    """
    service = RequisitionService(db)
    req = await service.get_by_id(req_id)
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
    current_user: User = Depends(
        require_role(
            UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC, UserRole.ADMIN
        )
    ),
    db: AsyncSession = Depends(get_db),
):
    """Mark a requisition as completed.

    Returns the requisition with completed status.
    """
    service = RequisitionService(db)
    req = await service.get_by_id(req_id)
    if not req:
        raise HTTPException(404, "Requisition not found")

    try:
        req = await service.complete(req, current_user)
    except RequisitionError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    await db.commit()
    await db.refresh(req)
    return req


@router.get("/{req_id}/activity", response_model=list[ActivityLogOut])
async def get_activity_logs(
    req_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get activity logs for a requisition.

    Returns a list of activity log entries.
    """
    service = RequisitionService(db)
    req = await service.get_by_id(req_id)
    if not req:
        raise HTTPException(404, "Requisition not found")

    rows = await service.get_activity(req_id)
    return [
        ActivityLogOut(**row)
        for row in rows
    ]
