#!/usr/bin/env python3
# posture_auto_label_robust_fixed_v2.py
# Robust client for Rex-Omni detection -> keypoint auto-labeling
# Adds reliable keypoint parsing, drawing (joints + skeleton), and per-class JSON with bbox+persons.



#THIS CODE DIDNT USE!

import os
import json
import requests
from pathlib import Path
from tqdm import tqdm
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import numpy as np
import random
import math
import time
from typing import Iterable, Tuple, Union, List, Dict, Optional

# Reproducibility
random.seed(0)
np.random.seed(0)

# API ENDPOINTS
DETECTION_API_URL = "http://localhost:6996/detection"
KEYPOINT_API_URL = "http://localhost:6996/keypoint"

# Globals
OUTPUT_DIR = r"/mnt/models/binatest/dataset_bina/auto_labeling_results/Posture_Labeling_Results"
os.makedirs(OUTPUT_DIR, exist_ok=True)

DATASET_DIR = r"/mnt/models/binatest/dataset_bina/Posture Detection/PostureDataset"

# Retry settings
RETRY_ON_5XX = 2
INITIAL_BACKOFF = 1.0  # seconds
TIMEOUT = 120  # seconds - increase if your model is slow

# Helper types
FormFieldsType = Union[Dict[str, Union[str, int, float, Iterable[str]]], List[Tuple[str, str]]]

# Standard keypoint order we expect (common pose keypoints)
KP_ORDER = [
    "nose", "left_eye", "right_eye", "left_ear", "right_ear",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle"
]

# Skeleton edges (pairs of keypoint names) for drawing lines
SKELETON = [
    ("nose", "left_eye"), ("nose", "right_eye"),
    ("left_eye", "left_ear"), ("right_eye", "right_ear"),
    ("left_shoulder", "right_shoulder"),
    ("left_shoulder", "left_elbow"), ("left_elbow", "left_wrist"),
    ("right_shoulder", "right_elbow"), ("right_elbow", "right_wrist"),
    ("left_shoulder", "left_hip"), ("right_shoulder", "right_hip"),
    ("left_hip", "right_hip"),
    ("left_hip", "left_knee"), ("left_knee", "left_ankle"),
    ("right_hip", "right_knee"), ("right_knee", "right_ankle")
]

def save_json_atomic(path, obj):
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(obj, f, indent=2)
    os.replace(tmp, path)

def _log_response(resp: requests.Response, context: str = "response"):
    """Helper to print response diagnostics for debugging."""
    try:
        txt = resp.text
    except Exception:
        txt = "<no-text-or-failed-to-read>"
    print(f"[DEBUG] {context} - status={resp.status_code}, headers={dict(resp.headers)}")
    preview = txt[:2000] + ("...(truncated)" if len(txt) > 2000 else "")
    print(f"[DEBUG] {context} - body preview: {preview}")

def _normalize_form_fields(form_fields: Optional[FormFieldsType]) -> List[Tuple[str, str]]:
    if not form_fields:
        return []
    if isinstance(form_fields, list):
        return [(str(k), str(v)) for (k, v) in form_fields]
    out: List[Tuple[str, str]] = []
    for k, v in form_fields.items():
        if isinstance(v, str) or not isinstance(v, Iterable):
            out.append((str(k), str(v)))
        else:
            if isinstance(v, (list, tuple, set)):
                for item in v:
                    out.append((str(k), str(item)))
            else:
                out.append((str(k), str(v)))
    return out

def _merge_params_from_lists(*lists: List[Tuple[str, str]]) -> List[Tuple[str, str]]:
    merged: List[Tuple[str, str]] = []
    for lst in lists:
        if lst:
            merged.extend(lst)
    return merged

def post_image_with_fallback(url: str, image_bytes: bytes, *,
                             form_fields: Optional[FormFieldsType] = None,
                             query_params: Optional[FormFieldsType] = None,
                             timeout: int = TIMEOUT) -> requests.Response:
    form_list = _normalize_form_fields(form_fields)
    query_list = _normalize_form_fields(query_params)

    bio = BytesIO(image_bytes)
    bio.seek(0)
    files = {"file": ("image.jpg", bio, "image/jpeg")}
    attempts = 0
    backoff = INITIAL_BACKOFF

    while True:
        attempts += 1
        try:
            resp = requests.post(url, files=files, data=form_list if form_list else None,
                                 params=query_list if query_list else None, timeout=timeout)
        except Exception as e:
            print(f"[WARN] Multipart POST to {url} failed (attempt {attempts}): {e}")
            resp = None

        if resp is None:
            if attempts > RETRY_ON_5XX:
                break
            time.sleep(backoff)
            backoff *= 2
            bio.seek(0)
            continue

        if 500 <= resp.status_code < 600:
            print(f"[WARN] Multipart returned {resp.status_code} - trying raw-body fallback (attempt {attempts})")
            _log_response(resp, "multipart-failed")
            raw_params = _merge_params_from_lists(query_list, form_list)
            try:
                raw_resp = requests.post(url, data=image_bytes,
                                         headers={"Content-Type": "image/jpeg"},
                                         params=raw_params if raw_params else None,
                                         timeout=timeout)
                return raw_resp
            except Exception as e:
                print(f"[ERROR] Raw POST also failed: {e}")
                return resp
        else:
            return resp

    raw_params = _merge_params_from_lists(query_list, form_list)
    try:
        raw_resp = requests.post(url, data=image_bytes, headers={"Content-Type": "image/jpeg"},
                                 params=raw_params if raw_params else None, timeout=timeout)
        return raw_resp
    except Exception as e:
        raise RuntimeError(f"Both multipart and raw POST attempts failed for {url}: {e}")

def _draw_skeleton(draw: ImageDraw.ImageDraw, person_kps: Dict[str, List[int]], joint_radius:int=3):
    """
    Draw circles for keypoints and lines for skeleton edges on the provided ImageDraw instance.
    person_kps: mapping from keypoint name -> [x, y]
    """
    # draw lines
    for a, b in SKELETON:
        if a in person_kps and b in person_kps:
            x1, y1 = person_kps[a]
            x2, y2 = person_kps[b]
            draw.line([x1, y1, x2, y2], fill="lime", width=2)

    # draw joints
    for name, coord in person_kps.items():
        try:
            x, y = int(coord[0]), int(coord[1])
            r = joint_radius
            draw.ellipse([x-r, y-r, x+r, y+r], fill="red", outline="red")
        except Exception:
            continue

def process_image(image_path: Path, action_name: str, image_id: int, class_json: dict) -> int:
    """
    Calls detection -> keypoint per bbox -> draws bbox + keypoints on full image -> saves visualization and updates class_json.
    """
    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()
    except Exception as e:
        print(f"[ERROR] Failed to read {image_path}: {e}")
        return image_id

    detection_form = [("categories", "person")]
    try:
        det_resp = post_image_with_fallback(DETECTION_API_URL, image_bytes, form_fields=detection_form, timeout=TIMEOUT)
    except Exception as e:
        print(f"[ERROR] Detection request totally failed for {image_path}: {e}")
        return image_id

    if det_resp is None:
        print(f"[ERROR] No response from detection for {image_path}")
        return image_id

    if det_resp.status_code != 200:
        print(f"[ERROR] Detection failed for {image_path} (HTTP {det_resp.status_code})")
        _log_response(det_resp, "detection-error")
        return image_id

    # parse detection results (header preferred)
    det_header = det_resp.headers.get("X-Rex-Detections")
    detections = None
    if det_header:
        try:
            detections = json.loads(det_header)
        except Exception as e:
            print(f"[WARN] Failed to parse X-Rex-Detections header JSON: {e}")
            detections = None

    if detections is None:
        try:
            body = det_resp.json()
            for k in ("detections", "results", "data", "items"):
                if k in body and isinstance(body[k], list):
                    detections = body[k]
                    break
            if detections is None and isinstance(body, list):
                detections = body
        except Exception:
            pass

    if detections is None:
        print(f"[WARN] No detections found for {image_path}. Response headers keys: {list(det_resp.headers.keys())}")
        _log_response(det_resp, "detection-no-detections")
        return image_id

    if not isinstance(detections, list):
        print(f"[ERROR] Unexpected detections format for {image_path}: {type(detections)}")
        return image_id

    # lazy-load full image for drawing and cropping
    try:
        img_full = Image.open(image_path).convert("RGB")
    except Exception as e:
        print(f"[ERROR] Cannot open image {image_path} for drawing: {e}")
        return image_id

    draw = ImageDraw.Draw(img_full)

    # store annotation entries for this image
    class_json["images"].append({
        "id": image_id,
        "file_name": str(image_path),
        "action": action_name
    })

    # We'll build annotations: one entry per detection (bbox) with persons list
    for det in detections:
        if not isinstance(det, dict):
            continue
        bbox = det.get("bbox", [])
        label = det.get("label", None)
        score = det.get("score", None)

        if not bbox or len(bbox) != 4:
            continue

        try:
            x0, y0, x1, y1 = [int(math.floor(float(c))) for c in bbox]
        except Exception:
            continue

        # clamp
        x0 = max(0, x0)
        y0 = max(0, y0)
        x1 = min(img_full.width, int(x1))
        y1 = min(img_full.height, int(y1))
        if x1 <= x0 or y1 <= y0:
            continue

        # draw bbox
        draw.rectangle([x0, y0, x1, y1], outline="red", width=2)

        # crop for keypoint
        cropped = img_full.crop((x0, y0, x1, y1))
        buf = BytesIO()
        cropped.save(buf, format="JPEG")
        cropped_bytes = buf.getvalue()
        buf.close()

        # call keypoint endpoint with required fields
        kp_form = [("keypoint_type", "person"), ("categories", "person")]
        kp_resp = None
        try:
            kp_resp = post_image_with_fallback(KEYPOINT_API_URL, cropped_bytes, form_fields=kp_form, timeout=TIMEOUT)
        except Exception as e:
            print(f"[WARN] Keypoint POST failed for bbox {bbox} in {image_path}: {e}")
            kp_resp = None

        persons_for_annotation: List[Dict] = []

        if kp_resp is None:
            print(f"[WARN] Keypoint endpoint returned no response for bbox {bbox} in {image_path}")
            # still create an annotation (bbox without persons)
            class_json["annotations"].append({
                "image_id": image_id,
                "bbox": [float(x0), float(y0), float(x1), float(y1)],
                "persons": [],
                "label": label,
                "score": score,
                "area": max(0.0, (x1 - x0) * (y1 - y0))
            })
            continue

        if kp_resp.status_code != 200:
            print(f"[WARN] Keypoint call returned {kp_resp.status_code} - trying fallback query param")
            _log_response(kp_resp, "keypoint-initial-failed")
            try:
                kp_resp2 = post_image_with_fallback(KEYPOINT_API_URL, cropped_bytes,
                                                   query_params=[("keypoint_type", "person"), ("categories", "person")],
                                                   timeout=TIMEOUT)
                kp_resp = kp_resp2
            except Exception as e:
                print(f"[WARN] Keypoint query-param fallback failed: {e}")
                kp_resp = None

        if kp_resp is None or kp_resp.status_code != 200:
            print(f"[WARN] Keypoint ultimately failed for bbox {bbox} in {image_path}")
            if kp_resp is not None:
                _log_response(kp_resp, "keypoint-final-fail")
            class_json["annotations"].append({
                "image_id": image_id,
                "bbox": [float(x0), float(y0), float(x1), float(y1)],
                "persons": [],
                "label": label,
                "score": score,
                "area": max(0.0, (x1 - x0) * (y1 - y0))
            })
            continue

        # parse keypoint JSON
        try:
            kp_json = kp_resp.json()
        except Exception as e:
            print(f"[WARN] Failed to decode keypoint JSON for bbox {bbox} in {image_path}: {e}")
            _log_response(kp_resp, "keypoint-non-json")
            class_json["annotations"].append({
                "image_id": image_id,
                "bbox": [float(x0), float(y0), float(x1), float(y1)],
                "persons": [],
                "label": label,
                "score": score,
                "area": max(0.0, (x1 - x0) * (y1 - y0))
            })
            continue

        # Extract possible result structures
        kp_results = None
        if isinstance(kp_json, dict):
            if "results" in kp_json:
                kp_results = kp_json.get("results") or []
            elif "detections" in kp_json:
                kp_results = kp_json.get("detections") or []
            elif "data" in kp_json:
                kp_results = kp_json.get("data") or []
            else:
                kp_results = kp_json.get("results") or kp_json.get("extracted_predictions") or []
        else:
            kp_results = []

        # normalize to list
        if not isinstance(kp_results, list):
            if isinstance(kp_results, dict):
                tmp = []
                for v in kp_results.values():
                    if isinstance(v, list):
                        tmp.extend(v)
                kp_results = tmp
            else:
                kp_results = []

        # For each keypoint instance returned for this crop, build a person mapping and remap coords to full image
        for item in kp_results:
            if not isinstance(item, dict):
                continue
            # item may have 'keypoints' dict (name -> [x,y]) or extracted_predictions style
            item_kps = item.get("keypoints") or {}
            inst_id = item.get("instance_id") or item.get("id") or None
            # some models return extracted_predictions mapping label->[objs], handle earlier, but we've normalized
            if not isinstance(item_kps, dict) or not item_kps:
                continue

            person_map: Dict[str, List[int]] = {}
            for name, coords in item_kps.items():
                try:
                    cx = float(coords[0])
                    cy = float(coords[1])
                except Exception:
                    continue
                # Determine if coords are relative to crop (typical) or absolute already
                crop_w = x1 - x0
                crop_h = y1 - y0
                if cx > crop_w or cy > crop_h:
                    # absolute already
                    abs_x, abs_y = int(round(cx)), int(round(cy))
                else:
                    # crop-relative -> map back to full image
                    abs_x, abs_y = int(round(x0 + cx)), int(round(y0 + cy))
                person_map[name] = [abs_x, abs_y]

            if person_map:
                # draw this person's keypoints on full image
                _draw_skeleton(draw, person_map, joint_radius=3)
                # optional: draw instance id near nose
                try:
                    if "nose" in person_map:
                        nx, ny = person_map["nose"]
                        # small label
                        draw.text((nx+4, ny-6), str(inst_id or ""), fill="yellow")
                except Exception:
                    pass

                persons_for_annotation.append({
                    "instance_id": inst_id,
                    "keypoints": person_map
                })

        # Save annotation for this bbox (may have 0..N person instances)
        class_json["annotations"].append({
            "image_id": image_id,
            "bbox": [float(x0), float(y0), float(x1), float(y1)],
            "persons": persons_for_annotation,
            "label": label,
            "score": score,
            "area": max(0.0, (x1 - x0) * (y1 - y0))
        })

    # Save visualization and per-class JSON
    class_dir = os.path.join(OUTPUT_DIR, action_name)
    os.makedirs(class_dir, exist_ok=True)
    vis_path = os.path.join(class_dir, f"vis_{image_id}.jpg")
    try:
        img_full.save(vis_path)
    except Exception as e:
        print(f"[WARN] Visualization/save failed for {image_path}: {e}")

    return image_id + 1

def main():
    dataset_path = Path(DATASET_DIR)

    print("\n🚀 Starting posture/action auto-labeling (robust client, v2)...")
    print(f"📁 Dataset path: {dataset_path}")
    print(f"💾 Saving results in: {OUTPUT_DIR}")

    for action_folder in sorted(dataset_path.iterdir()):
        if not action_folder.is_dir():
            continue

        action_name = action_folder.name
        class_dir = os.path.join(OUTPUT_DIR, action_name)
        json_path = os.path.join(class_dir, f"{action_name}.json")

        print(f"\n📌 Processing action: {action_name}")
        class_json = {
            "action": action_name,
            "images": [],
            "annotations": []
        }

        image_id = 1
        images = [p for p in action_folder.iterdir() if p.suffix.lower() in [".jpg", ".jpeg", ".png"]]

        for img_file in tqdm(images, desc=action_name):
            try:
                image_id = process_image(img_file, action_name, image_id, class_json)
            except Exception as e:
                print(f"[ERROR] Unexpected failure processing {img_file}: {e}")

        os.makedirs(class_dir, exist_ok=True)
        try:
            save_json_atomic(json_path, class_json)
            print(f"📄 Saved JSON → {json_path}")
        except Exception as e:
            print(f"[ERROR] Failed to save JSON for {action_name}: {e}")

    print("\n✅ Posture/action auto-labeling DONE.")

if __name__ == "__main__":
    main()
