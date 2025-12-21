"""Keypoint endpoint definitions."""
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.dependencies import get_rexomni_service
from inference.rexomni.rexomni_service import RexOmniService

router = APIRouter(prefix="/keypoint", tags=["keypoint"])


def _default_categories(keypoint_type: str) -> List[str]:
    if keypoint_type == "human_pose":
        return ["person"]
    if keypoint_type == "hand":
        return ["hand"]
    if keypoint_type == "animal":
        return ["animal"]
    return []


@router.post("")
async def keypoint(
    file: UploadFile = File(...),
    keypoint_type: str = Form("human_pose"),
    categories: Optional[List[str]] = Form(None),
    service: RexOmniService = Depends(get_rexomni_service),
):
    """Detect keypoints such as human pose, hand, or animal landmarks."""
    try:
        image_bytes = await file.read()
        chosen_categories = categories or _default_categories(keypoint_type)
        results = service.run_keypoint(
            image_bytes,
            keypoint_type=keypoint_type,
            categories=chosen_categories,
        )
        return {"task": "Keypoint", "results": results}
    except Exception as exc:  # pragma: no cover - FastAPI surfaces errors
        raise HTTPException(status_code=500, detail=str(exc))
