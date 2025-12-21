"""
RexOmni vision endpoints.

Merged endpoints:
- Detection
- OCR
- Keypoint
- Visual Prompting

Behavior and signatures preserved exactly.
"""

import io
import json
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import StreamingResponse

from app.dependencies import get_rexomni_service
from inference.rexomni.rexomni_service import RexOmniService

router = APIRouter(prefix="/vision/rexomni", tags=["rexomni"])

# --------------------------------------------------
# Detection
# --------------------------------------------------

@router.post("/detection")
async def detection(
    file: UploadFile = File(...),
    categories: Optional[List[str]] = Form(default=[]),
    service: RexOmniService = Depends(get_rexomni_service),
):
    """Detect objects in an image and stream back the annotated JPEG."""
    try:
        image_bytes = await file.read()
        raw_results = service.run_detection(image_bytes, categories=categories)
        results = service.postprocess_detection(raw_results)

        drawn_pil = service.draw_detections(
            image_bytes,
            results,
            return_pil=True,
        )

        img_buffer = io.BytesIO()
        drawn_pil.save(img_buffer, format="JPEG")
        img_buffer.seek(0)

        return StreamingResponse(
            img_buffer,
            media_type="image/jpeg",
            headers={"X-Rex-Detections": json.dumps(results)},
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# --------------------------------------------------
# OCR
# --------------------------------------------------

@router.post("/ocr")
async def ocr(
    file: UploadFile = File(...),
    ocr_output_format: str = Form("Box"),
    ocr_granularity: str = Form("Word Level"),
    service: RexOmniService = Depends(get_rexomni_service),
):
    """Run OCR on an uploaded image."""
    try:
        image_bytes = await file.read()
        results = service.run_ocr(
            image_bytes,
            ocr_output_format=ocr_output_format,
            ocr_granularity=ocr_granularity,
        )
        return {"task": "OCR", "results": results}

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# --------------------------------------------------
# Keypoint
# --------------------------------------------------

def _default_categories(keypoint_type: str) -> List[str]:
    if keypoint_type == "human_pose":
        return ["person"]
    if keypoint_type == "hand":
        return ["hand"]
    if keypoint_type == "animal":
        return ["animal"]
    return []


@router.post("/keypoint")
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

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# --------------------------------------------------
# Visual Prompting
# --------------------------------------------------

@router.post("/visual_prompting")
async def visual_prompting(
    file: UploadFile = File(...),
    visual_prompt_boxes: Optional[str] = Form("[]"),
    categories: Optional[List[str]] = Form(None),
    service: RexOmniService = Depends(get_rexomni_service),
):
    """Guide the model with user-provided bounding boxes."""
    try:
        image_bytes = await file.read()
        boxes = json.loads(visual_prompt_boxes)

        if not all(isinstance(box, list) and len(box) == 4 for box in boxes):
            raise HTTPException(
                status_code=400,
                detail="Each visual_prompt_box must be [x0, y0, x1, y1]",
            )

        results = service.run_visual_prompting(
            image_bytes=image_bytes,
            visual_prompt_boxes=boxes,
            categories=categories,
        )

        processed_results = service.postprocess_visual_prompting(results)
        drawn_image_path = service.draw_visual_prompting(
            image_bytes=image_bytes,
            results=processed_results,
            save_name="visual_prompting_result.jpg",
        )

        return {
            "task": "Visual Prompting",
            "results": processed_results,
            "drawn_image_path": drawn_image_path,
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="visual_prompt_boxes must be valid JSON")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
