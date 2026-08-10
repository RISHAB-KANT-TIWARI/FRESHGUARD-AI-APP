"""
main.py

Entry point for the FastAPI application. This file sets up CORS, mounts
the authentication router, and ensures database tables are created on
startup for local development.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler

# Import database and models so tables are registered/created
import dotenv
from database import engine, Base
from rate_limit import limiter

dotenv.load_dotenv()  # load .env for SECRET_KEY and other config

# Import and include the auth and scan routers (after env is loaded)
from routers.auth import router as auth_router
from routers.alerts import router as alerts_router
from routers.copilot import router as copilot_router
from routers.dashboard import router as dashboard_router
from routers.rescue import router as rescue_router
from routers.scan import router as scan_router
from routers.farmer import router as farmer_router
from routers.buyer import router as buyer_router

app = FastAPI(title="FreshGuard AI Backend")

# Attach the shared limiter to the application and register the standard
# slowapi exception handler so rate-limited requests return a clean 429.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Very permissive CORS for local development. Restrict in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Create DB tables (only for local/dev). For production use migrations.
    Base.metadata.create_all(bind=engine)

    # Lightweight SQLite schema upgrade: add the new `reasoning` column if the
    # scans table already exists from an earlier run.
    inspector = inspect(engine)
    if "scans" in inspector.get_table_names():
        columns = {column["name"] for column in inspector.get_columns("scans")}
        if "reasoning" not in columns:
            with engine.begin() as connection:
                connection.exec_driver_sql("ALTER TABLE scans ADD COLUMN reasoning TEXT")


@app.get("/")
def root():
    return {"message": "FreshGuard AI backend is running"}


# Include the authentication routes
app.include_router(auth_router)
app.include_router(alerts_router)
app.include_router(copilot_router)
app.include_router(dashboard_router)
app.include_router(rescue_router)
app.include_router(scan_router)
app.include_router(farmer_router)
app.include_router(buyer_router)