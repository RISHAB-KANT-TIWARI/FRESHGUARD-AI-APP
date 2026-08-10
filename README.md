# FreshGuard AI - Backend (Auth)

This small FastAPI app provides a simple JWT-based authentication system
for hackathon/demo use. It uses SQLite and SQLAlchemy for persistence.

Quick start:

1. Copy `.env.example` to `.env` and set `SECRET_KEY`.
2. Install dependencies: `pip install -r requirements.txt`
3. Run the app:

```bash
uvicorn main:app --reload
```

Notes:
- The app creates `freshguard.db` in the project directory.
- For production, use a proper DB and migrations instead of `create_all`.
