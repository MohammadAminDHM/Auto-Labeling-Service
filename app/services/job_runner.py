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
        # Simulate model prediction
        task = job["task"].lower()

        if task in ["detection", "object_detection", "open_vocab_detection", "open_vocabulary_detection"]:
            result = {
                "bboxes": [[10, 10, 100, 100]],  # mock example
                "labels": ["example_label"],
                "scores": [0.95],
                "image_bytes": job.get("image_bytes")
            }
        elif task in ["region_segmentation", "region_to_segmentation"]:
            result = {
                "polygons": [[[10, 10], [50, 10], [50, 50], [10, 50]]],
                "labels": ["example_segment"],
                "bboxes": [[10, 10, 50, 50]],
                "masks": {},  # optional
                "image_bytes": job.get("image_bytes")
            }
        else:
            result = {
                "output": "task not implemented",
                "image_bytes": job.get("image_bytes")
            }

        save_result(job["id"], result)
        print(f"[JobRunner] Job {job['id']} completed successfully")

    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        job["traceback"] = traceback.format_exc()
        print(f"[JobRunner] Job {job['id']} failed: {e}")
