import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models import User, Document, Requisition
from app.schemas import DocumentOut

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/{req_id}", response_model=list[DocumentOut])
async def list_documents(
    req_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Requisition).where(Requisition.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Requisition not found")

    result = await db.execute(
        select(Document).where(Document.requisition_id == req_id).order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()

    output = []
    for doc in docs:
        uploader_result = await db.execute(select(User).where(User.id == doc.uploaded_by))
        uploader = uploader_result.scalar_one_or_none()
        doc_out = DocumentOut.model_validate(doc)
        doc_out.uploader_name = f"{uploader.first_name} {uploader.last_name}" if uploader else "Unknown"
        output.append(doc_out)
    return output


@router.post("/{req_id}", response_model=DocumentOut, status_code=201)
async def upload_document(
    req_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Document not found")

    if current_user.role.value != "admin" and doc.uploaded_by != current_user.id:
        raise HTTPException(403, "You do not have permission to delete this document")

    file_path = os.path.join(UPLOAD_DIR, doc.file_path)
    if os.path.exists(file_path):
        os.remove(file_path)

    await db.delete(doc)
    await db.commit()
    return {"message": "Document deleted successfully"}
