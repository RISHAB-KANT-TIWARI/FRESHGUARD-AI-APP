"""
schemas.py

Pydantic schemas for request and response validation.
"""
from pydantic import BaseModel, EmailStr
from pydantic import ConfigDict, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


class ScanResponse(BaseModel):
    id: int
    product_name: str
    freshness_score: int
    shelf_life_days: int
    defects: str
    recommendation: Optional[str] = None
    reasoning: List[str] = Field(default_factory=list)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("reasoning", mode="before")
    @classmethod
    def decode_reasoning(cls, value: Any) -> List[str]:
        """Decode the JSON text stored in the database into a list.

        If the field is missing or empty, return an empty list so clients
        always receive a list of strings.
        """
        import json

        if value in (None, ""):
            return []
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            return json.loads(value)
        return []


class TrendPoint(BaseModel):
    """One point in the dashboard trend line.

    The `kg` value is an estimate of waste saved for that day, using a rough
    5kg-per-Rescue/Discount-scan assumption.
    """
    day: str
    kg: float


class DashboardSummary(BaseModel):
    """Aggregated analytics for the current logged-in user only."""
    total_scans: int
    critical_count: int
    waste_saved_kg: float
    avg_freshness_score: float
    trend: List[TrendPoint]


class MatchedBuyer(BaseModel):
    """A marketplace buyer matched to a rescue scan."""
    name: str
    type: str
    city: str
    contact: str


class RescueMatch(BaseModel):
    """One rescue scan with a small list of matching buyers."""
    id: int
    product_name: str
    freshness_score: int
    shelf_life_days: int
    matched_buyers: List[MatchedBuyer]


class AlertItem(BaseModel):
    """A lightweight alert row for the critical items list."""
    id: int
    product_name: str
    freshness_score: int
    shelf_life_days: int
    recommendation: Optional[str] = None
    created_at: datetime


class AlertsSummary(BaseModel):
    """Summary of the user's most urgent scans."""
    critical_count: int
    items: List[AlertItem]


class CopilotQuestion(BaseModel):
    """User question for the AI copilot chat endpoint."""
    question: str


class CopilotAnswer(BaseModel):
    """Concise assistant response returned by the copilot endpoint."""
    answer: str


class FarmerListingCreate(BaseModel):
    """What a farmer submits when posting a crop-for-sale listing.

    `user_id`, `id`, and `created_at` are not included here — those are set
    by the server (from the logged-in user's JWT, the DB, and the current
    time respectively), never supplied by the client.
    """
    farmer_name: str
    phone_number: str
    address: str
    crop_name: str
    crop_quantity: str
    crop_breed: Optional[str] = None


class FarmerListingResponse(BaseModel):
    """A single farmer listing as returned to the frontend."""
    id: int
    user_id: int
    farmer_name: str
    phone_number: str
    address: str
    crop_name: str
    crop_quantity: str
    crop_breed: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BuyerRequestCreate(BaseModel):
    """What a retailer/business buyer submits when posting a crop request.

    `user_id`, `id`, and `created_at` are not included here for the same
    reason as `FarmerListingCreate` — they're server-assigned.
    """
    buyer_name: str
    company_name: str
    phone_number: str
    address: str
    crop_name: str
    crop_quantity_needed: str


class BuyerRequestResponse(BaseModel):
    """A single buyer request as returned to the frontend."""
    id: int
    user_id: int
    buyer_name: str
    company_name: str
    phone_number: str
    address: str
    crop_name: str
    crop_quantity_needed: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)