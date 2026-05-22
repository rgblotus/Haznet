import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models import User, Document, Requisition, Tender, UserRole, DocumentCategory
from app.schemas import DocumentOut

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _doc_to_out(doc: Document) -> DocumentOut:
    doc_out = DocumentOut.model_validate(doc)
    doc_out.uploader_name = (
        f"{doc.uploader.first_name} {doc.uploader.last_name}"
        if doc.uploader
        else "Unknown"
    )
    return doc_out


@router.get("", response_model=list[DocumentOut])
async def list_documents(
    requisition_id: Optional[str] = Query(None),
    tender_id: Optional[str] = Query(None),
    bid_id: Optional[str] = Query(None),
    order_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List documents with optional filtering by entity and category.

    Returns a list of matching documents.
    """
    query = select(Document).options(selectinload(Document.uploader))

    if requisition_id:
        query = query.where(Document.requisition_id == UUID(requisition_id))
    if tender_id:
        query = query.where(Document.tender_id == UUID(tender_id))
    if bid_id:
        query = query.where(Document.bid_id == UUID(bid_id))
    if order_id:
        query = query.where(Document.order_id == UUID(order_id))
    if category:
        query = query.where(Document.category == DocumentCategory(category))

    query = query.order_by(Document.created_at.desc())
    result = await db.execute(query)
    docs = result.scalars().all()

    return [_doc_to_out(doc) for doc in docs]


@router.get("/{req_id}", response_model=list[DocumentOut])
async def list_requisition_documents(
    req_id: UUID,
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List documents for a specific requisition.

    Returns a list of documents, optionally filtered by category.
    """
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")

    query = (
        select(Document)
        .options(selectinload(Document.uploader))
        .where(Document.requisition_id == req_id)
    )
    if category:
        query = query.where(Document.category == DocumentCategory(category))
    query = query.order_by(Document.created_at.desc())

    result = await db.execute(query)
    docs = result.scalars().all()

    return [_doc_to_out(doc) for doc in docs]


@router.post("/{req_id}", response_model=DocumentOut, status_code=201)
async def upload_document(
    req_id: UUID,
    file: UploadFile = File(...),
    tender_id: Optional[str] = Query(None),
    bid_id: Optional[str] = Query(None),
    order_id: Optional[str] = Query(None),
    category: str = Query("other"),
    description: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document and attach it to a requisition.

    Returns the created document record.
    """
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")

    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    doc = Document(
        requisition_id=req_id,
        tender_id=UUID(tender_id) if tender_id else None,
        bid_id=UUID(bid_id) if bid_id else None,
        order_id=UUID(order_id) if order_id else None,
        category=DocumentCategory(category),
        description=description,
        file_name=file.filename or "unknown",
        file_path=unique_name,
        file_type=file.content_type,
        file_size=len(content),
        uploaded_by=current_user.id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    doc_out = DocumentOut.model_validate(doc)
    doc_out.uploader_name = f"{current_user.first_name} {current_user.last_name}"
    return doc_out


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a document (admin or uploader only).

    Returns a success confirmation message.
    """
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Document not found")

    if current_user.role != UserRole.ADMIN and doc.uploaded_by != current_user.id:
        raise HTTPException(403, "You do not have permission to delete this document")

    file_path = os.path.join(UPLOAD_DIR, doc.file_path)
    if os.path.exists(file_path):
        os.remove(file_path)

    await db.delete(doc)
    await db.commit()
    return {"message": "Document deleted successfully"}


@router.get("/tender/{tender_id}", response_model=list[DocumentOut])
async def list_tender_documents(
    tender_id: UUID,
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List documents for a specific tender.

    Returns a list of documents, optionally filtered by category.
    """
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(404, "Tender not found")

    query = (
        select(Document)
        .options(selectinload(Document.uploader))
        .where(Document.tender_id == tender_id)
    )
    if category:
        query = query.where(Document.category == DocumentCategory(category))
    query = query.order_by(Document.created_at.desc())

    result = await db.execute(query)
    docs = result.scalars().all()

    return [_doc_to_out(doc) for doc in docs]
