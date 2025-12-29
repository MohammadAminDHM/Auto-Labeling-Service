import uuid

job_store: dict[str, dict] = {}


def create_job(task: str, model: str | None, params: dict):
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
