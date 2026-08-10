"""
rate_limit.py

Shared slowapi limiter instance used by the FastAPI app and protected routes.
We keep the configuration in one place so the app and routers can import the
same limiter object without circular imports.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address


# IP-based limiting helps protect the backend from spam, brute-force login
# attempts, and expensive Gemini abuse from a single caller.
limiter = Limiter(key_func=get_remote_address)