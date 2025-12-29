from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

from app.services.job_runner import submit_job
from app.services.job_manager import get_job
from app.services.result_serializer import normalize_result

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.post("")
async def create_job(
    file: UploadFile = File(...),
    task: str = Form(...),
    model: str = Form(...),
    text_input: str | None = Form(None),
):
    """
    Submit a new job for processing.
    """
    image_bytes = await file.read()

    job = submit_job(
        task=task,
        image_bytes=image_bytes,
        model=model,
        params={
            "text_input": text_input,
            "visualize": True,
        },
    )

    return {"job_id": job["id"]}


@router.get("/{job_id}")
def read_job(job_id: str):
    """
    Get job status and progress.
    """
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "id": job["id"],
        "status": job["status"],
        "progress": job["progress"],
        "error": job["error"],
        "has_result": job["result"] is not None,
    }


@router.get("/{job_id}/result")
def get_job_result(job_id: str):
    """
    Get job result in a normalized schema.
    """
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job not completed")

    return normalize_result(
        result=job["result"],
        task=job.get("task"),
        model=job.get("model"),
        image_bytes=job.get("params", {}).get("image_bytes")  # optional if stored
    )
