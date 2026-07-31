import logging
from typing import AsyncGenerator, Dict, Any, Set
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import SessionLocal
from app.core.config import settings
from app.core.security import decode_and_verify_token, TokenExpiredError, TokenInvalidError
from app.repositories.user_repository import UserRepository
from app.models.user import User

# Initialize enterprise production logging framework for telemetry auditing
logger = logging.getLogger(__name__)

# Decoupled OAuth2 configuration pattern driven by central infrastructure settings
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=settings.AUTH_LOGIN_URL)

# Shared Standard Authentication Header Configuration
UNAUTHORIZED_HEADERS = {"WWW-Authenticate": "Bearer"}




# DATABASE SESSION INJECTION GATE
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yields a thread-safe, isolated async database session instance per request.
    """
    async with SessionLocal() as session:
        yield session


#  CORE IDENTITY PROVIDER MIDDLEWARE GATEWAY

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Identity Verification Guard: Patched for ultimate raw debugging
    """
    logger.debug(f"[DEBUG INCOMING] Raw Token Received from Frontend: '{token}' (Type: {type(token).__name__})")



    try:
        payload: Dict[str, Any] = decode_and_verify_token(token)
        user_id: str = payload.get("sub")
        
        jti: str = payload.get("jti")
        
        if not user_id:
            logger.warning("Security Alert: Decoded token schema verified successfully but 'sub' identity claim is missing.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials: Subject identifier missing.",
                headers=UNAUTHORIZED_HEADERS,
            )


        # Repository Instance Pattern Data Allocation
        user = await UserRepository.get_by_id(db, user_id=user_id)
        if not user:
            logger.warning(f"Authentication Failure: Valid signed token passed for non-existent system user ID: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account no longer exists in the system.",
                headers=UNAUTHORIZED_HEADERS,
            )
            
        if not user.is_active:
            logger.warning(f"Authorization Restriction: Deactivated account access attempt intercepted for User ID: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: User account has been administratively deactivated."
            )
            
        return user

    except TokenExpiredError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="TOKEN_EXPIRED",
            headers=UNAUTHORIZED_HEADERS,
        )
    except TokenInvalidError:
        logger.warning("Security Exception: Unauthorized runtime access attempt intercepted - Invalid token footprint passed.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or corrupted authentication token.",
            headers=UNAUTHORIZED_HEADERS,
        )


#  ROLE-BASED ACCESS CONTROL (RBAC) ENGINE
class RoleChecker:
    """
    Dynamic Permissive Clearance Interceptor Gating Endpoint Permissions.
    Optimized via high-speed O(1) set complexity operations.
    """
    def __init__(self, allowed_roles: list[str]) -> None:
        self.allowed_roles: Set[str] = set(allowed_roles)

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            logger.warning(f"Permission Violation: Identity User ID {current_user.id} with Role '{current_user.role}' attempted to access restricted endpoint scopes.")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You do not have the required administrative clearance."
            )
        return current_user