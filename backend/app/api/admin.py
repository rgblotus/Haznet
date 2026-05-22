from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.database import get_db
from app.middleware.auth import get_current_user, require_role, hash_password
from app.models import User, Department, UserRole
from app.schemas import (
    UserCreate,
    UserUpdate,
    UserOut,
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentOut,
    PaginatedResponse,
    create_pagination_meta,
)

router = APIRouter()


def user_to_out(user: User) -> UserOut:
    out = UserOut.model_validate(user)
    if user.department:
        out.department_name = user.department.name
    return out


@router.get("/users", response_model=PaginatedResponse[UserOut])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    role: str | None = None,
    is_active: bool | None = None,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """List users with optional filtering and pagination (admin only).

    Returns paginated users filtered by search, role, or active status.
    """
    query = select(User)
    count_query = select(func.count(User.id))

    if search:
        search_filter = (
            User.username.ilike(f"%{search}%")
            | User.email.ilike(f"%{search}%")
            | User.first_name.ilike(f"%{search}%")
            | User.last_name.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if role:
        query = query.where(User.role == UserRole(role))
        count_query = count_query.where(User.role == UserRole(role))

    if is_active is not None:
        query = query.where(User.is_active == is_active)
        count_query = count_query.where(User.is_active == is_active)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = (
        query.options(selectinload(User.department))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    users = result.scalars().all()

    return PaginatedResponse(
        data=[user_to_out(u) for u in users],
        meta=create_pagination_meta(total, page, page_size),
    )


@router.post("/users", response_model=UserOut, status_code=201)
async def create_user(
    body: UserCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user (admin only).

    Returns the created user details.
    """
    result = await db.execute(
        select(User).where(
            (User.username == body.username) | (User.email == body.email)
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(400, "Username or email already exists")

    user = User(
        username=body.username,
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        employee_id=body.employee_id,
        contact=body.contact,
        designation=body.designation,
        avatar=body.avatar,
        bio=body.bio,
        role=body.role,
        department_id=body.department_id,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user_to_out(user)


@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Get a single user by ID (admin only).

    Returns the user details.
    """
    result = await db.execute(
        select(User).options(selectinload(User.department)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return user_to_out(user)


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: UUID,
    body: UserUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's details (admin only).

    Returns the updated user.
    """
    result = await db.execute(
        select(User).options(selectinload(User.department)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    update_data = body.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(user, key, value)

    await db.commit()
    await db.refresh(user)
    return user_to_out(user)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a user (soft delete, admin only).

    Returns a success confirmation message.
    """
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot delete your own account")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    user.is_active = False
    await db.commit()
    return {"message": "User deactivated successfully"}


@router.post("/departments", response_model=DepartmentOut, status_code=201)
async def create_department(
    body: DepartmentCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Create a new department (admin only).

    Returns the created department.
    """
    result = await db.execute(
        select(Department).where(
            (Department.name == body.name) | (Department.code == body.code)
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(400, "Department already exists")

    dept = Department(**body.model_dump())
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept


@router.get("/departments", response_model=PaginatedResponse[DepartmentOut])
async def list_departments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List departments with optional pagination and search.

    Returns paginated departments.
    """
    query = select(Department)
    count_query = select(func.count(Department.id))

    if search:
        search_filter = Department.name.ilike(f"%{search}%") | Department.code.ilike(
            f"%{search}%"
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    departments = result.scalars().all()

    return PaginatedResponse(
        data=[DepartmentOut.model_validate(d) for d in departments],
        meta=create_pagination_meta(total, page, page_size),
    )


@router.get("/departments/{dept_id}", response_model=DepartmentOut)
async def get_department(
    dept_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single department by ID.

    Returns the department details.
    """
    result = await db.execute(select(Department).where(Department.id == dept_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(404, "Department not found")
    return dept


@router.patch("/departments/{dept_id}", response_model=DepartmentOut)
async def update_department(
    dept_id: UUID,
    body: DepartmentUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Update a department (admin only).

    Returns the updated department.
    """
    result = await db.execute(select(Department).where(Department.id == dept_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(404, "Department not found")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(dept, key, value)

    await db.commit()
    await db.refresh(dept)
    return dept
