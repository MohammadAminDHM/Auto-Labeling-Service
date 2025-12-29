# app/services/result_serializer.py
import base64

def normalize_result(result: dict, task: str, model: str, image_bytes: bytes | None = None):
    """
    Converts outputs into a normalized schema for frontend.
    All tasks use a consistent structure.
    """
    normalized = {
        "ok": True,
        "task": task,
        "model": model,
        "image_bytes": base64.b64encode(image_bytes).decode() if image_bytes else None,
        "results": {}
    }

    if not result:
        print(f"[ResultSerializer] Empty result for task '{task}'")
        return normalized

    task_lower = task.lower()

    # Detection tasks
    if task_lower in ["detection", "object_detection", "open_vocab_detection", "open_vocabulary_detection"]:
        normalized["results"] = {
            "bboxes": result.get("bboxes", []),
            "labels": result.get("labels", []),
            "scores": result.get("scores", [])
        }

    # Region segmentation tasks
    elif task_lower in ["region_segmentation", "region_to_segmentation"]:
        normalized["results"] = {
            "polygons": result.get("polygons", []),
            "labels": result.get("labels", []),
            "bboxes": result.get("bboxes", []),
            "masks": result.get("masks", {})
        }

    # Other tasks
    else:
        normalized["results"] = result

    print(f"[ResultSerializer] Normalized result for task '{task}'")
    return normalized
