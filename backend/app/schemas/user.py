from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from ..models.user import UserRole, AuthProvider


class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    agency: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.READONLY


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    agency: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    auth_provider: AuthProvider = AuthProvider.LOCAL
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# OAuth schemas
class GoogleAuthUrl(BaseModel):
    url: str
    state: str


class GoogleCallbackRequest(BaseModel):
    code: str
    state: str


class OAuthLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    is_new_user: bool = False
    pending_approval: bool = False
