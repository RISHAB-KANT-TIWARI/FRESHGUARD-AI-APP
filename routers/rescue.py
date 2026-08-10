"""
routers/rescue.py

Rescue marketplace matching endpoint for scans that were marked as Rescue.
The matching logic uses a hardcoded list of mock buyers to simulate a
marketplace without needing a real database of partners.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
import models
import schemas
from mock_buyers import MOCK_BUYERS

router = APIRouter(prefix="/rescue", tags=["rescue"])


def _product_category(product_name: str) -> str:
    """Infer a rough category from the product name.

    This is intentionally simple and keyword-based because we only need a
    lightweight demo matcher for the hackathon backend.
    """
    lowered = product_name.lower()
    fruit_keywords = ["apple", "mango", "banana", "orange", "grape", "fruit", "berry", "pear", "papaya"]
    vegetable_keywords = ["tomato", "spinach", "potato", "onion", "carrot", "cabbage", "broccoli", "pepper", "vegetable", "leafy"]

    if any(keyword in lowered for keyword in fruit_keywords):
        return "fruits"
    if any(keyword in lowered for keyword in vegetable_keywords):
        return "vegetables"
    return "mixed"


def _buyer_priority(product_category: str, buyer_category: str) -> int:
    """Lower numbers mean a better match."""
    if product_category == "fruits":
        if buyer_category == "fruits":
            return 0
        if buyer_category == "mixed":
            return 1
        return 2
    if product_category == "vegetables":
        if buyer_category == "vegetables":
            return 0
        if buyer_category == "mixed":
            return 1
        return 2
    # Unknown products fall back to mixed buyers first, then everything else.
    if buyer_category == "mixed":
        return 0
    return 1


@router.get("/matches", response_model=list[schemas.RescueMatch])
def rescue_matches(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Return buyer matches for the current user's Rescue scans only.

    We prefer buyers by product category, then return up to two matches per
    scan. This is a lightweight matching heuristic, not a real marketplace.
    """
    rescue_scans = db.query(models.Scan).filter(
        models.Scan.user_id == current_user.id,
        models.Scan.recommendation == "Rescue",
    ).order_by(models.Scan.created_at.desc()).all()

    results = []
    for scan in rescue_scans:
        product_category = _product_category(scan.product_name)

        # Sort mock buyers by category fit and keep only the best two.
        ranked_buyers = sorted(
            MOCK_BUYERS,
            key=lambda buyer: (
                _buyer_priority(product_category, buyer["category"]),
                buyer["type"],
                buyer["city"],
                buyer["name"],
            ),
        )

        matched_buyers = [
            {
                "name": buyer["name"],
                "type": buyer["type"],
                "city": buyer["city"],
                "contact": buyer["contact"],
            }
            for buyer in ranked_buyers[:2]
        ]

        results.append(
            {
                "id": scan.id,
                "product_name": scan.product_name,
                "freshness_score": scan.freshness_score,
                "shelf_life_days": scan.shelf_life_days,
                "matched_buyers": matched_buyers,
            }
        )

    return results