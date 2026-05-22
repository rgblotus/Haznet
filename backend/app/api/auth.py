from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.middleware.auth import (
    verify_password,
    create_access_token,
    get_current_user,
    hash_password,
)
from app.models import User, UserRole
from app.schemas import (
    LoginRequest,
    TokenResponse,
    UserOut,
    UserCreate,
)
from app.services.auth import AuthService, AuthError

router = APIRouter()


def user_to_out(user: User) -> UserOut:
    out = UserOut.model_validate(user)
    if user.department:
        out.department_name = user.department.name
    return out


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return an access token.

    Returns a token with user details on successful login.
    """
    service = AuthService(db)
    try:
        user = await service.authenticate(body.username, body.password)
    except AuthError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"} if e.status_code == 401 else None,
        )

    result = await db.execute(
        select(User)
        .options(selectinload(User.department))
        .where(User.id == user.id)
    )
    user = result.scalar_one_or_none()

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
    """Get the current authenticated user's profile.

    Returns the user details for the logged-in user.
    """
    return user_to_out(current_user)


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Log out the current user.

    Returns a success confirmation message.
    """
    return {"message": "Successfully logged out"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(current_user: User = Depends(get_current_user)):
    """Refresh the access token for the current user.

    Returns a new access token with updated expiry.
    """
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Register a new user.

    Returns the created user details.
    """
    service = AuthService(db)
    try:
        user = await service.create_user(body, current_user.role.value)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    await db.commit()
    await db.refresh(user, attribute_names=["department"])
    return user_to_out(user)
