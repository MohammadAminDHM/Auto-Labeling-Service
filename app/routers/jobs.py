# app/routers/jobs.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.job_runner import submit_job
from app.services.job_manager import get_job
from app.services.result_serializer import normalize_result
from inference.registry.model_registry import ModelRegistry, TaskType, ModelType, TASK_INPUTS  # TASK_INPUTS imported

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

# Moved static /tasks before dynamic /{job_id}
@router.get("/tasks")
def get_available_tasks(model: str = "florence"):
    model_lower = model.lower()  # Normalize
    try:
        model_enum = ModelType(model_lower)
    except ValueError:
        raise HTTPException(400, detail="Invalid model")
    registry = ModelRegistry()
    tasks = [t.value for t in TaskType if t in registry.adapters[model_enum].supported_tasks()]  # lowercase values
    required_inputs = {t: TASK_INPUTS.get(TaskType(t.upper()), []) for t in tasks}  # map back via upper name
    return {"tasks": tasks, "required_inputs": required_inputs}

@router.post("")
async def create_job_endpoint(
    file: UploadFile = File(...),
    task: str = Form(...),
    model: str = Form(...),
    text_input: str | None = Form(None),
):
    # Normalize inputs to lowercase (frontend sends lowercase)
    task_lower = task.lower()
    model_lower = model.lower()

    # Find matching TaskType by value (case-sensitive, values are lowercase)
    matching_task = None
    for t in TaskType:
        if t.value == task_lower:
            matching_task = t
            break
    if matching_task is None:
        print(f"[API] Validation error: No TaskType with value '{task_lower}'")
        raise HTTPException(400, detail=f"Invalid task: {task}")

    # Model validation (ModelType values are lowercase)
    try:
        model_enum = ModelType(model_lower)
    except ValueError:
        print(f"[API] Validation error: Invalid model '{model_lower}'")
        raise HTTPException(400, detail=f"Invalid model: {model}")

    registry = ModelRegistry()
    allowed_models, required_args = registry.get_task_config(matching_task)
    if model_enum not in allowed_models:
        raise HTTPException(400, detail=f"Model {model} not supported for task {task}")
    if "text_input" in required_args and not text_input:
        raise HTTPException(400, detail=f"text_input required for task {task}")

    image_bytes = await file.read()
    job = submit_job(
        task=task_lower,  # Store lowercase (consistent with frontend)
        image_bytes=image_bytes,
        model=model_lower,
        params={"text_input": text_input, "visualize": True},
    )
    print(f"[API] Job submitted {job['id']} for task '{task_lower}' model '{model_lower}'")  # Enhanced log
    return {"job_id": job["id"]}

@router.get("/{job_id}")
def read_job(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    print(f"[API] Job {job_id} status: {job['status']}")
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
    normalized = normalize_result(
        result=job["result"],
        task=job["task"],
        model=job["model"],
        image_bytes=job.get("image_bytes")
    )
    print(f"[API] Job {job_id} result fetched")  # Added log
    return normalized