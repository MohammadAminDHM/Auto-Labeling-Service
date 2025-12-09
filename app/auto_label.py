import os
import json
import requests
from pathlib import Path
from tqdm import tqdm
from PIL import Image
from io import BytesIO
import numpy as np
import random

# ---------------------------------------------------------
# Reproducibility
# ---------------------------------------------------------
random.seed(0)
np.random.seed(0)

API_URL = "http://localhost:6996/detection"
# Optional: target a specific registered model (see /health/models)
MODEL_NAME = os.getenv("MODEL_NAME", "rex-omni")

OUTPUT_DIR = r"D:\hami_system_sharif\rex-omni\auto_labeling_results"
DATASET_DIR = r"D:\hami_system_sharif\rex-omni\Dataset\object_detection"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------------------------------------------------------
# PROCESS ONE IMAGE
# ---------------------------------------------------------
def process_image(image_path, category_name, image_id, class_json):
    # send request
    with open(image_path, "rb") as f:
        files = {"file": f}
        data = [("categories", category_name), ("model_name", MODEL_NAME)]
        response = requests.post(API_URL, files=files, data=data)

    if response.status_code != 200:
        print(f"[ERROR] HTTP {response.status_code} for {image_path}")
        return image_id

    if "X-Rex-Detections" not in response.headers:
        print(f"[ERROR] No detection header for: {image_path}")
        return image_id

    try:
        detections = json.loads(response.headers["X-Rex-Detections"])
    except:
        print(f"[ERROR] Failed to decode detection JSON for: {image_path}")
        return image_id

    # save visualized image
    try:
        img = Image.open(BytesIO(response.content))
        category_dir = os.path.join(OUTPUT_DIR, category_name)
        os.makedirs(category_dir, exist_ok=True)
        vis_path = os.path.join(category_dir, f"vis_{image_id}.jpg")
        img.save(vis_path)
    except Exception as e:
        print(f"[WARN] Cannot save visualization for {image_path}: {e}")

    # append to per-class JSON
    class_json["images"].append({
        "id": image_id,
        "file_name": str(image_path)
    })

    for det in detections:
        x0, y0, x1, y1 = det["bbox"]
        class_json["annotations"].append({
            "image_id": image_id,
            "bbox": det["bbox"],
            "confidence": det.get("confidence", None),
            "area": (x1 - x0) * (y1 - y0)
        })

    return image_id + 1


# ---------------------------------------------------------
# MAIN
# ---------------------------------------------------------
def main():

    print("\n🚀 Auto labeling started...")
    dataset_path = Path(DATASET_DIR)

    for category_folder in sorted(dataset_path.iterdir()):

        if not category_folder.is_dir():
            continue

        category_name = category_folder.name
        print(f"\n📌 Processing category: {category_name}")

        # Prepare per-class JSON
        class_json = {
            "category": category_name,
            "images": [],
            "annotations": []
        }

        # internal image counter per class
        image_id = 1

        images = [
            p for p in category_folder.iterdir()
            if p.suffix.lower() in [".jpg", ".jpeg", ".png"]
        ]

        for img_file in tqdm(images, desc=category_name):
            image_id = process_image(img_file, category_name, image_id, class_json)

        # Save JSON per class
        class_dir = os.path.join(OUTPUT_DIR, category_name)
        os.makedirs(class_dir, exist_ok=True)

        json_path = os.path.join(class_dir, f"{category_name}.json")
        with open(json_path, "w") as f:
            json.dump(class_json, f, indent=2)

        print(f"📄 JSON saved: {json_path}")

    print("\n✅ Auto-labeling done.")
    print(f"Results stored in: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
