# app/services/job_result_store.py

result_store: dict[str, dict] = {}


def save_job_result(job_id: str, result: dict):
    result_store[job_id] = result


def get_job_result_data(job_id: str):
    return result_store.get(job_id)
