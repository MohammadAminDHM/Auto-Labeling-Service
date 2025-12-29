# app/services/job_manager.py
import uuid
from typing import Optional
from .job_result_store import save_job_result, get_job_result_data

job_store: dict[str, dict] = {}

def create_job(task: str, model: Optional[str], params: dict):
    job_id = str(uuid.uuid4())
    job_store[job_id] = {
        "id": job_id,
        "task": task,
        "model": model,
        "params": params,
        "status": "queued",
        "progress": 0,
        "result": None,
        "error": None,
        "image_bytes": None,
        "traceback": None,
    }
    print(f"[JobManager] Created job {job_id} for task '{task}' with model '{model}'")
    return job_store[job_id]

def get_job(job_id: str):
    job = job_store.get(job_id)
    if job:
        print(f"[JobManager] Retrieved job {job_id} status: {job['status']}")
    else:
        print(f"[JobManager] Job {job_id} not found")
    return job

def save_result(job_id: str, result: dict):
    job = get_job(job_id)
    if job:
        job["result"] = result
        job["status"] = "completed"
        save_job_result(job_id, result)
        print(f"[JobManager] Saved result for job {job_id}")
