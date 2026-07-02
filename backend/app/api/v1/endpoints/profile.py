from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional
from app.api import deps
from app.models.user import User
from app.core.security import verify_password, get_password_hash

router = APIRouter()

class ProfileUpdateSchema(BaseModel):
    first_name: str
    last_name: str
    workspace_name: Optional[str] = None
    workspace_logo: Optional[str] = None
    profile_picture: Optional[str] = None
    is_2fa_enabled: bool = False

class PasswordChangeSchema(BaseModel):
    current_password: str
    new_password: str

@router.get("/me")
async def get_profile(current_user: User = Depends(deps.get_current_user)):
    return {
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "workspace_name": current_user.workspace_name,
        "workspace_logo": current_user.workspace_logo,
        "profile_picture": current_user.profile_picture,
        "is_2fa_enabled": current_user.is_2fa_enabled,
        "role": current_user.role,
        "subscription_tier": current_user.subscription_tier,
        "uploaded_files_count": current_user.uploaded_files_count,
        "subscription_expires_at": current_user.subscription_expires_at
    }

@router.put("/update")
async def update_profile(
    payload: ProfileUpdateSchema,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    current_user.first_name = payload.first_name
    current_user.last_name = payload.last_name
    current_user.workspace_name = payload.workspace_name
    
    # We only update the logo if a new one is provided. 
    # If the payload sends None, it might mean no change, but the UI should handle sending the existing one or omitting it.
    if payload.workspace_logo is not None:
        current_user.workspace_logo = payload.workspace_logo
        
    if payload.profile_picture is not None:
        current_user.profile_picture = payload.profile_picture
        
    current_user.is_2fa_enabled = payload.is_2fa_enabled

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return {"status": "success", "message": "Profile updated successfully."}

@router.post("/change-password")
async def change_password(
    payload: PasswordChangeSchema,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password.")
    
    current_user.hashed_password = get_password_hash(payload.new_password)
    db.add(current_user)
    await db.commit()
    
    return {"status": "success", "message": "Password changed successfully."}

user_router = APIRouter()

@user_router.get("/onboarding-status")
async def get_user_onboarding_status(
    current_user: User = Depends(deps.get_current_user)
):
    return {
        "has_uploaded_data": current_user.has_uploaded_data,
        "has_processed_data": current_user.has_processed_data,
        "has_explored_insights": current_user.has_explored_insights
    }
