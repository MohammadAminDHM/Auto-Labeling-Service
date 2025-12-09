"""OCR endpoint definitions."""
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.dependencies import get_labeling_service

router = APIRouter(prefix="/ocr", tags=["ocr"])


@router.post("")
async def ocr(
    file: UploadFile = File(...),
    ocr_output_format: str = Form("Box"),
    ocr_granularity: str = Form("Word Level"),
    model_name: str = Form("rex-omni"),
):
    """Run OCR on an uploaded image."""
    try:
        service = get_labeling_service(model_name)
        if not service.supports("ocr"):
            raise HTTPException(status_code=400, detail=f"Model '{model_name}' does not support OCR")

        image_bytes = await file.read()
        results = service.run_ocr(
            image_bytes,
            ocr_output_format=ocr_output_format,
            ocr_granularity=ocr_granularity,
        )
        return {"task": "OCR", "results": results}
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # pragma: no cover - FastAPI surfaces errors
        raise HTTPException(status_code=500, detail=str(exc))
