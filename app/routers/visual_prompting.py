"""Visual prompting endpoint definitions."""
import json
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.dependencies import get_rexomni_service
from inference.rexomni.rexomni_service import RexOmniService

router = APIRouter(prefix="/visual_prompting", tags=["visual_prompting"])


@router.post("")
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
    except Exception as exc:  # pragma: no cover - FastAPI surfaces errors
        raise HTTPException(status_code=500, detail=str(exc))
