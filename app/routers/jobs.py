# app/routers/jobs.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path

from app.services.job_runner import submit_job
from app.services.job_manager import get_job
from inference.registry.model_registry import (
    ModelRegistry,
    TaskType,
    ModelType,
    TASK_INPUTS,
)

ARTIFACT_ROOT = Path("job_artifacts")

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.get("/tasks")
def get_available_tasks(model: str = "florence"):
    try:
        model_enum = ModelType(model.lower())
    except ValueError:
        raise HTTPException(400, detail="Invalid model")

    registry = ModelRegistry()
    supported = registry.adapters[model_enum].supported_tasks()

    return {
        "tasks": [t.value for t in supported],
        "required_inputs": {
            t.value: TASK_INPUTS.get(t, []) for t in supported
        },
    }


@router.post("")
async def create_job(
    file: UploadFile = File(...),
    task: str = Form(...),
    model: str = Form(...),
    text_input: str | None = Form(None),
):
    try:
        task_enum = TaskType(task.lower())
        model_enum = ModelType(model.lower())
    except ValueError:
        raise HTTPException(400, detail="Invalid task or model")

    registry = ModelRegistry()
    allowed_models, required_args = registry.get_task_config(task_enum)

    if model_enum not in allowed_models:
        raise HTTPException(400, detail="Model not supported for task")

    if "text_input" in required_args and not text_input:
        raise HTTPException(400, detail="text_input is required")

    image_bytes = await file.read()

    job = submit_job(
        task=task_enum.value,
        model=model_enum.value,
        image_bytes=image_bytes,
        params={
            "text_input": text_input,
            "visualize": True,
        },
    )

    return {"job_id": job["id"]}



ARTIFACT_ROOT = Path("job_artifacts")
router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.get("/{job_id}")
def read_job(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, detail="Job not found")

    job_dir = ARTIFACT_ROOT / job_id
    existing_artifacts = []
    for name in ["overlay", "mask"]:
        if (job_dir / f"{name}.png").exists():
            existing_artifacts.append(name)

    return {
        "id": job["id"],
        "status": job["status"],
        "progress": job["progress"],
        "error": job["error"],
        "has_result": job["status"] == "completed",
        "artifacts": existing_artifacts,
    }



@router.get("/{job_id}/result")
def get_job_result(job_id: str):
    job = get_job(job_id)
    if not job or job["status"] != "completed":
        raise HTTPException(400, detail="Job not completed")

    return {
        "job_id": job["id"],
        "task": job["task"],
        "model": job["model"],
        "annotations": job["result"],
        "artifacts": {
            "overlay": f"/api/jobs/{job_id}/artifacts/overlay",
            "mask": f"/api/jobs/{job_id}/artifacts/mask",
        },
    }


@router.get("/{job_id}/artifacts/{name}")
def get_artifact(job_id: str, name: str):
    path = ARTIFACT_ROOT / job_id / f"{name}.png"
    if not path.exists():
        raise HTTPException(404, detail=f"{name} artifact not found")
    return FileResponse(path, media_type="image/png")