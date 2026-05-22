from datetime import datetime, timedelta, timezone
from uuid import UUID

from argon2 import PasswordHasher
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.middleware.auth import hash_password, verify_password, create_access_token
from app.models import User
from app.schemas import LoginRequest, UserCreate, UserOut

settings = get_settings()


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate(self, username: str, password: str) -> User:
        result = await self.db.execute(
            select(User).where(User.username == username)
        )
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.hashed_password):
            raise AuthError("Invalid username or password")
        if not user.is_active:
            raise AuthError("Account is disabled", status_code=403)
        return user

    async def get_by_id(self, user_id: UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def create_user(self, data: UserCreate, actor_role: str) -> User:
        if actor_role != "admin":
            raise AuthError("Only admins can create users", status_code=403)
        existing = await self.db.execute(
            select(User).where(
                (User.username == data.username) | (User.email == data.email)
            )
        )
        if existing.scalar_one_or_none():
            raise AuthError("Username or email already exists", status_code=409)
        user = User(
            username=data.username,
            email=data.email,
            hashed_password=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            employee_id=data.employee_id,
            contact=data.contact,
            role=data.role,
            department_id=data.department_id,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user
