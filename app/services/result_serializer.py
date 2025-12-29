# app/services/result_serializer.py
import base64

def normalize_result(result: dict, task: str, model: str, image_bytes: bytes | None = None):
    """
    Converts outputs into a normalized schema for frontend.
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

    if task.lower() in ["detection", "object_detection"]:
        normalized["results"] = {
            "<OD>": {
                "<OD>": {
                    "bboxes": result.get("bboxes", []),
                    "labels": result.get("labels", []),
                    "scores": result.get("scores", [])
                }
            }
        }
    elif task.lower() in ["open_vocab_detection", "open_vocabulary_detection"]:
        normalized["results"] = {
            "<OVD>": {
                "<OVD>": {
                    "bboxes": result.get("bboxes", []),
                    "labels": result.get("labels", []),
                    "scores": result.get("scores", [])
                }
            }
        }
    elif task.lower() in ["region_segmentation", "region_to_segmentation"]:
        normalized["results"] = {
            "<RS>": {
                "polygons": result.get("polygons", []),
                "labels": result.get("labels", []),
                "bboxes": result.get("bboxes", []),
                "masks": result.get("masks", {})
            }
        }
    else:
        normalized["results"] = result

    print(f"[ResultSerializer] Normalized result for task '{task}'")
    return normalized
