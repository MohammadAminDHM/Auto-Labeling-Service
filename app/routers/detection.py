"""Detection endpoint definitions."""
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.dependencies import get_rexomni_service
from inference.rexomni.rexomni_service import RexOmniService

import io
import json
from typing import List, Optional

router = APIRouter(prefix="/detection", tags=["detection"])


@router.post("")
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

    except Exception as exc:  # pragma: no cover - FastAPI surfaces errors
        raise HTTPException(status_code=500, detail=str(exc))
