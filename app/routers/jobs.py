# app/routes/job.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.job_runner import submit_job
from app.services.job_manager import get_job
from app.services.result_serializer import normalize_result

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

@router.post("")
async def create_job_endpoint(
    file: UploadFile = File(...),
    task: str = Form(...),
    model: str = Form(...),
    text_input: str | None = Form(None),
):
    image_bytes = await file.read()
    job = submit_job(
        task=task,
        image_bytes=image_bytes,
        model=model,
        params={"text_input": text_input, "visualize": True},
    )
    print(f"[API] Job submitted {job['id']}")
    return {"job_id": job["id"]}


@router.get("/{job_id}")
def read_job(job_id: str):
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
def get_job_result_endpoint(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job not completed")
    return normalize_result(
        result=job["result"],
        task=job["task"],
        model=job["model"],
        image_bytes=job.get("image_bytes")
    )
