"""
database.py

Sets up the SQLite database connection and SQLAlchemy session dependency
for FastAPI routes.

This file exposes:
- `engine` : SQLAlchemy Engine
- `SessionLocal` : sessionmaker for creating DB sessions
- `Base` : declarative base for models
- `get_db` : FastAPI dependency that yields a DB session
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Using a file-based SQLite DB in the project directory. For production,
# use a more robust DB and connection string from environment/config.
SQLALCHEMY_DATABASE_URL = "sqlite:///./freshguard.db"

# sqlite needs this flag
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Yield a SQLAlchemy DB session, closing it after the request.

    Use as a dependency in FastAPI routes: `db: Session = Depends(get_db)`
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
