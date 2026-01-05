# app/services/job_runner.py
import threading
import traceback
from .job_manager import create_job, save_result
from inference.registry.model_registry import ModelRegistry  # Added for real inference
from inference.registry.task_types import TaskType  # Added
from inference.registry.model_types import ModelType  # Added

def submit_job(task: str, image_bytes: bytes, model: str | None, params: dict):
    """
    Creates a job and starts background execution in a thread.
    """
    job = create_job(task=task, model=model, params=params)
    job["image_bytes"] = image_bytes

    thread = threading.Thread(
        target=run_job,
        args=(job,),
        daemon=True,
    )
    thread.start()
    return job

def run_job(job):
    print(f"[JobRunner] Running job {job['id']} task '{job['task']}' with model '{job['model']}'")
    try:
        registry = ModelRegistry()
        result = registry.run(
            task=TaskType(job["task"].upper()),  # Convert to enum (assuming tasks are lowercase in input)
            image_bytes=job["image_bytes"],
            model=ModelType(job["model"].upper()),  # Convert to enum
            **job["params"]  # e.g., text_input, visualize
        )
        print(f"[JobRunner] Inference result: {result}")  # Added log for debugging
        save_result(job["id"], result)
        print(f"[JobRunner] Job {job['id']} completed successfully")
    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        job["traceback"] = traceback.format_exc()
        print(f"[JobRunner] Job {job['id']} failed: {e}")