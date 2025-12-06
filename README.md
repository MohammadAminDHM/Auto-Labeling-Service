# Auto Labeling Service (Rex-Omni)
Here’s a fully **professional, complete README** for your Rex-Omni Auto-Labeling project, merging all previous content, adding workflow explanations, and including a visual workflow diagram.

---

# Rex-Omni Auto-Labeling Service

A **structured FastAPI service** wrapping the **Rex-Omni multimodal model** to provide automated image labeling for various computer vision tasks. It supports:

* **Object Detection**
* **Visual Prompting**
* **Keypoint Estimation** (human pose, hand, face, animal)
* **OCR** (Optical Character Recognition)

The service streams **visualized images**, returns structured **JSON outputs**, and is ideal for **dataset bootstrapping, interactive demos, and large-scale labeling pipelines**.

---

## Features

* 🚀 **FastAPI application** with modular endpoints and interactive OpenAPI docs.
* 🖼️ **Detection endpoint** streams annotated JPEGs and returns detection metadata in headers (`X-Rex-Detections`).
* 🔍 **Visual Prompting**: guide the model with user-defined bounding boxes for precise detections.
* 🧍 **Keypoint Detection**: supports human pose, hand, face, and animal landmarks.
* 📝 **OCR Support**: configurable output format (Box/Text) and granularity (Word/Line level).
* ✅ **Health Endpoint**: lightweight readiness and uptime check.
* 📂 **Auto-Labeling Scripts**: batch process datasets, generate per-class JSON annotations, and visualizations.

---

## Workflow Diagram

```text
           ┌───────────────────┐
           │   Input Dataset   │
           │  (images folder)  │
           └────────┬──────────┘
                    │
                    ▼
           ┌───────────────────┐
           │ FastAPI Auto-     │
           │ Labeling Service  │
           │ (Rex-Omni Model) │
           └────────┬──────────┘
      ┌─────────────┴─────────────┐
      │                           │
      ▼                           ▼
┌───────────────┐           ┌───────────────┐
│ JSON Outputs  │           │ Annotated     │
│ per category  │           │ Images w/ BBox│
│               │           │ Visualization │
└───────────────┘           └───────────────┘
      │                           │
      └───────────────┬───────────┘
                      ▼
           ┌───────────────────┐
           │ Post-processing & │
           │ Dataset Analysis  │
           └───────────────────┘
```

---

## Quickstart

### 1. Install Dependencies

Ensure Python 3.10+ is installed. GPU/accelerator drivers recommended for batch processing.

```bash
pip install -r requirements.txt
```

---

### 2. Launch the API

```bash
uvicorn app.main:app --host 0.0.0.0 --port 6996 --reload
```

Open [http://localhost:6996/docs](http://localhost:6996/docs) for **interactive documentation**.

---

## API Overview

| Task             | Endpoint            | Method | Notes                                                                                 |
| ---------------- | ------------------- | ------ | ------------------------------------------------------------------------------------- |
| Health check     | `/health`           | GET    | Lightweight uptime probe                                                              |
| Detection        | `/detection`        | POST   | Multipart image upload; returns annotated JPEG stream + detection metadata in headers |
| OCR              | `/ocr`              | POST   | Structured text extraction                                                            |
| Keypoint         | `/keypoint`         | POST   | Supports `human_pose`, `hand`, `animal`, and `face` keypoints                         |
| Visual Prompting | `/visual_prompting` | POST   | Accepts `visual_prompt_boxes` JSON array to guide detections                          |

---

### Example: Object Detection (cURL)

```bash
curl -X POST "http://localhost:6996/detection" \
  -F "file=@/path/to/image.jpg" \
  -F "categories=person" \
  -o annotated.jpg -D headers.txt
```

* `annotated.jpg`: visualized bounding boxes
* `headers.txt`: detection metadata in `X-Rex-Detections` header

---

## Auto-Labeling Script

The **auto-labeling scripts** allow **batch processing of datasets**:

1. Iterate through **category folders**.
2. Send images to the **detection API**.
3. Receive JSON annotations and optional visualizations.
4. Save **per-class JSON** and **annotated images** in a structured directory.

### Setup

Update the following in `app/auto_label.py`:

```python
API_URL = "http://localhost:6996/detection"
OUTPUT_DIR = "/path/to/auto_labeling_results"
DATASET_DIR = "/path/to/dataset"
```

### Run

```bash
python app/auto_label.py
```

### Output Structure

```
auto_labeling_results/
    male/
        male.json
        vis_1.jpg
        vis_2.jpg
    female/
        female.json
        vis_1.jpg
```

**Example JSON per category:**

```json
{
  "category": "male",
  "images": [{"id": 1, "file_name": "/path/to/image.jpg"}],
  "annotations": [
    {"image_id": 1, "bbox": [x0, y0, x1, y1], "confidence": 0.95, "area": 1234}
  ]
}
```

---

## Development Notes

* **Routers** are in `app/routers/` and share a **cached RexOmniService instance** from `app/dependencies.py` to avoid repeated model loads.
* Update **model settings** (AWQ quantization, cache directory, temperature) via `RexOmniService`.
* The FastAPI entry point is `app/main.py`. Local execution supported with:

```bash
python app/main.py
```

* Handles **errors gracefully**, skips corrupted images, and continues processing.

---

## Requirements

* Python 3.10+
* FastAPI, uvicorn
* Pillow, requests, numpy, tqdm
* Rex-Omni model package
* Huggingface Hub

**Recommended:** GPU for faster batch processing, especially with large datasets.

---

## Best Practices

1. Organize datasets in **per-category folders**.
2. Remove hidden/system files (e.g., macOS `._*` files).
3. Inspect sample visualizations to validate **detection quality**.
4. Use smaller images if **GPU memory is limited**.
5. Cache the model locally to **avoid repeated downloads**.

---

## Summary

Rex-Omni Auto-Labeling Service is a **robust, production-ready pipeline** for automated labeling of vision datasets. It provides:

* Structured **JSON outputs**
* Annotated **visualizations**
* Multi-task support for **object detection, keypoints, OCR, and visual prompting**

Ideal for **research, dataset preparation, and production-grade AI pipelines**.

---

Do you want me to create that image version?
