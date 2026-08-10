"""
routers/auth.py

Authentication routes: signup and login.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import hash_password, verify_password, create_access_token, get_current_user
from rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=schemas.Token)
@limiter.limit("5/minute")
def signup(request: Request, user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """Create a new user after verifying the email isn't already used.

    Limit: 5/minute to prevent spam account creation and keep the demo DB
    from being flooded with junk accounts.

    Returns a JWT access token so the frontend can auto-login immediately
    after signup.
    """
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed = hash_password(user_in.password)
    user = models.User(name=user_in.name, email=user_in.email, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate the same token payload shape used by the login endpoint so the
    # frontend can store and reuse it without a separate login request.
    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=schemas.Token)
@limiter.limit("10/minute")
def login(request: Request, credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """Verify user credentials and return a JWT access token on success.

    Limit: 10/minute to slow brute-force password guessing without blocking
    normal demo usage.
    """
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}



@router.get("/me", response_model=schemas.UserResponse)
def me(current_user: models.User = Depends(get_current_user)):
    """Protected route that returns the currently authenticated user.

    Use the `Authorization: Bearer <token>` header to authenticate.
    """
    return current_user
