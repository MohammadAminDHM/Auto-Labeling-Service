# app/services/job_result_store.py
"""
In-memory store for job results.
"""
result_store: dict[str, dict] = {}


def save_job_result(job_id: str, result: dict):
    result_store[job_id] = result
    print(f"[JobResultStore] Saved result for job {job_id}")


def get_job_result_data(job_id: str):
    return result_store.get(job_id)
