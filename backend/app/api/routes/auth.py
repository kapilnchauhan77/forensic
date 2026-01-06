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
    generate_oauth_state,
    get_google_authorize_url,
    exchange_code_for_tokens,
    verify_google_id_token,
)
from ...core.config import settings
from ...models.user import User, AuthProvider
from ...schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    GoogleAuthUrl,
    GoogleCallbackRequest,
    OAuthLoginResponse,
)
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


# ============ Google OAuth Endpoints ============

# In-memory store for OAuth state (use Redis in production)
oauth_states: dict[str, datetime] = {}


@router.get("/google/authorize", response_model=GoogleAuthUrl)
async def google_authorize():
    """Generate Google OAuth authorization URL with CSRF state"""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured",
        )

    state = generate_oauth_state()
    # Store state with expiration (10 minutes)
    oauth_states[state] = datetime.utcnow() + timedelta(minutes=10)

    # Clean up expired states
    now = datetime.utcnow()
    expired = [s for s, exp in oauth_states.items() if exp < now]
    for s in expired:
        del oauth_states[s]

    url = get_google_authorize_url(state)
    return GoogleAuthUrl(url=url, state=state)


@router.post("/google/callback", response_model=OAuthLoginResponse)
async def google_callback(
    callback_data: GoogleCallbackRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Handle Google OAuth callback - exchange code for tokens and authenticate user"""
    # Validate state (CSRF protection)
    if callback_data.state not in oauth_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired state parameter",
        )

    # Check if state has expired
    if oauth_states[callback_data.state] < datetime.utcnow():
        del oauth_states[callback_data.state]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="State parameter has expired",
        )

    # Remove used state
    del oauth_states[callback_data.state]

    # Exchange code for tokens
    tokens = await exchange_code_for_tokens(callback_data.code)
    id_token_str = tokens.get("id_token")

    if not id_token_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No ID token received from Google",
        )

    # Verify ID token and get user info
    google_user = verify_google_id_token(id_token_str)

    if not google_user.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email is not verified",
        )

    # Look up user by google_id first (primary identifier)
    result = await db.execute(
        select(User).where(User.google_id == google_user["google_id"])
    )
    user = result.scalar_one_or_none()
    is_new_user = False

    if not user:
        # Check if email exists with a different auth provider
        result = await db.execute(
            select(User).where(User.email == google_user["email"])
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            if existing_user.auth_provider == AuthProvider.LOCAL:
                # Email exists with password auth - reject to prevent account takeover
                await AuditService.log(
                    db=db,
                    action="oauth_login_rejected",
                    details={
                        "email": google_user["email"],
                        "reason": "Email already registered with password",
                    },
                    ip_address=request.client.host if request.client else None,
                    success="failure",
                )
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email already exists. Please use password login.",
                )

        # Create new user with is_active=False (requires admin approval)
        # Generate unique username from email
        email_prefix = google_user["email"].split("@")[0]
        base_username = email_prefix[:20]  # Limit length
        username = base_username

        # Check for username conflicts
        counter = 1
        while True:
            result = await db.execute(
                select(User).where(User.username == username)
            )
            if not result.scalar_one_or_none():
                break
            username = f"{base_username}{counter}"
            counter += 1

        user = User(
            email=google_user["email"],
            username=username,
            full_name=google_user.get("name"),
            auth_provider=AuthProvider.GOOGLE,
            google_id=google_user["google_id"],
            profile_picture=google_user.get("picture"),
            is_active=False,  # New users require admin approval
            hashed_password=None,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        is_new_user = True

        # Audit log
        await AuditService.log(
            db=db,
            action="oauth_user_created",
            user_id=user.id,
            resource_type="user",
            resource_id=user.id,
            details={
                "email": user.email,
                "auth_provider": "google",
                "pending_approval": True,
            },
            ip_address=request.client.host if request.client else None,
        )
    else:
        # Update profile picture if changed
        if google_user.get("picture") != user.profile_picture:
            user.profile_picture = google_user.get("picture")
            await db.commit()

    # Check if user is active
    pending_approval = not user.is_active

    if pending_approval:
        # Return response indicating pending approval (no token for inactive users)
        return OAuthLoginResponse(
            access_token="",  # Empty token for inactive users
            user=UserResponse.model_validate(user),
            is_new_user=is_new_user,
            pending_approval=True,
        )

    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()

    # Create JWT token
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role.value, "username": user.username}
    )

    # Audit log
    await AuditService.log(
        db=db,
        action="oauth_login",
        user_id=user.id,
        details={"username": user.username, "auth_provider": "google"},
        ip_address=request.client.host if request.client else None,
    )

    return OAuthLoginResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
        is_new_user=is_new_user,
        pending_approval=False,
    )
