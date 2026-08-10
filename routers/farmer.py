"""
routers/farmer.py

Provides endpoints for farmers to post crop-for-sale listings. Both
endpoints are protected and require a valid JWT (use `get_current_user`
dependency), matching the pattern used in routers/scan.py.

Unlike a Scan, a FarmerListing is not private to the submitting user:
POST creates a new listing tied to the logged-in account, but GET returns
the full marketplace of listings from all farmers, so buyers can browse
what's available to buy.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/farmer", tags=["farmer"])


@router.post("/listings", response_model=schemas.FarmerListingResponse)
def create_farmer_listing(
    listing: schemas.FarmerListingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Submit a new crop-for-sale listing.

    Each submission creates a new row rather than updating a fixed profile,
    so the same farmer account can post multiple crops or repost a new
    batch over time. `user_id` is taken from the authenticated user's JWT,
    never trusted from the request body.
    """
    new_listing = models.FarmerListing(
        user_id=current_user.id,
        farmer_name=listing.farmer_name,
        phone_number=listing.phone_number,
        address=listing.address,
        crop_name=listing.crop_name,
        crop_quantity=listing.crop_quantity,
        crop_breed=listing.crop_breed,
    )
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)

    return new_listing


@router.get("/listings", response_model=list[schemas.FarmerListingResponse])
def list_farmer_listings(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Return all farmer listings, newest first.

    This is the marketplace view: any logged-in user (typically a buyer
    browsing the farmer page) sees every farmer's listing, not just their
    own. Capped at 100 to keep the response light; add pagination later if
    the marketplace grows.
    """
    return (
        db.query(models.FarmerListing)
        .order_by(models.FarmerListing.created_at.desc())
        .limit(100)
        .all()
    )