# app/services/job_runner.py
import threading
import traceback
from .job_manager import create_job, save_result

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
        # Example: simulate a model prediction (replace with your real model)
        # Here we mock a detection result
        result = {
            "bboxes": [[10, 10, 100, 100]],
            "labels": ["example_label"],
            "scores": [0.95],
            "image_bytes": job.get("image_bytes")  # optional visualization
        }

        save_result(job["id"], result)
        print(f"[JobRunner] Job {job['id']} completed successfully")

    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        job["traceback"] = traceback.format_exc()
        print(f"[JobRunner] Job {job['id']} failed: {e}")
