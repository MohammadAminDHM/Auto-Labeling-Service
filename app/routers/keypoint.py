"""Keypoint endpoint definitions."""
from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.dependencies import get_labeling_service

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
    model_name: str = Form("rex-omni"),
):
    """Detect keypoints such as human pose, hand, or animal landmarks."""
    try:
        service = get_labeling_service(model_name)
        if not service.supports("keypoint"):
            raise HTTPException(status_code=400, detail=f"Model '{model_name}' does not support keypoints")

        image_bytes = await file.read()
        chosen_categories = categories or _default_categories(keypoint_type)
        results = service.run_keypoint(
            image_bytes,
            keypoint_type=keypoint_type,
            categories=chosen_categories,
        )
        return {"task": "Keypoint", "results": results}
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # pragma: no cover - FastAPI surfaces errors
        raise HTTPException(status_code=500, detail=str(exc))
