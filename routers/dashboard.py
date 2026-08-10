"""
routers/dashboard.py

Dashboard/analytics endpoint for the currently authenticated user.
All calculations are based only on the user's own scans.
"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
import models
import schemas

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=schemas.DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Return dashboard metrics for the logged-in user.

    The waste estimate is intentionally rough: we treat each Rescue or
    Discount scan as about 5kg of produce saved.
    """
    user_scans = db.query(models.Scan).filter(models.Scan.user_id == current_user.id)

    total_scans = user_scans.count()
    critical_count = user_scans.filter(models.Scan.recommendation == "Rescue").count()

    rescue_or_discount_count = user_scans.filter(
        models.Scan.recommendation.in_(["Rescue", "Discount"])
    ).count()
    waste_saved_kg = float(rescue_or_discount_count * 5)

    avg_score = db.query(func.avg(models.Scan.freshness_score)).filter(models.Scan.user_id == current_user.id).scalar()
    avg_freshness_score = round(float(avg_score), 1) if avg_score is not None else 0.0

    # Build the last 7 days trend, including days with zero scans.
    # Each Rescue/Discount scan is counted as roughly 5kg saved on that day.
    today = datetime.utcnow().date()
    day_lookup = {}
    for offset in range(6, -1, -1):
        day_date = today - timedelta(days=offset)
        day_lookup[day_date] = 0.0

    recent_scans = db.query(models.Scan).filter(
        models.Scan.user_id == current_user.id,
        models.Scan.created_at >= datetime.combine(today - timedelta(days=6), datetime.min.time()),
    ).all()

    for scan in recent_scans:
        scan_day = scan.created_at.date()
        if scan_day in day_lookup and scan.recommendation in {"Rescue", "Discount"}:
            day_lookup[scan_day] += 5.0

    weekday_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    trend = []
    for day_date in sorted(day_lookup.keys()):
        trend.append(
            {
                "day": weekday_labels[day_date.weekday()],
                "kg": float(day_lookup[day_date]),
            }
        )

    return {
        "total_scans": total_scans,
        "critical_count": critical_count,
        "waste_saved_kg": waste_saved_kg,
        "avg_freshness_score": avg_freshness_score,
        "trend": trend,
    }