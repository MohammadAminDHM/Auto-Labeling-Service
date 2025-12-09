"""Detection endpoint definitions."""
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.dependencies import get_labeling_service

import io
import json
from typing import List, Optional

router = APIRouter(prefix="/detection", tags=["detection"])


@router.post("")
async def detection(
    file: UploadFile = File(...),
    categories: Optional[List[str]] = Form(default=[]),
    model_name: str = Form("rex-omni"),
):
    """Detect objects in an image and stream back the annotated JPEG."""
    try:
        service = get_labeling_service(model_name)
        if not service.supports("detection"):
            raise HTTPException(status_code=400, detail=f"Model '{model_name}' does not support detection")

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
            headers={
                "X-Rex-Detections": json.dumps(results),
                "X-Model-Name": service.name,
            },
        )
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # pragma: no cover - FastAPI surfaces errors
        raise HTTPException(status_code=500, detail=str(exc))
