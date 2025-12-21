"""FastAPI application entrypoint for Rex-Omni & Florence multi-task inference."""

from fastapi import FastAPI

from app.routers import (
    detection,
    ocr,
    keypoint,
    visual_prompting,
    vision,
    health,
)

app = FastAPI(
    title="Rex-Omni Vision API",
    description=(
        "Unified multi-model vision inference API.\n\n"
        "Supports:\n"
        "- RexOmni (Detection, OCR, Keypoint, Visual Prompting)\n"
        "- Florence-2 (Captioning, Grounding, Segmentation, Dense Region Tasks)\n\n"
        "Use task-specific endpoints for backward compatibility, "
        "or `/vision` for registry-based unified inference."
    ),
    version="1.1",
    openapi_tags=[
        {"name": "vision", "description": "Unified registry-based vision inference (RexOmni + Florence)"},
        {"name": "detection", "description": "RexOmni object detection with visualization"},
        {"name": "ocr", "description": "RexOmni OCR"},
        {"name": "keypoint", "description": "RexOmni pose and landmark estimation"},
        {"name": "visual_prompting", "description": "RexOmni guided detection via bounding boxes"},
        {"name": "health", "description": "Operational readiness checks"},
    ],
)

# --------------------------------------------------
# Router registration
# --------------------------------------------------

# Unified registry-based endpoint (NEW)
app.include_router(vision.router)

# Legacy / task-specific RexOmni endpoints (UNCHANGED)
app.include_router(detection.router)
app.include_router(ocr.router)
app.include_router(keypoint.router)
app.include_router(visual_prompting.router)

# Health
app.include_router(health.router)


if __name__ == "__main__":  # pragma: no cover - manual entrypoint
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=6996,
        reload=True,
    )
