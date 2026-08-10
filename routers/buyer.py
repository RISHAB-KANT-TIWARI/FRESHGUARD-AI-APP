"""
routers/buyer.py

Provides endpoints for retailers/business buyers to post crop-buying
requests. Mirrors routers/farmer.py exactly, just for the other side of
the marketplace: both endpoints are protected and require a valid JWT
(use `get_current_user` dependency).

POST creates a new request tied to the logged-in account; GET returns the
full marketplace of requests from all buyers, so farmers can browse who
wants to buy.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/buyer", tags=["buyer"])


@router.post("/requests", response_model=schemas.BuyerRequestResponse)
def create_buyer_request(
    buyer_request: schemas.BuyerRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Submit a new crop-buying request.

    Each submission creates a new row rather than updating a fixed profile,
    so the same buyer account can post multiple requests over time.
    `user_id` is taken from the authenticated user's JWT, never trusted
    from the request body.
    """
    new_request = models.BuyerRequest(
        user_id=current_user.id,
        buyer_name=buyer_request.buyer_name,
        company_name=buyer_request.company_name,
        phone_number=buyer_request.phone_number,
        address=buyer_request.address,
        crop_name=buyer_request.crop_name,
        crop_quantity_needed=buyer_request.crop_quantity_needed,
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return new_request


@router.get("/requests", response_model=list[schemas.BuyerRequestResponse])
def list_buyer_requests(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Return all buyer requests, newest first.

    This is the marketplace view: any logged-in user (typically a farmer
    browsing the buyer page) sees every buyer's request, not just their
    own. Capped at 100 to keep the response light; add pagination later if
    the marketplace grows.
    """
    return (
        db.query(models.BuyerRequest)
        .order_by(models.BuyerRequest.created_at.desc())
        .limit(100)
        .all()
    )