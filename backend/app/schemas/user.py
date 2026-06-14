import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# SHARED/BASE PROPERTIES
class UserBase(BaseModel):
    """Base Pydantic schema enforcing shared attributes across all user contexts."""
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)


# USER CREATION PROPERTIES (SIGN-UP PAYLOAD)
class UserCreate(UserBase):
    """Rigid verification validation schema consumed during user signup registration."""
    password: str = Field(..., min_length=8, max_length=100, description="Plaintext raw user password.")


#  USER UPDATE PROPERTIES (PROFILE MODIFICATION)
class UserUpdate(BaseModel):
    """Permissive schema allowing partial or atomic updates to user profiles."""
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8, max_length=100)
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)


# API RESPONSE SERIALIZER (SAFE DATABASE SNAPSHOT)
class UserResponse(UserBase):
    """
    Safe outbound response schema mapping active PostgreSQL fields.
    Automatically filters out the sensitive 'hashed_password' cluster.
    """
    id: uuid.UUID
    role: str
    is_active: bool
    is_verified: bool

    # Pydantic v2 configuration to natively read SQLAlchemy ORM instances
    model_config = ConfigDict(from_attributes=True)


# DUAL TOKEN & LIFECYCLE SCHEMAS
class TokenRefreshRequest(BaseModel):
    """Rigid body model for consuming long-lived refresh tokens securely during rotation."""
    refresh_token: str


class UserMetadata(BaseModel):
    """User profile metadata snapshot embedded directly inside the login handshake."""
    id: uuid.UUID
    email: EmailStr
    first_name: str
    last_name: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """Enterprise-grade OAuth2 compliant dual-token response payload template."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserMetadata