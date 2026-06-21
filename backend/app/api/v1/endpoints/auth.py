from datetime import timedelta, datetime, timezone
from typing import Any
import secrets
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from pydantic import BaseModel, EmailStr

from app.api import deps
from app.core import security
from app.core.config import settings
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserResponse, TokenRefreshRequest, TokenResponse
from app.models.auth import OTPVerification, PasswordResetToken
from app.services.email import send_otp_email, send_password_reset_email

router = APIRouter()

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str
    purpose: str

def generate_otp() -> str:
    return "".join(secrets.choice("0123456789") for _ in range(6))

async def create_and_send_otp(db: AsyncSession, email: str, purpose: str):
    otp_code = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Store in DB
    otp_record = OTPVerification(
        email=email,
        otp_code=otp_code,
        purpose=purpose,
        expires_at=expires_at
    )
    db.add(otp_record)
    await db.commit()
    
    # Dispatch Async Email
    await send_otp_email(email, otp_code, purpose)

# 1. USER REGISTRATION (SIGN-UP)
@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserCreate
) -> Any:
    """
    Register a brand new user account in the system and triggers OTP flow.
    """
    normalized_email = user_in.email.lower().strip()
    
    existing_user = await UserRepository.get_by_email(db, email=normalized_email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists in our system."
        )
        
    hashed_password = security.get_password_hash(user_in.password)
    user_in.email = normalized_email
    
    # Force verification status to False for OTP Gate
    new_user = await UserRepository.create(db, obj_in=user_in, hashed_password=hashed_password)
    new_user.is_verified = False
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Trigger OTP
    await create_and_send_otp(db, normalized_email, "registration")
    
    return new_user

# 2. OAUTH2 COMPLIANT LOGIN - STAGE 1 (VERIFY PASSWORD, SEND OTP)
@router.post("/login")
async def login(
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    Dual-Gate login process. Verifies credentials and issues a 202 Accepted directing the client to the OTP Verification step.
    """
    normalized_username = form_data.username.lower().strip()
    
    user = await UserRepository.get_by_email(db, email=normalized_username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: This account has been deactivated."
        )

    # Instead of generating tokens immediately, generate OTP and enforce Dual-Gate
    await create_and_send_otp(db, normalized_username, "login")

    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"status": "otp_required", "message": "Verification code dispatched to corporate email address."}
    )

# 3. VERIFY OTP GATEWAY (LOGIN & REGISTRATION)
@router.post("/verify-otp")
async def verify_otp(
    payload: VerifyOTPRequest,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """
    Consumes the 6-digit code for either Registration or Login pathways.
    Returns the JWT payload if used for Login.
    """
    normalized_email = payload.email.lower().strip()
    
    statement = select(OTPVerification).where(
        OTPVerification.email == normalized_email,
        OTPVerification.purpose == payload.purpose,
        OTPVerification.is_used == False
    ).order_by(OTPVerification.created_at.desc())
    
    result = await db.execute(statement)
    latest_otp = result.scalars().first()

    if not latest_otp or latest_otp.otp_code != payload.otp_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code.")
        
    if datetime.now(timezone.utc) > latest_otp.expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code has expired.")

    # Mark as used
    latest_otp.is_used = True
    db.add(latest_otp)
    
    user = await UserRepository.get_by_email(db, email=normalized_email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    if payload.purpose == "registration":
        user.is_verified = True
        db.add(user)
        await db.commit()
        return {"status": "success", "message": "Identity verified successfully."}

    elif payload.purpose == "login":
        await db.commit()
        
        # Issue standard JWT matrix
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            subject=user.id, role=user.role, expires_delta=access_token_expires
        )
        refresh_token = security.create_refresh_token(subject=user.id)

        # Assuming UserResponse structure maps natively to UserMetadata via from_attributes
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role
            }
        }

# 4. INDUSTRY STANDARD TOKEN REFRESH
@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: TokenRefreshRequest) -> Any:
    try:
        token_matrix = security.refresh_access_token(refresh_token=payload.refresh_token)
        return token_matrix
    except security.AuthenticationError as auth_err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(auth_err),
            headers={"WWW-Authenticate": "Bearer"}
        )

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# 5. PASSWORD RESET TRIGGER
@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """
    Trigger the secure password reset flow. Returns 200 OK regardless of existence 
    to prevent email enumeration attacks.
    """
    normalized_email = payload.email.lower().strip()
    user = await UserRepository.get_by_email(db, email=normalized_email)
    
    if user:
        reset_token = str(uuid.uuid4())
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        
        token_record = PasswordResetToken(
            email=normalized_email,
            token=reset_token,
            expires_at=expires_at
        )
        db.add(token_record)
        await db.commit()
        
        await send_password_reset_email(normalized_email, reset_token)

    return {"status": "success", "message": "If an account with that email exists, a password reset link has been dispatched."}

# 6. PASSWORD RESET COMMIT
@router.post("/reset-password")
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """
    Validates the token and applies the new password securely.
    """
    statement = select(PasswordResetToken).where(
        PasswordResetToken.token == payload.token,
        PasswordResetToken.is_used == False
    ).order_by(PasswordResetToken.created_at.desc())
    
    result = await db.execute(statement)
    latest_token = result.scalars().first()
    
    if not latest_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This security reset link has expired or is invalid.")
        
    if datetime.now(timezone.utc) > latest_token.expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This security reset link has expired or is invalid.")
        
    user = await UserRepository.get_by_email(db, email=latest_token.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")
        
    hashed_password = security.get_password_hash(payload.new_password)
    user.hashed_password = hashed_password
    db.add(user)
    
    latest_token.is_used = True
    db.add(latest_token)
    
    await db.commit()
    
    return {"status": "success", "message": "Password has been successfully reset."}