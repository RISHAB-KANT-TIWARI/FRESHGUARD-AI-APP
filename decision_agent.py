"""
decision_agent.py

Rule-based mock decision agent that turns freshness metrics into a store
action recommendation plus a short reasoning trail.
"""
from typing import Dict, Any, List, Optional


def generate_decision(product_name: str, freshness_score: int, shelf_life_days: int) -> Dict[str, Any]:
    """Generate a simple recommendation using hardcoded market demand and rules.

    Returns a dict with:
    - recommendation: Sell, Discount, or Rescue
    - discount_percent: integer or None
    - reasoning: list of short explanation strings
    """
    demand_map = {
        "tomato": "high",
        "spinach": "medium",
        "banana": "low",
    }

    product_key = product_name.lower().strip()
    demand_level = "medium"
    for name, level in demand_map.items():
        if name in product_key:
            demand_level = level
            break

    recommendation: str
    discount_percent: Optional[int] = None

    # Urgency always wins if shelf life is almost gone.
    if shelf_life_days <= 1 or freshness_score < 40:
        recommendation = "Rescue"
    elif freshness_score >= 70:
        recommendation = "Sell"
    else:
        recommendation = "Discount"
        discount_percent = int(round((70 - freshness_score) / 5) * 5)

    reasoning: List[str] = [
        f"Shelf-life: {shelf_life_days} days remaining",
        f"Market demand for {product_name}: {demand_level}",
        f"Freshness score {freshness_score}% -> recommending {recommendation}",
    ]

    return {
        "recommendation": recommendation,
        "discount_percent": discount_percent,
        "reasoning": reasoning,
    }