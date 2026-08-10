"""
models.py

SQLAlchemy models for the application.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    """Represents an application user.

    Fields:
    - id: primary key
    - name: display name
    - email: unique email address
    - hashed_password: bcrypt-hashed password
    - created_at: timestamp when the user was created
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Scan(Base):
    """Represents a freshness analysis scan performed by a user.

    Fields:
    - id: primary key
    - user_id: foreign key to `users.id`
    - product_name: name of the produce item
    - freshness_score: integer 0-100 (higher is fresher)
    - shelf_life_days: estimated days before spoilage
    - defects: comma-separated short descriptions
    - recommendation: optional text provided by a decision agent later
    - reasoning: optional JSON-encoded list of short explanation strings
    - created_at: timestamp when the scan was performed
    """
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_name = Column(String, nullable=False)
    freshness_score = Column(Integer, nullable=False)
    shelf_life_days = Column(Integer, nullable=False)
    defects = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=True)
    reasoning = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # relationship back to the user for convenience
    user = relationship("User", backref="scans")


class FarmerListing(Base):
    """Represents a crop-for-sale listing submitted by a farmer.

    Each submission is its own row (a marketplace-style listing), not a
    fixed one-per-user profile, so the same farmer can post multiple crops
    or multiple batches over time.

    Fields:
    - id: primary key
    - user_id: foreign key to `users.id` (the logged-in account that submitted it)
    - farmer_name: display name of the farmer
    - phone_number: contact number
    - address: farmer's location/address
    - crop_name: name of the crop being sold
    - crop_quantity: quantity available (stored as text to allow units, e.g. "500 kg")
    - crop_breed: variety/breed of the crop
    - created_at: timestamp when the listing was submitted
    """
    __tablename__ = "farmer_listings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    farmer_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    address = Column(String, nullable=False)
    crop_name = Column(String, nullable=False, index=True)
    crop_quantity = Column(String, nullable=False)
    crop_breed = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # relationship back to the user for convenience
    user = relationship("User", backref="farmer_listings")


class BuyerRequest(Base):
    """Represents a crop-buying request submitted by a retailer/business buyer.

    Each submission is its own row (a marketplace-style listing), matching
    FarmerListing, so the same buyer account can post multiple requests.

    Fields:
    - id: primary key
    - user_id: foreign key to `users.id` (the logged-in account that submitted it)
    - buyer_name: display name of the buyer/business contact
    - company_name: name of the buyer's company/business
    - phone_number: contact number
    - address: buyer's location/address
    - crop_name: name of the crop they want to buy
    - crop_quantity_needed: quantity wanted (stored as text to allow units, e.g. "1 ton")
    - created_at: timestamp when the request was submitted
    """
    __tablename__ = "buyer_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    buyer_name = Column(String, nullable=False)
    company_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    address = Column(String, nullable=False)
    crop_name = Column(String, nullable=False, index=True)
    crop_quantity_needed = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # relationship back to the user for convenience
    user = relationship("User", backref="buyer_requests")