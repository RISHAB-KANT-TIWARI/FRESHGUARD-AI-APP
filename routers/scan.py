"""
routers/scan.py

Provides the image-based freshness analysis endpoint. The endpoint is
protected and requires a valid JWT (use `get_current_user` dependency).

The endpoint sends the image bytes to Google's Gemini via the
`google.generativeai` library and expects STRICT JSON in the response
containing product_name, freshness_score, shelf_life_days, and defects.
"""
import os
import re
import json
import base64
from typing import List

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request, status
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
from decision_agent import generate_decision
from rate_limit import limiter
import models
import schemas

# Try importing the google generative client. If it's not installed, we'll
# raise a clear error when the endpoint is hit.
try:
    import google.generativeai as genai
except Exception:
    genai = None

# Load GEMINI_API_KEY from environment (.env should be loaded by main)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

router = APIRouter(prefix="/scan", tags=["scan"])


def _extract_json(text: str):
    """Attempt to extract JSON from text possibly wrapped in markdown code
    blocks. Returns a Python object or raises ValueError.
    """
    # Strip triple-backtick or triple-tilde fenced blocks
    code_block_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.S)
    if code_block_match:
        text = code_block_match.group(1)

    # Also try to find the first JSON object in the text
    first_json = re.search(r"(\{.*\})", text, re.S)
    if not first_json:
        raise ValueError("No JSON object found in Gemini response")

    json_text = first_json.group(1)
    return json.loads(json_text)


@router.post("/analyze", response_model=schemas.ScanResponse)
@limiter.limit("20/hour")
def analyze_scan(request: Request, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Analyze an uploaded image and save a Scan record.

    - Validates file type and size (max 5MB).
    - Sends image bytes to Gemini and expects strict JSON response.
    - Saves a `Scan` linked to the authenticated user (does not store image).

    Limit: 20/hour because each call triggers a real Gemini API request and is
    the most expensive operation in the backend.
    """
    # Basic validation: ensure the upload looks like an image and is small enough
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is not an image")

    contents = file.file.read()
    file.file.close()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image size exceeds 5MB")

    if genai is None or GEMINI_API_KEY is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Gemini client or API key not configured on server")

    # Configure the Gemini client
    genai.configure(api_key=GEMINI_API_KEY)

    # Prompt instructing Gemini to return STRICT JSON with the required fields.
    # This gives an explicit visual rubric so the model has concrete criteria
    # to anchor the score on, instead of guessing conservatively when unsure.
    prompt = (
        "You are a produce quality inspector. Examine the image closely and grade "
        "the freshness of the item shown.\n\n"
        "Scoring rubric (use the FULL 0-100 range, do not default to a middle/low score):\n"
        "- 90-100: Vivid natural color, smooth/taut skin, no spots, no bruising, no wrinkling, "
        "firm-looking, no mold, no discoloration.\n"
        "- 70-89: Minor cosmetic imperfections only (small blemish, slight dulling of color) "
        "but overall firm and clearly edible.\n"
        "- 40-69: Visible soft spots, noticeable wrinkling/shriveling, dulled or uneven color, "
        "early bruising or discoloration.\n"
        "- 0-39: Mold, significant browning/blackening, collapsed/mushy texture, rot, "
        "leaking fluid, or heavy insect/pest damage.\n\n"
        "Be decisive: if the produce looks plump, brightly colored, and blemish-free, score it "
        "90+. Do not lower the score just because you are not 100% certain — base the score only "
        "on visible evidence in the image.\n\n"
        "Return STRICT JSON with exactly these fields: product_name (string), "
        "freshness_score (integer 0-100), shelf_life_days (integer), defects (array of short "
        "strings — return an empty array if none are visible). Respond ONLY with the JSON object, "
        "no markdown fences, no extra text."
    )

    try:
        # Send the image inline as base64 data instead of using the Files API.
        # This keeps the image in memory only and avoids separate upload permissions.
        inline_image = {
            "inline_data": {
                "mime_type": file.content_type,
                "data": base64.b64encode(contents).decode("ascii"),
            }
        }

        model = genai.GenerativeModel("models/gemini-2.5-flash")
        # low temperature -> consistent, less "random" scoring between calls
        # response_mime_type -> Gemini returns valid JSON directly, no fence-stripping needed
        generation_config = {
            "temperature": 0.2,
            "response_mime_type": "application/json",
        }
        # Pass the prompt text and inline image together as the contents array.
        response = model.generate_content(
            [prompt, inline_image],
            generation_config=generation_config,
        )

        # `GenerateContentResponse` commonly exposes a `.text` attribute
        # with the model's textual output. Fall back to other shapes if
        # `.text` is not available.
        text_output = getattr(response, "text", None)
        if text_output is None:
            candidates = getattr(response, "candidates", None)
            if candidates:
                cand = candidates[0]
                text_output = getattr(cand, "content", None) or getattr(cand, "text", None) or str(cand)
        if text_output is None:
            text_output = str(response)

        # TEMP DEBUG: log the raw Gemini output so you can see exactly what it
        # said for a given photo instead of only the parsed score. Remove or
        # switch to proper logging once you've confirmed scores look right.
        print(f"[scan.analyze] raw Gemini output: {text_output!r}")

        # Parse JSON from Gemini's text response, tolerate markdown fences
        parsed = _extract_json(text_output)

        # Validate fields
        product_name = parsed.get("product_name")
        freshness_score = int(parsed.get("freshness_score"))
        shelf_life_days = int(parsed.get("shelf_life_days"))
        defects_list = parsed.get("defects") or []
        if not isinstance(defects_list, list):
            raise ValueError("`defects` field must be an array")

    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Invalid JSON from Gemini: {ve}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error calling Gemini: {e}")

    # Convert defects list into a comma-separated string for storage.
    defects_text = ", ".join(defects_list)

    # Run the local decision agent immediately after the freshness analysis.
    decision = generate_decision(product_name, freshness_score, shelf_life_days)
    reasoning_json = json.dumps(decision["reasoning"])

    # Save scan to DB (do not store the image).
    scan = models.Scan(
        user_id=current_user.id,
        product_name=product_name,
        freshness_score=freshness_score,
        shelf_life_days=shelf_life_days,
        defects=defects_text,
        recommendation=decision["recommendation"],
        reasoning=reasoning_json,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    return scan


@router.get("/history", response_model=list[schemas.ScanResponse])
def scan_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Return the current user's most recent scans.

    This endpoint is intentionally simple for the frontend: it only returns
    the latest 20 scans, newest first, and reuses the existing ScanResponse
    schema for each item.
    """
    return (
        db.query(models.Scan)
        .filter(models.Scan.user_id == current_user.id)
        .order_by(models.Scan.created_at.desc())
        .limit(20)
        .all()
    )