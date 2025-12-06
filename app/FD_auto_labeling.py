#!/usr/bin/env python3
# face_auto_label.py
# Auto-labeling script for Face Detection (male/female) dataset using RexOmni API

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

# ---------------------------------------------------------
# API endpoint
# ---------------------------------------------------------
API_URL = "http://localhost:6996/detection"  # Change if different

# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------
DATASET_DIR = r"/mnt/models/binatest/dataset_bina/Face detection/FaceDataset"
OUTPUT_DIR = r"/mnt/models/binatest/dataset_bina/auto_labeling_results/face_detection_labeling_results"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------------------------------------------------------
# Process a single image
# ---------------------------------------------------------
def process_image(image_path, category_name, image_id, class_json):
    """
    Send image to RexOmni API, get detections, save visualization, and update JSON.
    """
    try:
        with open(image_path, "rb") as f:
            files = {"file": f}
            data = [("categories", "face")]
            response = requests.post(API_URL, files=files, data=data)

        if response.status_code != 200:
            print(f"[ERROR] HTTP {response.status_code} for {image_path}")
            return image_id

        if "X-Rex-Detections" not in response.headers:
            print(f"[ERROR] No detection header for: {image_path}")
            return image_id

        detections = json.loads(response.headers["X-Rex-Detections"])

        # Save visualization
        try:
            img = Image.open(BytesIO(response.content))
            class_dir = os.path.join(OUTPUT_DIR, category_name)
            os.makedirs(class_dir, exist_ok=True)
            vis_path = os.path.join(class_dir, f"vis_{image_id}.jpg")
            img.save(vis_path)
        except Exception as e:
            print(f"[WARN] Visualization failed for {image_path}: {e}")

        # Update JSON
        class_json["images"].append({
            "id": image_id,
            "file_name": str(image_path)
        })

        for det in detections:
            x0, y0, x1, y1 = det["bbox"]
            class_json["annotations"].append({
                "image_id": image_id,
                "bbox": det["bbox"],
                "confidence": det.get("confidence"),
                "area": (x1 - x0) * (y1 - y0)
            })

        return image_id + 1

    except Exception as e:
        print(f"[ERROR] Failed processing {image_path}: {e}")
        return image_id

# ---------------------------------------------------------
# MAIN FUNCTION
# ---------------------------------------------------------
def main():
    dataset_path = Path(DATASET_DIR)
    print("\n🚀 Starting face auto-labeling...")
    print(f"📁 Dataset path: {dataset_path}")
    print(f"💾 Results will be saved in: {OUTPUT_DIR}")

    for category_folder in sorted(dataset_path.iterdir()):
        if not category_folder.is_dir():
            continue

        category_name = category_folder.name
        class_dir = os.path.join(OUTPUT_DIR, category_name)
        json_path = os.path.join(class_dir, f"{category_name}.json")
        os.makedirs(class_dir, exist_ok=True)

        # Skip already processed classes
        if os.path.exists(json_path):
            print(f"⏭ Skipping {category_name} (already completed)")
            continue

        print(f"\n📌 Processing class: {category_name}")
        class_json = {
            "class": category_name,
            "images": [],
            "annotations": []
        }

        image_id = 1
        images = [p for p in category_folder.iterdir() if p.suffix.lower() in [".jpg", ".jpeg", ".png"]]

        for img_file in tqdm(images, desc=category_name):
            image_id = process_image(img_file, category_name, image_id, class_json)

        # Save class JSON
        with open(json_path, "w") as f:
            json.dump(class_json, f, indent=2)
        print(f"📄 Saved JSON → {json_path}")

    print("\n✅ Face auto-labeling DONE.")

# ---------------------------------------------------------
# ENTRY POINT
# ---------------------------------------------------------
if __name__ == "__main__":
    main()
