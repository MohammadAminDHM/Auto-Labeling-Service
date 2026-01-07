# app/services/job_runner.py
import threading
import traceback
from pathlib import Path

from app.services.job_manager import create_job, save_result, mark_running, mark_failed
from app.services.result_serializer import normalize_result
from inference.registry.model_registry import ModelRegistry, TaskType, ModelType

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

        # Run the task
        raw_result = registry.run(
            task=TaskType(job["task"]),
            model=ModelType(job["model"]),
            image_bytes=image_bytes,
            **job["params"],
        )

        job_dir = ARTIFACT_ROOT / job_id

        overlay_bytes = raw_result.get("image_bytes")
        mask_bytes = raw_result.get("mask_bytes")

        # Save artifacts dynamically
        artifacts = []
        if overlay_bytes:
            overlay_path = job_dir / "overlay.png"
            overlay_path.write_bytes(overlay_bytes)
            artifacts.append("overlay")
        if mask_bytes:
            mask_path = job_dir / "mask.png"
            mask_path.write_bytes(mask_bytes)
            artifacts.append("mask")

        # Normalize results
        normalized = normalize_result(
            result=raw_result.get("results", {}),
            task=job["task"],
            model=job["model"],
            image_bytes=overlay_bytes,
            mask_bytes=mask_bytes,
        )

        # Include artifact names
        normalized["artifacts"] = artifacts

        save_result(job_id, normalized)

    except Exception as e:
        mark_failed(job_id, str(e))
        traceback.print_exc()
