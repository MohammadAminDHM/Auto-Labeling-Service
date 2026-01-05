# app/services/job_runner.py
import threading
import traceback
from pathlib import Path

from app.services.job_manager import (
    create_job,
    save_result,
    mark_running,
    mark_failed,
)
from inference.registry.model_registry import ModelRegistry
from inference.registry.task_types import TaskType
from inference.registry.model_types import ModelType

ARTIFACT_ROOT = Path("job_artifacts")


def submit_job(task: str, model: str, image_bytes: bytes, params: dict):
    job = create_job(task, model, params)

    ARTIFACT_ROOT.mkdir(exist_ok=True)
    job_dir = ARTIFACT_ROOT / job["id"]
    job_dir.mkdir(exist_ok=True)

    (job_dir / "original.png").write_bytes(image_bytes)

    thread = threading.Thread(
        target=run_job,
        args=(job["id"], image_bytes),
        daemon=True,
    )
    thread.start()

    return job


def run_job(job_id: str, image_bytes: bytes):
    from app.services.job_manager import get_job

    job = get_job(job_id)
    if not job:
        return

    try:
        mark_running(job_id)

        registry = ModelRegistry()
        annotations, overlay, mask = registry.run(
            task=TaskType(job["task"]),
            model=ModelType(job["model"]),
            image_bytes=image_bytes,
            **job["params"],
        )

        job_dir = ARTIFACT_ROOT / job_id
        if overlay:
            (job_dir / "overlay.png").write_bytes(overlay)
        if mask:
            (job_dir / "mask.png").write_bytes(mask)

        save_result(job_id, annotations)

    except Exception as e:
        mark_failed(job_id, str(e))
        traceback.print_exc()
