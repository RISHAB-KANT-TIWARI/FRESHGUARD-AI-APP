"""
auth.py

Helper functions for password hashing, verification, and JWT token
creation/validation. Also provides a `get_current_user` dependency to be
used in protected routes.
"""
import os
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models import User

from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()

# SECRET_KEY must be set in the environment. Don't hardcode in source.
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is not set. Add a .env file or export it.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Note: we use the `bcrypt` library directly to avoid environment issues
# with passlib's bcrypt backend setup in some environments.

# HTTP bearer scheme so Swagger UI shows a simple bearer-token input.
bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    # bcrypt has a 72-byte input limit. Truncate long passwords to avoid
    # ValueError from the underlying library. For production, prefer a
    # strategy that preserves entropy (e.g., argon2 or pre-hash with a
    # secure KDF) and inform users about length limits.
    pw_bytes = password.encode("utf-8")
    if len(pw_bytes) > 72:
        pw_bytes = pw_bytes[:72]
    hashed = bcrypt.hashpw(pw_bytes, bcrypt.gensalt())
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against the stored bcrypt hash."""
    # Apply the same truncation logic used when hashing so verification
    # remains consistent for long passwords.
    pw_bytes = plain_password.encode("utf-8")
    if len(pw_bytes) > 72:
        pw_bytes = pw_bytes[:72]
    return bcrypt.checkpw(pw_bytes, hashed_password.encode('utf-8'))


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT token with a `sub` claim (subject) and expiration.

    `subject` is typically the user's unique identifier (e.g. email or id).
    """
    to_encode = {"sub": subject}
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), db: Session = Depends(get_db)) -> User:
    """FastAPI dependency to get the currently authenticated user.

    This reads the JWT from the `Authorization: Bearer <token>` header,
    decodes it, and fetches the corresponding user from the database.
    Raises HTTP 401 if the token is invalid or the user doesn't exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user
