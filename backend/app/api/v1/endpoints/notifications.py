import logging
import uuid
from typing import Dict, List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.models.user import User
from app.models.notification import Notification
from app.db.session import SessionLocal

router = APIRouter()
logger = logging.getLogger("notifications_router")

async def create_system_notification(user_id: str, title: str, message: str, redirect_url: str):
    """
    Asynchronously creates a new system notification and commits it to the database.
    Self-managed session, safe to invoke from background operations or other endpoints.
    """
    async with SessionLocal() as db:
        try:
            new_notif = Notification(
                user_id=str(user_id),
                title=title,
                message=message,
                redirect_url=redirect_url,
                is_read=False
            )
            db.add(new_notif)
            await db.commit()
            await db.refresh(new_notif)
            logger.info(f"System Notification created successfully: {title} for user {user_id}")
            return new_notif
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to create system notification: {str(e)}")
            return None

@router.get("/notifications/unread")
async def get_unread_notifications(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    try:
        # Check if the user is admin
        user_identity = "admin" if current_user.role == "admin" else str(current_user.id)
        
        statement = select(Notification).where(
            Notification.user_id == user_identity,
            Notification.is_read == False
        ).order_by(Notification.created_at.desc())
        
        result = await db.execute(statement)
        unread_list = result.scalars().all()
        return {
            "unread": unread_list,
            "count": len(unread_list)
        }
    except Exception as e:
        logger.error(f"Failed to query unread notifications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch unread notifications.")

@router.get("/notifications/all")
async def get_all_notifications(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    try:
        user_identity = "admin" if current_user.role == "admin" else str(current_user.id)
        
        statement = select(Notification).where(
            Notification.user_id == user_identity
        ).order_by(Notification.created_at.desc())
        
        result = await db.execute(statement)
        return result.scalars().all()
    except Exception as e:
        logger.error(f"Failed to query all notifications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch notification history.")

@router.patch("/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    try:
        # Handle parsed string representation of UUID
        try:
            notif_uuid = uuid.UUID(notification_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid notification UUID format.")

        statement = select(Notification).where(Notification.id == notif_uuid)
        result = await db.execute(statement)
        notification = result.scalar_one_or_none()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found.")
        
        # Verify access authorization
        user_identity = "admin" if current_user.role == "admin" else str(current_user.id)
        if notification.user_id != user_identity:
            raise HTTPException(status_code=403, detail="Not authorized to access this notification.")
            
        notification.is_read = True
        await db.commit()
        await db.refresh(notification)
        return {"status": "success", "notification_id": str(notification.id), "is_read": notification.is_read}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update notification state: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update notification state.")
