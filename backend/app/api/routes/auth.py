from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

from ...core.database import get_db
from ...core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user_id,
)
from ...core.config import settings
from ...models.user import User
from ...schemas.user import UserCreate, UserLogin, UserResponse, Token
from ...services.audit import AuditService

router = APIRouter()


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user (admin only in production)"""
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

    # Create user
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

    # Audit log
    await AuditService.log(
        db=db,
        action="user_create",
        user_id=user.id,
        resource_type="user",
        resource_id=user.id,
        details={"username": user.username, "role": user.role.value},
        ip_address=request.client.host if request.client else None,
    )

    return user


@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate user and return JWT token"""
    result = await db.execute(select(User).where(User.username == user_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(user_data.password, user.hashed_password):
        # Log failed login attempt
        await AuditService.log(
            db=db,
            action="login_failed",
            username=user_data.username,
            details={"reason": "Invalid credentials"},
            ip_address=request.client.host if request.client else None,
            success="failure",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )

    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()

    # Create token
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role.value, "username": user.username}
    )

    # Audit log
    await AuditService.log(
        db=db,
        action="login",
        user_id=user.id,
        details={"username": user.username},
        ip_address=request.client.host if request.client else None,
    )

    return Token(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get current authenticated user"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user
