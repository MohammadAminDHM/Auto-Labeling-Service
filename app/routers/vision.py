"""
Unified vision endpoint using model registry.

Supports:
- RexOmni tasks (detection, ocr, keypoint, visual prompting)
- Florence tasks (caption, grounding, segmentation, dense caption, ...)
"""

from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from inference.registry.model_registry import ModelRegistry
from inference.registry.task_types import TaskType
from inference.registry.model_types import ModelType

router = APIRouter(prefix="/vision", tags=["vision"])

registry = ModelRegistry()


@router.post("")
async def run_vision_task(
    file: UploadFile = File(...),

    # What to do
    task: TaskType = Form(...),

    # Optional model override (only valid for overlapping tasks)
    model: Optional[ModelType] = Form(None),

    # Common optional inputs (used mainly by Florence)
    text_input: Optional[str] = Form(None),
    categories: Optional[str] = Form(None),
    visual_prompt_boxes: Optional[str] = Form(None),

    # Output control
    visualize: bool = Form(True),
):
    """
    Generic vision endpoint.

    Examples:
    - task=DETECTION
    - task=CAPTION
    - task=REFERRING_EXPRESSION_SEGMENTATION
    """
    try:
        image_bytes = await file.read()

        return registry.run(
            task=task,
            image_bytes=image_bytes,
            model=model,
            text_input=text_input,
            categories=categories,
            visual_prompt_boxes=visual_prompt_boxes,
            visualize=visualize,
        )

    except ValueError as e:
        # Unsupported task/model combination
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
