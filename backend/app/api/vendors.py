from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from uuid import UUID

from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.models import User, Vendor, UserRole
from app.schemas import (
    VendorCreate, VendorUpdate, VendorOut,
    PaginatedResponse, create_pagination_meta,
)

router = APIRouter()


@router.get("", response_model=PaginatedResponse[VendorOut])
async def list_vendors(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status: str | None = None,
    category: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Vendor)
    count_query = select(func.count(Vendor.id))

    if search:
        search_filter = or_(
            Vendor.name.ilike(f"%{search}%"),
            Vendor.contact_person.ilike(f"%{search}%"),
            Vendor.email.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if status:
        query = query.where(Vendor.status == status)
        count_query = count_query.where(Vendor.status == status)

    if category:
        query = query.where(Vendor.category == category)
        count_query = count_query.where(Vendor.category == category)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Vendor.name).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    vendors = result.scalars().all()

    return PaginatedResponse(
        data=[VendorOut.model_validate(v) for v in vendors],
        meta=create_pagination_meta(total, page, page_size),
    )


@router.post("", response_model=VendorOut, status_code=201)
async def create_vendor(
    body: VendorCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.CNP_HOD, UserRole.PROCUREMENT_OFFICER)),
    db: AsyncSession = Depends(get_db),
):
    vendor = Vendor(**body.model_dump(), status="Active")
    db.add(vendor)
    await db.commit()
    await db.refresh(vendor)
    return vendor


@router.get("/{vendor_id}", response_model=VendorOut)
async def get_vendor(
    vendor_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(404, "Vendor not found")
    return vendor


@router.patch("/{vendor_id}", response_model=VendorOut)
async def update_vendor(
    vendor_id: UUID,
    body: VendorUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.CNP_HOD)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(404, "Vendor not found")

    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(vendor, k, v)

    await db.commit()
    await db.refresh(vendor)
    return vendor


@router.delete("/{vendor_id}")
async def delete_vendor(
    vendor_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(404, "Vendor not found")

    vendor.status = "Inactive"
    await db.commit()
    return {"message": "Vendor deactivated successfully"}