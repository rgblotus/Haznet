from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime, timezone

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models import (
    User,
    PostOrder,
    Requisition,
    RequisitionStatus,
    UserRole,
    PostOrderStatus,
)
from app.schemas import PostOrderCreate, PostOrderUpdate, PostOrderOut

router = APIRouter()


@router.get("", response_model=list[PostOrderOut])
async def list_post_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all post-order records.

    Returns a list of post-order records ordered by creation date.
    """
    result = await db.execute(select(PostOrder).order_by(PostOrder.created_at.desc()))
    return result.scalars().all()


@router.get("/{po_id}", response_model=PostOrderOut)
async def get_post_order(po_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a single post-order record by ID.

    Returns the post-order details.
    """
    result = await db.execute(select(PostOrder).where(PostOrder.id == po_id))
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(404, "Post-order record not found")
    return po


@router.post("", response_model=PostOrderOut)
async def create_post_order(
    body: PostOrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new post-order record.

    Returns the created post-order record.
    """
    po = PostOrder(**body.model_dump())
    db.add(po)
    await db.commit()
    await db.refresh(po)
    return po


@router.patch("/{po_id}", response_model=PostOrderOut)
async def update_post_order(
    po_id: UUID,
    body: PostOrderUpdate,
    current_user: User = Depends(require_role(UserRole.INVENTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Update a post-order record and optionally mark requisition as completed.

    Returns the updated post-order record.
    """
    result = await db.execute(select(PostOrder).where(PostOrder.id == po_id))
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(404, "Post-order record not found")

    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(po, k, v)

    if body.status == PostOrderStatus.COMPLETED and po.requisition_id:
        req_result = await db.execute(
            select(Requisition).where(Requisition.id == po.requisition_id)
        )
        req = req_result.scalar_one_or_none()
        if req and req.status != RequisitionStatus.COMPLETED:
            req.status = RequisitionStatus.COMPLETED

    await db.commit()
    await db.refresh(po)
    return po


@router.post("/{po_id}/receive")
async def receive_goods(
    po_id: UUID,
    received_by: UUID,
    current_user: User = Depends(require_role(UserRole.INVENTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Mark goods as received for a post-order record.

    Returns a success confirmation message.
    """
    result = await db.execute(select(PostOrder).where(PostOrder.id == po_id))
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(404, "Post-order record not found")

    po.received_by = received_by
    po.received_date = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Goods marked as received"}
