"""Health and diagnostics endpoints."""
from fastapi import APIRouter

from app.dependencies import get_model_registry

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Simple health probe for uptime checks."""
    return {"status": "ok", "message": "Rex-Omni API running successfully 🚀"}


@router.get("/models")
async def available_models():
    """Return currently registered models and their capabilities."""

    registry = get_model_registry()
    return {"models": registry.list_models()}
