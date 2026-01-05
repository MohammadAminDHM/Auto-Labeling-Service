# app/services/result_serializer.py
import base64


def normalize_result(result: dict, task: str, model: str, image_bytes: bytes | None):
    normalized = {
        "ok": True,
        "task": task,
        "model": model,
        "image_bytes": base64.b64encode(image_bytes).decode()
        if image_bytes
        else None,
        "results": {},
    }

    if not result:
        return normalized

    task = task.lower()

    if task in {
        "detection",
        "object_detection",
        "open_vocab_detection",
        "open_vocabulary_detection",
    }:
        normalized["results"] = {
            "bboxes": result.get("bboxes", []),
            "labels": result.get("labels", []),
            "scores": result.get("scores", []),
        }

    elif task in {
        "region_segmentation",
        "region_to_segmentation",
    }:
        normalized["results"] = {
            "polygons": result.get("polygons", []),
            "labels": result.get("labels", []),
            "bboxes": result.get("bboxes", []),
            "masks": result.get("masks", {}),
        }

    else:
        normalized["results"] = result

    return normalized
