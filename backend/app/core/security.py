import uuid
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
from app.core.config import settings

# Strict Enterprise Security Claims Configuration
JWT_ALGORITHM = "HS256"
JWT_ISSUER = "insightagent.ai"
JWT_AUDIENCE = "insightagent.client"
CLOCK_SKEW_LEEWAY = 30  # Allow 30 seconds network clock drift tolerance

if not settings.SECRET_KEY or len(settings.SECRET_KEY) < 32:
    raise ValueError("CRITICAL SECURITY VIOLATION: SECRET_KEY is empty or cryptographically weak!")


# ENTERPRISE CUSTOM EXCEPTION MATRIX
class AuthenticationError(Exception):
    """Base exception for all security sub-system errors."""
    pass

class TokenExpiredError(AuthenticationError):
    """Raised when the cryptographic token payload timestamp is expired."""
    pass

class TokenInvalidError(AuthenticationError):
    """Raised when signature verification fails or claims are corrupted."""
    pass

class TokenBlacklistedError(AuthenticationError):
    """Raised when a revoked or blacklisted jti attempts server access."""
    pass


# 🔐 PART 1: NATIVE BCRYPT PASWORD CRYPTOGRAPHY
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password input against its stored database hash.
    Natively handles string-to-byte encoding without 72-byte truncation bugs.
    """
    try:
        password_bytes = plain_password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """
    Generate a secure cryptographic one-way salted bcrypt hash of a password.
    Enforces modern industry standard rounds natively.
    """
    password_bytes = password.encode("utf-8")
    # Generate native salt and hash parameters
    salt = bcrypt.gensalt(rounds=12)
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    return hashed_bytes.decode("utf-8")


# PART 2: DUAL-TOKEN LIFECYCLE FACTORY
def create_access_token(
    subject: Union[str, Any], 
    role: str = "user", 
    expires_delta: Optional[timedelta] = None
) -> str:
    """Generate a highly secure, stateless JWT Access Token with unique jti tracking."""
    now_utc = datetime.now(timezone.utc)
    expire = now_utc + (expires_delta if expires_delta else timedelta(minutes=15))
    
    payload: Dict[str, Any] = {
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": int(now_utc.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": str(uuid.uuid4()),
        "sub": str(subject),
        "role": str(role),
        "type": "access"
    }
    
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_refresh_token(
    subject: Union[str, Any], 
    expires_delta: Optional[timedelta] = None
) -> str:
    """Generate a long-lived Minimal Payload Refresh Token Factory."""
    now_utc = datetime.now(timezone.utc)
    expire = now_utc + (expires_delta if expires_delta else timedelta(days=7))
    
    payload: Dict[str, Any] = {
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": int(now_utc.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": str(uuid.uuid4()),
        "sub": str(subject),
        "type": "refresh"
    }
    
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=JWT_ALGORITHM)


# PART 3: PURE CRYPTOGRAPHIC TOKEN DECODER
def decode_and_verify_token(token: str, expected_type: str = "access") -> Dict[str, Any]:
    """Abstract claims decoder with defensive custom exception routing."""
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[JWT_ALGORITHM],
            audience=JWT_AUDIENCE,
            issuer=JWT_ISSUER,
            leeway=CLOCK_SKEW_LEEWAY
        )
        
        if payload.get("type") != expected_type:
            raise TokenInvalidError(f"Token structural variance. Expected variant: '{expected_type}'")
            
        return payload

    except ExpiredSignatureError:
        raise TokenExpiredError("Cryptographic lifecycle signature has expired.")
    except InvalidTokenError as token_error:
        raise TokenInvalidError(f"Token validation crashed: {str(token_error)}")