"""
routers/alerts.py

Simple critical alerts endpoint for the current user.
It reuses the same Rescue / low-freshness filtering logic used elsewhere,
but keeps the response compact for dashboard-style UI usage.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
import models
import schemas

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/critical", response_model=schemas.AlertsSummary)
def critical_alerts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Return the user's critical scans in most-recent-first order.

    A scan is considered critical when it is already marked Rescue or when
    its freshness score is below 30. We limit the item list to 10 entries so
    the response stays light for the frontend.
    """
    base_query = db.query(models.Scan).filter(models.Scan.user_id == current_user.id)

    critical_query = base_query.filter(
        (models.Scan.recommendation == "Rescue") | (models.Scan.freshness_score < 30)
    ).order_by(models.Scan.created_at.desc())

    critical_count = critical_query.count()
    items = critical_query.limit(10).all()

    return {
        "critical_count": critical_count,
        "items": items,
    }