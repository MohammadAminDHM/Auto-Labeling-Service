"""OCR endpoint definitions."""
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.dependencies import get_rexomni_service
from inference.rexomni_service import RexOmniService

router = APIRouter(prefix="/ocr", tags=["ocr"])


@router.post("")
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
    except Exception as exc:  # pragma: no cover - FastAPI surfaces errors
        raise HTTPException(status_code=500, detail=str(exc))
