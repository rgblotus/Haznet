from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models import Requisition, Tender, Vendor, Order
from app.models.enums import RequisitionStatus, TenderStatus, OrderStatus

router = APIRouter()


@router.get("/stats")
async def get_public_stats(db: AsyncSession = Depends(get_db)):
    """Public stats for landing page - no auth required"""

    # Total requisitions
    req_result = await db.execute(select(func.count(Requisition.id)))
    total_requisitions = req_result.scalar() or 0

    # Completed requisitions
    completed_result = await db.execute(
        select(func.count(Requisition.id)).where(
            Requisition.status == RequisitionStatus.COMPLETED
        )
    )
    completed_requisitions = completed_result.scalar() or 0

    # Active tenders
    tender_result = await db.execute(
        select(func.count(Tender.id)).where(
            Tender.status.in_(
                [TenderStatus.BIDDING, TenderStatus.PUBLISHED, TenderStatus.EVALUATING]
            )
        )
    )
    active_tenders = tender_result.scalar() or 0

    # Total vendors
    vendor_result = await db.execute(select(func.count(Vendor.id)))
    total_vendors = vendor_result.scalar() or 0

    # Active orders
    order_result = await db.execute(
        select(func.count(Order.id)).where(
            Order.status.in_(
                [OrderStatus.APPROVED, OrderStatus.ISSUED, OrderStatus.SHIPPED]
            )
        )
    )
    active_orders = order_result.scalar() or 0

    return {
        "total_requisitions": total_requisitions,
        "completed_requisitions": completed_requisitions,
        "active_tenders": active_tenders,
        "total_vendors": total_vendors,
        "active_orders": active_orders,
    }
