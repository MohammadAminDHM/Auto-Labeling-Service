# Auto-Labeling-Service-Based-on-RexOmni-Arcitecture-
this is image autolabeling system based on RexOmni which is multimodal Model arcitecture , we use it for create auto label pipeline ,for task such as object detection ,visual prompting , Human pose estimation and OCR .

![Project Banner](https://github.com/alirzx/Auto-Labeling-Service-Based-on-RexOmni-Arcitecture-/blob/main/rexomni_pic.png?raw=true)


Here’s a **professional README** draft for your Rex-Omni Auto-Labeling project, covering all aspects: workflow, goal, requirements, usage, and outputs. I structured it so it’s suitable for internal documentation, GitHub, or deployment guides.

---

# Rex-Omni Auto-Labeling Service

## Overview

**Rex-Omni Auto-Labeling Service** is a professional, multi-task vision-based labeling system built on top of **Rex-Omni**, designed to automate the generation of high-quality annotations for datasets. It supports:

* **Object Detection** (bounding boxes for objects, faces, plates, etc.)
* **Face Detection**
* **Keypoint Detection** (human pose, hand, animal, or face landmarks)
* **Visual Prompting** (guiding detection with user-specified regions)
* **OCR** (text extraction with bounding boxes)

The system automatically processes large datasets, produces **JSON annotations**, and generates **visualized images** showing detections, enabling downstream tasks like model training, evaluation, or research experiments.

---

## Goals

1. **Automate labeling** for large vision datasets.
2. **Provide standardized JSON outputs** for object bounding boxes, keypoints, and text.
3. **Generate visualizations** for quality inspection.
4. **Support multiple tasks** using a single inference backend (Rex-Omni).
5. **Handle errors gracefully** to ensure robust processing.

---

## Project Workflow

### **1. Dataset Preparation**

* Organize your dataset by categories. Example for face detection:

```
FaceDataset/
    male/
        img1.jpg
        img2.jpg
    female/
        img1.jpg
        img2.jpg
```

* Supported image formats: `.jpg`, `.jpeg`, `.png`.
* Ensure files are not corrupted or system-hidden files (e.g., macOS `._` files).

---

### **2. Start Rex-Omni API**

* The API serves as the backend for inference tasks.
* Start using **FastAPI** with uvicorn:

```bash
cd app
uvicorn main:app --host 0.0.0.0 --port 6996 --reload
```

* Available endpoints:

  * `/detection` → bounding boxes for specified categories.
  * `/keypoint` → human pose, face, hand, animal keypoints.
  * `/visual_prompting` → detection guided by visual prompts.
  * `/ocr` → text detection and extraction.
  * `/health` → check service status.

---

### **3. Auto-Labeling Script**

* Script iterates through each category folder.

* For each image:

  1. Reads image bytes.
  2. Sends a POST request to `/detection` API with the category.
  3. Receives JSON with bounding boxes, labels, and confidence scores.
  4. Optionally draws bounding boxes on the image for inspection.
  5. Updates a per-class JSON file with image metadata and annotations.

* Example structure of output JSON:

```json
{
  "category": "male",
  "images": [
    {"id": 1, "file_name": "/path/to/img1.jpg"}
  ],
  "annotations": [
    {
      "image_id": 1,
      "bbox": [x0, y0, x1, y1],
      "confidence": 0.98,
      "area": 1200
    }
  ]
}
```

* Visualized images are saved in the corresponding category folder in the output directory.

---

### **4. Outputs**

1. **JSON Annotations**

   * Stored per category (e.g., `male.json`, `female.json`).
   * Includes image IDs, bounding boxes, confidence scores, and areas.
2. **Visualizations**

   * Annotated images showing bounding boxes and scores.
   * Useful for inspection and validation.

---

## Requirements

### **Software**

* Python 3.10+
* FastAPI
* uvicorn
* Pillow
* Requests
* NumPy
* tqdm
* Rex-Omni package (`rex_omni`)
* Huggingface Hub (`huggingface_hub`)

### **Hardware**

* GPU recommended for faster inference.
* CPU-only is supported but slower for large datasets.

---

## Installation

1. Clone the repository:

```bash
git clone <repo-url>
cd rexomni-auto-labeling
```

2. Create a conda environment:

```bash
conda create -n rexomni python=3.10
conda activate rexomni
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Ensure the Rex-Omni model is cached or downloaded:

```bash
# Automatically handled by RexOmniService
```

---

## Usage

### **Start the API**

```bash
cd app
uvicorn main:app --host 0.0.0.0 --port 6996 --reload
```

### **Run Auto-Labeling**

* Configure `DATASET_DIR` and `OUTPUT_DIR` in the script.
* Run:

```bash
python auto_labeling_script.py
```

* The script iterates through dataset categories and saves results.

### **Inspect Outputs**

* JSON files: `<OUTPUT_DIR>/<category>/<category>.json`
* Visualizations: `<OUTPUT_DIR>/<category>/vis_<image_id>.jpg`

---

## Best Practices

1. **Filter invalid images**: Remove hidden files (`._*`) or corrupted images.
2. **Batch processing**: For large datasets, consider processing category by category.
3. **Error handling**: The script logs HTTP errors and continues processing.
4. **Visualization inspection**: Check sample images to ensure correct detection.
5. **Cache models**: Reuse cached models to avoid downloading repeatedly.

---

## Troubleshooting

* **HTTP 500 Errors**:

  * Corrupted images or system files.
  * Large images exceeding GPU memory limits.
* **No Detection Header**:

  * API failed to return predictions, check model status.
* **Slow Processing**:

  * Reduce image resolution or use GPU inference.

---

## Summary

Rex-Omni Auto-Labeling Service provides a **robust, automated pipeline** for generating high-quality **dataset annotations**, **visualizations**, and **JSON outputs** for a variety of vision tasks. It allows teams to **save time on manual labeling** while maintaining **professional standards** suitable for research and production.

---

I can also make a **visual workflow diagram** showing **dataset → API → JSON/visualization output**, and include it in the README for even more clarity.

![Project Banner](https://github.com/alirzx/Auto-Labeling-Service-Based-on-RexOmni-Arcitecture-/blob/main/cafe_visualize.jpg?raw=true)

