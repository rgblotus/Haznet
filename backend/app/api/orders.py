from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Integer, or_
from uuid import UUID

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models import User, Order, Requisition, RequisitionStatus, PostOrder, PostOrderStatus, UserRole, OrderStatus
from app.schemas import (
    OrderCreate, OrderUpdate, OrderOut,
    PaginatedResponse, create_pagination_meta,
)

router = APIRouter()


async def _gen_order_no(db: AsyncSession):
    result = await db.execute(
        select(func.max(cast(func.substring(Order.order_no, 4), Integer)))
    )
    num = result.scalar() or 0
    return f"PO-{num + 1:05d}"


@router.get("", response_model=PaginatedResponse[OrderOut])
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    search: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Order)
    count_query = select(func.count(Order.id))

    if status:
        query = query.where(Order.status == OrderStatus(status))
        count_query = count_query.where(Order.status == OrderStatus(status))

    if search:
        search_filter = or_(
            Order.title.ilike(f"%{search}%"),
            Order.order_no.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    orders = result.scalars().all()

    return PaginatedResponse(
        data=[OrderOut.model_validate(o) for o in orders],
        meta=create_pagination_meta(total, page, page_size),
    )


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    return order


@router.post("", response_model=OrderOut, status_code=201)
async def create_order(
    body: OrderCreate,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD)),
    db: AsyncSession = Depends(get_db),
):
    order_no = await _gen_order_no(db)

    order_data = body.model_dump()
    if order_data.get("total_amount") is None and order_data.get("unit_price") is not None:
        order_data["total_amount"] = order_data["unit_price"] * body.quantity

    order = Order(**order_data, order_no=order_no)
    db.add(order)
    await db.commit()
    await db.refresh(order)

    if body.requisition_id:
        result = await db.execute(select(Requisition).where(Requisition.id == body.requisition_id))
        req = result.scalar_one_or_none()
        if req:
            req.status = RequisitionStatus.ORDER_CREATED
            await db.commit()

    return order


@router.patch("/{order_id}", response_model=OrderOut)
async def update_order(
    order_id: UUID,
    body: OrderUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")

    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(order, k, v)

    await db.commit()
    await db.refresh(order)
    return order


@router.post("/{order_id}/issue", response_model=OrderOut)
async def issue_order(
    order_id: UUID,
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")

    order.status = OrderStatus.ISSUED
    await db.commit()
    await db.refresh(order)

    po = PostOrder(
        order_id=order.id,
        requisition_id=order.requisition_id,
        ordered_quantity=order.quantity,
        status=PostOrderStatus.PENDING_INSPECTION,
    )
    db.add(po)
    await db.commit()
    return order