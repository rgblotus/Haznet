from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models import User, Requisition, Tender, Vendor, Order, PostOrder
from app.models.enums import RequisitionStatus, TenderStatus, OrderStatus, PostOrderStatus, UserRole
from app.schemas import DashboardStats, ActivityItem, PaginatedResponse, create_pagination_meta

router = APIRouter()

PROCESSING_STATUSES = [
    RequisitionStatus.PROCESSING,
    RequisitionStatus.TENDER_AWAITING,
    RequisitionStatus.INVENTORY_CHECKED,
    RequisitionStatus.ORDER_CREATED,
    RequisitionStatus.SHIPPED,
    RequisitionStatus.RECEIVING,
    RequisitionStatus.INSPECTION_PENDING,
]
PENDING_APPROVAL_STATUSES = [
    RequisitionStatus.SUBMITTED,
    RequisitionStatus.UNDER_REVIEW,
    RequisitionStatus.RETURNED,
]


def _is_admin_or_proc(user: User) -> bool:
    return user.role in (UserRole.ADMIN, UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)


@router.get("/stats", response_model=DashboardStats)
async def get_stats(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    is_privileged = _is_admin_or_proc(current_user)
    
    if is_privileged:
        dept_filter = None
    elif current_user.role == UserRole.INDENTOR:
        dept_filter = Requisition.creator_id == current_user.id
    elif current_user.role == UserRole.HOD:
        dept_filter = Requisition.department_id == current_user.department_id
    elif current_user.role == UserRole.INVENTORY_MANAGER:
        dept_filter = or_(
            Requisition.status == RequisitionStatus.PENDING_INVENTORY,
            Requisition.status == RequisitionStatus.INVENTORY_CHECKED,
            Requisition.current_owner_id == current_user.id,
        )
    else:
        dept_filter = None

    req_base = select(
        func.count(Requisition.id).label("total"),
        func.sum(case((Requisition.status.in_(PENDING_APPROVAL_STATUSES), 1), else_=0)).label("pending_approval"),
        func.sum(case((Requisition.status.in_(PROCESSING_STATUSES), 1), else_=0)).label("in_progress"),
        func.sum(case((Requisition.status == RequisitionStatus.COMPLETED, 1), else_=0)).label("completed"),
        func.sum(case((and_(Requisition.current_owner_id == current_user.id, Requisition.status.in_(PROCESSING_STATUSES)), 1), else_=0)).label("my_pending"),
        func.sum(case((Requisition.creator_id == current_user.id, 1), else_=0)).label("my_created"),
    )
    if dept_filter is not None:
        req_base = req_base.where(dept_filter)
    req_result = await db.execute(req_base)
    req_row = req_result.one()

    tender_result = await db.execute(
        select(func.count(Tender.id)).where(
            Tender.status.in_([TenderStatus.BIDDING, TenderStatus.EVALUATING, TenderStatus.PUBLISHED])
        )
    )
    active_tenders = tender_result.scalar() or 0

    order_result = await db.execute(
        select(func.count(Order.id)).where(
            Order.status.in_([OrderStatus.DRAFT, OrderStatus.APPROVED, OrderStatus.ISSUED])
        )
    )
    pending_orders = order_result.scalar() or 0

    receipt_result = await db.execute(
        select(func.count(PostOrder.id)).where(
            PostOrder.status == PostOrderStatus.PENDING_INSPECTION
        )
    )
    pending_receipts = receipt_result.scalar() or 0

    vendor_result = await db.execute(select(func.count(Vendor.id)))
    total_vendors = vendor_result.scalar() or 0

    my_pending = (req_row.my_pending or 0)

    returned_result = await db.execute(
        select(func.count(Requisition.id)).where(
            and_(
                Requisition.creator_id == current_user.id,
                Requisition.status == RequisitionStatus.RETURNED,
            )
        )
    )
    returned_count = returned_result.scalar() or 0

    return DashboardStats(
        total_requisitions=req_row.total or 0,
        pending_approval=req_row.pending_approval or 0,
        in_progress=req_row.in_progress or 0,
        completed=req_row.completed or 0,
        overdue=0,
        total_vendors=total_vendors,
        active_tenders=active_tenders,
        pending_orders=pending_orders,
        pending_receipts=pending_receipts,
        my_pending=my_pending + returned_count,
    )


@router.get("/activity", response_model=PaginatedResponse[ActivityItem])
async def get_activity(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    base_filter = []
    if current_user.role == UserRole.INDENTOR:
        base_filter.append(Requisition.creator_id == current_user.id)
    elif current_user.role in (UserRole.HOD, UserRole.CNP_HOD):
        base_filter.append(Requisition.department_id == current_user.department_id)
    elif current_user.role == UserRole.INVENTORY_MANAGER:
        base_filter.append(
            or_(
                Requisition.status == RequisitionStatus.PENDING_INVENTORY,
                Requisition.status == RequisitionStatus.INVENTORY_CHECKED,
                Requisition.current_owner_id == current_user.id,
            )
        )
    elif current_user.role in (UserRole.OIC, UserRole.ADMIN, UserRole.PROCUREMENT_OFFICER):
        pass

    count_query = select(func.count(Requisition.id))
    if base_filter:
        count_query = count_query.where(and_(*base_filter))
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    query = (
        select(Requisition)
        .order_by(Requisition.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    if base_filter:
        query = query.where(and_(*base_filter))
    result = await db.execute(query)
    requisitions = result.scalars().all()

    data = [
        ActivityItem(
            id=str(r.id),
            type="requisition",
            title=r.title,
            status=r.status.value if r.status else "unknown",
            updated_at=r.updated_at.isoformat() if r.updated_at else "",
        )
        for r in requisitions
    ]

    return PaginatedResponse(
        data=data,
        meta=create_pagination_meta(total, page, page_size),
    )


@router.get("/summary")
async def get_summary(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role == UserRole.INDENTOR:
        recent_reqs = await db.execute(
            select(Requisition)
            .where(Requisition.creator_id == current_user.id)
            .order_by(Requisition.created_at.desc())
            .limit(5)
        )
    else:
        recent_reqs = await db.execute(
            select(Requisition)
            .order_by(Requisition.created_at.desc())
            .limit(5)
        )
    my_requisitions = recent_reqs.scalars().all()

    assigned_reqs = await db.execute(
        select(func.count(Requisition.id))
        .where(
            Requisition.current_owner_id == current_user.id,
            Requisition.status.in_([
                RequisitionStatus.UNDER_REVIEW,
                RequisitionStatus.PROCESSING,
                RequisitionStatus.INVENTORY_CHECKED
            ])
        )
    )
    assigned_count = assigned_reqs.scalar() or 0

    return {
        "my_requisitions": [
            {
                "id": str(r.id),
                "requisition_no": r.requisition_no,
                "title": r.title,
                "status": r.status.value if r.status else "unknown",
                "priority": r.priority,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in my_requisitions
        ],
        "assigned_count": assigned_count,
        "user_role": current_user.role.value,
        "user_department": current_user.department_id,
    }