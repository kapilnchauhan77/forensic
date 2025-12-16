from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from ...core.database import get_db
from ...core.security import (
    get_current_user_id,
    get_password_hash,
    require_admin,
)
from ...models.user import User
from ...schemas.user import UserCreate, UserUpdate, UserResponse
from ...services.audit import AuditService

router = APIRouter()


@router.get("", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(require_admin),
):
    """List all users (admin only)"""
    result = await db.execute(select(User).offset(skip).limit(limit))
    users = result.scalars().all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(require_admin),
):
    """Get user by ID (admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.post("", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_admin),
):
    """Create a new user (admin only)"""
    # Check if user exists
    result = await db.execute(
        select(User).where(
            (User.email == user_data.email) | (User.username == user_data.username)
        )
    )
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists",
        )

    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        agency=user_data.agency,
        role=user_data.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    await AuditService.log(
        db=db,
        action="user_create",
        user_id=current_user_id,
        resource_type="user",
        resource_id=user.id,
        details={"username": user.username, "role": user.role.value},
        ip_address=request.client.host if request.client else None,
    )

    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_admin),
):
    """Update user (admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    old_values = {
        "role": user.role.value if user.role else None,
        "is_active": user.is_active,
    }

    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    # Log role changes specifically
    if user_data.role and user_data.role.value != old_values["role"]:
        await AuditService.log(
            db=db,
            action="user_role_change",
            user_id=current_user_id,
            resource_type="user",
            resource_id=user.id,
            old_value={"role": old_values["role"]},
            new_value={"role": user_data.role.value},
            ip_address=request.client.host if request.client else None,
        )
    else:
        await AuditService.log(
            db=db,
            action="user_update",
            user_id=current_user_id,
            resource_type="user",
            resource_id=user.id,
            details=update_data,
            ip_address=request.client.host if request.client else None,
        )

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    _: bool = Depends(require_admin),
):
    """Delete user (admin only)"""
    if user_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    await AuditService.log(
        db=db,
        action="user_delete",
        user_id=current_user_id,
        resource_type="user",
        resource_id=user.id,
        details={"username": user.username},
        ip_address=request.client.host if request.client else None,
    )

    await db.delete(user)
    await db.commit()
