from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Integer, or_
from uuid import UUID

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models import (
    User,
    Tender,
    Bid,
    Requisition,
    UserRole,
    TenderStatus,
    RequisitionStatus,
)
from app.schemas import (
    TenderCreate,
    TenderUpdate,
    TenderOut,
    BidCreate,
    BidOut,
    PaginatedResponse,
    create_pagination_meta,
)

router = APIRouter()


async def _gen_tender_no(db: AsyncSession):
    result = await db.execute(
        select(func.max(cast(func.substring(Tender.tender_no, 5), Integer)))
    )
    num = result.scalar() or 0
    return f"TND-{num + 1:05d}"


@router.get("", response_model=PaginatedResponse[TenderOut])
async def list_tenders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    search: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List tenders with optional filtering and pagination.

    Returns paginated tenders filtered by status or search term.
    """
    query = select(Tender)
    count_query = select(func.count(Tender.id))

    if current_user.role == UserRole.INDENTOR:
        req_subquery = select(Requisition.id).where(
            Requisition.creator_id == current_user.id
        )
        query = query.where(Tender.requisition_id.in_(req_subquery))
        count_query = count_query.where(Tender.requisition_id.in_(req_subquery))

    if status:
        query = query.where(Tender.status == TenderStatus(status))
        count_query = count_query.where(Tender.status == TenderStatus(status))

    if search:
        search_filter = or_(
            Tender.title.ilike(f"%{search}%"),
            Tender.tender_no.ilike(f"%{search}%"),
            Tender.description.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = (
        query.order_by(Tender.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    tenders = result.scalars().all()

    return PaginatedResponse(
        data=[TenderOut.model_validate(t) for t in tenders],
        meta=create_pagination_meta(total, page, page_size),
    )


@router.get("/{tender_id}", response_model=TenderOut)
async def get_tender(
    tender_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single tender by ID.

    Returns the tender details.
    """
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(404, "Tender not found")

    if current_user.role == UserRole.INDENTOR and tender.requisition_id:
        req_result = await db.execute(
            select(Requisition).where(
                Requisition.id == tender.requisition_id,
                Requisition.creator_id == current_user.id,
            )
        )
        if not req_result.scalar_one_or_none():
            raise HTTPException(403, "You do not have permission to view this tender")

    return tender


@router.post("", response_model=TenderOut, status_code=201)
async def create_tender(
    body: TenderCreate,
    current_user: User = Depends(
        require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new tender.

    Returns the created tender with generated tender number.
    """
    tender_no = await _gen_tender_no(db)
    tender = Tender(**body.model_dump(), tender_no=tender_no)
    db.add(tender)

    if body.requisition_id:
        req_result = await db.execute(
            select(Requisition).where(Requisition.id == body.requisition_id)
        )
        req = req_result.scalar_one_or_none()
        if req:
            req.tender_id = tender.id
            req.status = RequisitionStatus.TENDER_CREATED

    await db.commit()
    await db.refresh(tender)
    return tender


@router.patch("/{tender_id}", response_model=TenderOut)
async def update_tender(
    tender_id: UUID,
    body: TenderUpdate,
    current_user: User = Depends(
        require_role(
            UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC, UserRole.ADMIN
        )
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing tender.

    Returns the updated tender.
    """
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(404, "Tender not found")

    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(tender, k, v)

    await db.commit()
    await db.refresh(tender)
    return tender


@router.delete("/{tender_id}")
async def delete_tender(
    tender_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Delete a tender.

    Returns a success confirmation message.
    """
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(404, "Tender not found")

    if tender.requisition_id:
        req_result = await db.execute(
            select(Requisition).where(Requisition.id == tender.requisition_id)
        )
        req = req_result.scalar_one_or_none()
        if req:
            req.tender_id = None
            req.status = RequisitionStatus.PROCESSING

    await db.delete(tender)
    await db.commit()
    return {"message": "Tender deleted successfully"}


@router.post("/{tender_id}/publish", response_model=TenderOut)
async def publish_tender(
    tender_id: UUID,
    current_user: User = Depends(
        require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)
    ),
    db: AsyncSession = Depends(get_db),
):
    """Publish a tender and open it for bidding.

    Returns the tender with updated status and issue date.
    """
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(404, "Tender not found")

    from datetime import datetime, timezone

    tender.status = TenderStatus.BIDDING
    tender.issue_date = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(tender)
    return tender


@router.get("/{tender_id}/bids", response_model=list[BidOut])
async def list_bids(
    tender_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all bids for a tender.

    Returns a list of bids ordered by creation date.
    """
    tender_result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = tender_result.scalar_one_or_none()
    if not tender:
        raise HTTPException(404, "Tender not found")

    if current_user.role == UserRole.INDENTOR and tender.requisition_id:
        req_result = await db.execute(
            select(Requisition).where(
                Requisition.id == tender.requisition_id,
                Requisition.creator_id == current_user.id,
            )
        )
        if not req_result.scalar_one_or_none():
            raise HTTPException(
                403, "You do not have permission to view bids for this tender"
            )

    result = await db.execute(
        select(Bid).where(Bid.tender_id == tender_id).order_by(Bid.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{tender_id}/bids", response_model=BidOut, status_code=201)
async def create_bid(
    tender_id: UUID,
    body: BidCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new bid for a tender.

    Returns the created bid.
    """
    tender_result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = tender_result.scalar_one_or_none()
    if not tender:
        raise HTTPException(404, "Tender not found")

    bid = Bid(**body.model_dump())
    db.add(bid)
    await db.commit()
    await db.refresh(bid)
    return bid


@router.post("/{tender_id}/bids/{bid_id}/evaluate")
async def evaluate_bid(
    tender_id: UUID,
    bid_id: UUID,
    technical_score: float,
    financial_score: float,
    current_user: User = Depends(
        require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)
    ),
    db: AsyncSession = Depends(get_db),
):
    """Evaluate a bid with technical and financial scores.

    Returns the evaluation results with total score.
    """
    result = await db.execute(select(Bid).where(Bid.id == bid_id))
    bid = result.scalar_one_or_none()
    if not bid or bid.tender_id != tender_id:
        raise HTTPException(404, "Bid not found")

    bid.technical_score = technical_score
    bid.financial_score = financial_score
    bid.total_score = (technical_score + financial_score) / 2
    await db.commit()

    return {"message": "Bid evaluated", "total_score": bid.total_score}


@router.post("/{tender_id}/bids/{bid_id}/award")
async def award_bid(
    tender_id: UUID,
    bid_id: UUID,
    current_user: User = Depends(
        require_role(UserRole.PROCUREMENT_OFFICER, UserRole.CNP_HOD, UserRole.OIC)
    ),
    db: AsyncSession = Depends(get_db),
):
    """Award a tender to a specific bid.

    Returns a success message confirming the award.
    """
    bids_result = await db.execute(select(Bid).where(Bid.tender_id == tender_id))
    for bid in bids_result.scalars().all():
        bid.is_awarded = False

    result = await db.execute(select(Bid).where(Bid.id == bid_id))
    bid = result.scalar_one_or_none()
    if not bid or bid.tender_id != tender_id:
        raise HTTPException(404, "Bid not found")

    bid.is_awarded = True

    tender_result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = tender_result.scalar_one_or_none()
    if tender:
        tender.status = TenderStatus.AWARDED

    if tender and tender.requisition_id:
        req_result = await db.execute(
            select(Requisition).where(Requisition.id == tender.requisition_id)
        )
        req = req_result.scalar_one_or_none()
        if req:
            req.status = RequisitionStatus.TENDER_AWARDED

    await db.commit()
    return {"message": "Bid awarded successfully"}
