"""Health and diagnostics endpoints."""
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Simple health probe for uptime checks."""
    return {"status": "ok", "message": "Rex-Omni API running successfully 🚀"}
