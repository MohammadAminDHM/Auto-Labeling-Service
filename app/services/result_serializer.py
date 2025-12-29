import base64

def normalize_result(result, task=None, model=None, image_bytes=None):
    """
    Normalize raw model outputs into a consistent schema for frontend.
    """
    normalized = {
        "ok": True,
        "task": task,
        "model": model,
        "image_bytes": None,
        "results": {},
    }

    if image_bytes:
        normalized["image_bytes"] = base64.b64encode(image_bytes).decode()

    if not result:
        return normalized

    # Detection / OD
    if "bboxes" in result or "labels" in result:
        normalized["results"]["bboxes"] = result.get("bboxes", [])
        normalized["results"]["labels"] = result.get("labels", [])
        normalized["results"]["scores"] = result.get("scores", [])

    # OCR
    if "text" in result or "boxes" in result:
        normalized["results"]["text"] = result.get("text", "")
        normalized["results"]["boxes"] = result.get("boxes", [])

    # Caption
    if "caption" in result:
        normalized["results"]["caption"] = result.get("caption", "")

    # Segmentation / masks
    if "masks" in result or "categories" in result:
        normalized["results"]["masks"] = result.get("masks", [])
        normalized["results"]["categories"] = result.get("categories", [])

    # Visual prompting / keypoints
    if "keypoints" in result:
        normalized["results"]["keypoints"] = result.get("keypoints", [])

    return normalized
