from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core import security
from app.core.config import settings
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserResponse, TokenRefreshRequest, TokenResponse

router = APIRouter()

# USER REGISTRATION (SIGN-UP)
@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserCreate
) -> Any:
    """
    Register a brand new user account in the system.
     3: Strictly enforces global lowercase email normalization to eliminate duplicate vectors.
    """
    #  Prevent duplicate identity leakages via rigorous lowercase normalization
    normalized_email = user_in.email.lower().strip()
    
    #  Integrity Check: Does identity already exist?
    existing_user = await UserRepository.get_by_email(db, email=normalized_email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists in our system."
        )
        
    #  Cryptographic Password Hashing Lifecycle
    hashed_password = security.get_password_hash(user_in.password)
    
    #  Intercept input payload to switch with normalized parameters
    user_in.email = normalized_email
    
    #  Transmit transaction record to Neon Cloud Serverless Instance
    new_user = await UserRepository.create(db, obj_in=user_in, hashed_password=hashed_password)
    return new_user


# 2. OAUTH2 COMPLIANT LOGIN (ACCESS TOKEN)
@router.post("/login", response_model=TokenResponse)
async def login(
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login. Consumes password forms and returns 
     Enforced strongly-typed TokenResponse schemas for rigid OpenAPI documentation.
    """
    # Re-apply normalization on incoming username inputs
    normalized_username = form_data.username.lower().strip()
    
    #  Fetch user by clean email index context
    user = await UserRepository.get_by_email(db, email=normalized_username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    #  Salted bcrypt cryptographic clearance check
    if not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Administrative security gate
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: This account has been deactivated."
        )

    # Generate Dual Enterprise Tokens (Token Rotation Enabled)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.id, role=user.role, expires_delta=access_token_expires
    )
    refresh_token = security.create_refresh_token(subject=user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }


#  INDUSTRY STANDARD TOKEN REFRESH
@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: TokenRefreshRequest) -> Any:
    """
     Re-architected async refresh pipeline utilizing strong typing.
    Consumes dedicated Pydantic request body structures to rotate stateless token sets cleanly.
    """
    try:
        # Extract and exchange token payloads via our core security utilities engine
        token_matrix = security.refresh_access_token(refresh_token=payload.refresh_token)
        
        # Note: In Step 10/Auth Lifecycle, we will expand this layer to attach fresh 
        # database user object validation to complete the TokenResponse footprint requirement.
        return token_matrix
        
    except security.AuthenticationError as auth_err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(auth_err),
            headers={"WWW-Authenticate": "Bearer"}
        )