from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.middleware.auth import (
    verify_password, create_access_token, get_current_user,
    hash_password,
)
from app.models import User, UserRole
from app.schemas import (
    LoginRequest, TokenResponse, UserOut,
    UserCreate,
)

router = APIRouter()


def user_to_out(user: User) -> UserOut:
    out = UserOut.model_validate(user)
    if user.department:
        out.department_name = user.department.name
    return out


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).options(selectinload(User.department)).where((User.username == body.username) | (User.email == body.username))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact administrator.",
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role.value,
            "username": user.username,
        },
    )

    return TokenResponse(access_token=access_token, user=user_to_out(user))


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return user_to_out(current_user)


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(current_user: User = Depends(get_current_user)):
    access_token = create_access_token(
        data={
            "sub": str(current_user.id),
            "role": current_user.role.value,
            "username": current_user.username,
        },
    )
    return TokenResponse(access_token=access_token, user=user_to_out(current_user))


@router.post("/register", response_model=UserOut, status_code=201)
async def register(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(User).where((User.username == body.username) | (User.email == body.email))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Username or email already exists")

    user = User(
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        employee_id=body.employee_id,
        contact=body.contact,
        designation=body.designation,
        avatar=body.avatar,
        bio=body.bio,
        role=UserRole.INDENTOR,
        department_id=body.department_id,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user, attribute_names=["department"])
    return user_to_out(user)