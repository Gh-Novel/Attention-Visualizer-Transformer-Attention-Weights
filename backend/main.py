"""
main.py — FastAPI application for the Attention Visualization Tool.

Routes
------
GET  /api/models      → list of available models + metadata
POST /api/attend      → run inference, return tokens + attention weights
GET  /                → serve React frontend (after build)
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from models import MODEL_REGISTRY
from attention import get_attention

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Attention Visualizer API",
    description="Extracts and serves transformer attention weights for visualization.",
    version="1.0.0",
)

# Allow any localhost port (Vite may pick 5173, 5174, 5175, …)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten this for production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ───────────────────────────────────────────────────────────────────
class AttendRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=512, example="The cat sat on the mat.")
    model_id: str = Field(..., example="bert-base-uncased")


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/models")
def list_models():
    """Return the list of available models with metadata."""
    return MODEL_REGISTRY


@app.post("/api/attend")
def attend(req: AttendRequest):
    """
    Run a forward pass through the requested model and return
    tokenized text plus all attention weight matrices.
    """
    logger.info("attend → model=%s  text=%r", req.model_id, req.text[:80])
    try:
        result = get_attention(req.text, req.model_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.exception("Inference error")
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}")
    return result


# ── Serve built React frontend ────────────────────────────────────────────────
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=str(FRONTEND_DIST / "assets")),
        name="assets",
    )

    @app.get("/", include_in_schema=False)
    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str = ""):
        index = FRONTEND_DIST / "index.html"
        if index.exists():
            return FileResponse(str(index))
        return {"detail": "Frontend not built. Run: cd frontend && npm run build"}
