"""
routers/copilot.py

Protected AI chat endpoint for produce business questions. The assistant
uses the current user's recent scan history as context, then answers the
question with Gemini.
"""
import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from rate_limit import limiter
import models
import schemas

# Match the same Gemini client pattern used by the scan endpoint so the
# copilot feature behaves consistently with the rest of the backend.
try:
    import google.generativeai as genai
except Exception:
    genai = None

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

router = APIRouter(prefix="/copilot", tags=["copilot"])


def _build_inventory_context(scans: list[models.Scan]) -> str:
    """Turn recent scans into a compact context block for Gemini.

    The prompt uses only the current user's data so answers about stock,
    selling timing, or rescue decisions stay grounded in actual inventory.
    """
    if not scans:
        return "No scan data available yet."

    items = []
    for scan in scans:
        recommendation = scan.recommendation or "unknown"
        items.append(
            f"{scan.product_name} ({scan.freshness_score}% fresh, {scan.shelf_life_days} days left, recommendation: {recommendation})"
        )
    return "Recent inventory: " + ", ".join(items)


def _gemini_error_message(error: Exception) -> str:
    """Convert Gemini failures into a friendly support message.

    The scan endpoint surfaces quota/network failures similarly, so we do the
    same here and return a 503 instead of an internal crash.
    """
    message = str(error)
    if "quota" in message.lower() or "429" in message:
        return "The AI assistant is temporarily busy or over quota. Please try again in a moment."
    return "The AI assistant is temporarily unavailable right now. Please try again shortly."


@router.post("/ask", response_model=schemas.CopilotAnswer)
def ask_copilot(
    question_in: schemas.CopilotQuestion,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Answer a business question using the user's recent inventory.

    We fetch the 10 most recent scans for the signed-in user, summarize them
    into a compact context string, and ask Gemini to answer concisely.
    """
    recent_scans = (
        db.query(models.Scan)
        .filter(models.Scan.user_id == current_user.id)
        .order_by(models.Scan.created_at.desc())
        .limit(10)
        .all()
    )

    context = _build_inventory_context(recent_scans)

    if genai is None or GEMINI_API_KEY is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI assistant is not configured on the server yet.",
        )

    genai.configure(api_key=GEMINI_API_KEY)

    prompt = (
        "You are FreshGuard AI Copilot, a concise assistant for a produce business. "
        "Use ONLY the inventory context below to answer specific questions about "
        "the listed items (for example, when to sell a product, what to rescue, or what is most urgent). "
        "For broader food-safety or business questions, you may use general knowledge, but keep the answer practical. "
        "Keep the answer to 2-4 short sentences. Do not mention that you are an AI model.\n\n"
        f"{context}\n\n"
        f"User question: {question_in.question}"
    )

    try:
        model = genai.GenerativeModel("models/gemini-2.5-flash")
        response = model.generate_content(prompt)

        answer_text = getattr(response, "text", None)
        if answer_text is None:
            candidates = getattr(response, "candidates", None)
            if candidates:
                cand = candidates[0]
                answer_text = getattr(cand, "content", None) or getattr(cand, "text", None) or str(cand)
        if answer_text is None:
            answer_text = str(response)

        return {"answer": answer_text.strip()}

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_gemini_error_message(error),
        )