import threading
from app.services.job_manager import create_job
from inference.registry.model_registry import ModelRegistry
from inference.registry.task_types import TaskType
from inference.registry.model_types import ModelType
import traceback


def submit_job(task: str, image_bytes: bytes, model: str | None, params: dict):
    """
    Creates a job and starts background execution.
    """
    job = create_job(task=task, model=model, params=params)

    thread = threading.Thread(
        target=_run_job,
        args=(job, image_bytes),
        daemon=True,
    )
    thread.start()

    return job


def _run_job(job: dict, image_bytes: bytes):
    registry = ModelRegistry()

    try:
        job["status"] = "running"
        job["progress"] = 10

        task = TaskType(job["task"])
        model = ModelType(job["model"]) if job.get("model") else None

        job["progress"] = 40

        result = registry.run(
            task=task,
            image_bytes=image_bytes,
            model=model,
            **job.get("params", {})
        )

        job["progress"] = 100
        job["status"] = "completed"
        job["result"] = result

    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        job["traceback"] = traceback.format_exc()
