from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models import User, Message, UserRole
from app.schemas import MessageCreate, MessageOut

router = APIRouter()


@router.get("", response_model=list[MessageOut])
async def list_messages(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List messages for the current user (sent or received).

    Returns a list of messages ordered by creation date.
    """
    result = await db.execute(
        select(Message)
        .where(
            (Message.receiver_id == current_user.id)
            | (Message.sender_id == current_user.id)
        )
        .order_by(Message.created_at.desc())
    )
    return result.scalars().all()


@router.get("/requisition/{req_id}", response_model=list[MessageOut])
async def get_req_messages(req_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get messages for a specific requisition.

    Returns a list of messages ordered by creation date.
    """
    result = await db.execute(
        select(Message)
        .where(Message.requisition_id == req_id)
        .order_by(Message.created_at)
    )
    return result.scalars().all()


@router.post("", response_model=MessageOut)
async def send_message(
    body: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message to another user.

    Returns the created message.
    """
    msg = Message(
        content=body.content,
        sender_id=current_user.id,
        receiver_id=body.receiver_id,
        requisition_id=body.requisition_id,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


@router.get("/inbox/{user_id}", response_model=list[MessageOut])
async def get_inbox(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get inbox messages for a specific user.

    Returns a list of received messages.
    """
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(403, "Access denied")
    result = await db.execute(
        select(Message)
        .where(Message.receiver_id == user_id)
        .order_by(Message.created_at.desc())
    )
    return result.scalars().all()
