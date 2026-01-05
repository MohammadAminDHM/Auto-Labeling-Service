# app/services/job_manager.py
import uuid

job_store: dict[str, dict] = {}


def create_job(task: str, model: str, params: dict):
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
    }

    return job_store[job_id]


def get_job(job_id: str):
    return job_store.get(job_id)


def mark_running(job_id: str):
    job_store[job_id]["status"] = "running"
    job_store[job_id]["progress"] = 20


def save_result(job_id: str, result: dict):
    job_store[job_id]["result"] = result
    job_store[job_id]["status"] = "completed"
    job_store[job_id]["progress"] = 100
    job_store[job_id]["artifacts"] = result.get("artifacts", [])


def mark_failed(job_id: str, error: str):
    job_store[job_id]["status"] = "failed"
    job_store[job_id]["error"] = error
