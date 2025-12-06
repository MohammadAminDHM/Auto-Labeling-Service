"""FastAPI application entrypoint for Rex-Omni multi-task inference."""
from fastapi import FastAPI

from app.routers import detection, health, keypoint, ocr, visual_prompting

app = FastAPI(
    title="Rex-Omni API",
    description=(
        "Multi-task inference API for Rex-Omni (Detection, OCR, Keypoint, Visual Prompting, etc.)"
    ),
    version="1.0",
    openapi_tags=[
        {"name": "detection", "description": "Object detection with visualization"},
        {"name": "ocr", "description": "Optical character recognition"},
        {"name": "keypoint", "description": "Pose and landmark estimation"},
        {"name": "visual_prompting", "description": "Guided detection via bounding boxes"},
        {"name": "health", "description": "Operational readiness checks"},
    ],
)

# Router registration
app.include_router(detection.router)
app.include_router(ocr.router)
app.include_router(keypoint.router)
app.include_router(visual_prompting.router)
app.include_router(health.router)


if __name__ == "__main__":  # pragma: no cover - manual entrypoint
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=6996, reload=True)
