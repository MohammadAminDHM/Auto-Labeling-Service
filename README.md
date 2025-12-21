
# Auto Labeling Service (Rex-Omni)

![Project Banner](https://github.com/alirzx/Auto-Labeling-Service-Based-on-RexOmni-Arcitecture-/blob/main/rexomni_pic.png?raw=true)

---

# Rex-Omni Auto-Labeling Service

A **modular FastAPI service** wrapping the **Rex-Omni multimodal model**, designed for **automated dataset labeling** across multiple computer vision tasks:

* **Object Detection** (generic objects, person, face, etc.)
* **Visual Prompting** for guided detection
* **Keypoint Estimation** (human pose, hand, face, animal)
* **OCR** (text detection and recognition)
* **Action & Posture Recognition** (HAR)

The service returns **annotated images** and **structured JSON**, suitable for **dataset bootstrapping, batch labeling pipelines, and interactive demos**.

---

## Features

* 🚀 **FastAPI app** with modular endpoints and interactive OpenAPI docs.
* 🖼️ **Detection endpoint** streams annotated JPEGs and returns detection metadata in headers (`X-Rex-Detections`).
* 🔍 **Visual Prompting**: accept bounding boxes to guide detection.
* 🧍 **Keypoint Detection**: supports human pose, hand, face, and animal landmarks.
* 📝 **OCR Support**: configurable output format (Box/Text) and granularity (Word/Line level).
* 🛠️ **Robust Auto-Labeling Scripts**: batch process datasets, generate per-class JSON annotations and visualizations, handle retries and API failures.
* ✅ **Health Endpoint** for readiness and uptime checking.

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

```bash
pip install -r requirements.txt
```

GPU/accelerator drivers are recommended for **large batch processing**.

---

### 2. Launch the API

```bash
uvicorn app.main:app --host 0.0.0.0 --port 6996 --reload
```

Access [http://localhost:6996/docs](http://localhost:6996/docs) for **interactive documentation**.

---

## API Overview

| Task             | Endpoint            | Method | Description                                                                           |
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

* `annotated.jpg` → visualized bounding boxes
* `headers.txt` → detection metadata in `X-Rex-Detections` header

---

## Auto-Labeling Scripts

The service provides **robust scripts** for batch labeling:

* **Face Detection**: `face_auto_label.py`
* **Object Detection**: `object_auto_label.py`
* **Posture & Action Recognition**: `posture_auto_label_robust_fixed_v2.py`
* **Action Recognition Testing & Evaluation**: `PD_test.py`

### Features:

* Skip **already processed categories** (resume after crashes)
* Save **per-class JSON annotations** and **visualized images**
* Handle **API failures**, retries, and logging
* Supports **keypoints for persons** and robust mapping to full images
* Tracks **bbox, confidence, area**, and **per-instance keypoints**

---

### Example Usage

Update script paths:

```python
API_URL = "http://localhost:6996/detection"
OUTPUT_DIR = "/mnt/models/binatest/dataset_bina/auto_labeling_results"
DATASET_DIR = "/mnt/models/binatest/dataset_bina/Face detection/FaceDataset"
```

Run the script:

```bash
python face_auto_label.py
```

---

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
  "class": "male",
  "images": [{"id": 1, "file_name": "/path/to/image.jpg"}],
  "annotations": [
    {"image_id": 1, "bbox": [x0, y0, x1, y1], "confidence": 0.95, "area": 1234}
  ]
}
```

For **posture/action recognition**, JSON includes:

```json
{
  "action": "running",
  "images": [{"id": 1, "file_name": "..."}],
  "annotations": [
    {
      "image_id": 1,
      "bbox": [x0, y0, x1, y1],
      "persons": [{"instance_id": 1, "keypoints": {"nose": [x,y], ...}}],
      "label": "person",
      "score": 0.98,
      "area": 4321
    }
  ]
}
```

---

## Development Notes

* **Routers** in `app/routers/` share a **cached RexOmniService instance**.
* Configure **model parameters**: AWQ quantization, cache dir, temperature, device.
* **FastAPI entry point**: `app/main.py`. Can run locally with:

```bash
python app/main.py
```

* Logs errors, skips **corrupt images**, and continues automatically.

---

## Posture/Action Recognition Test & Evaluation

* `PD_test.py` performs **HAR model evaluation** on test datasets.
* Computes: **accuracy, precision, recall, F1 per class**, confusion matrices, and top prediction probabilities.
* Generates plots:

  * Confusion Matrix
  * Precision/Recall/F1 per class
  * Prediction probability histogram
  * True vs predicted scatter

![Evaluation Example](https://github.com/alirzx/Auto-Labeling-Service-Based-on-RexOmni-Arcitecture-/blob/main/cafe_visualize.jpg?raw=true)

---

## Requirements

* Python 3.10+
* FastAPI, uvicorn
* Pillow, requests, numpy, tqdm
* Huggingface Hub
* Rex-Omni model package

**Recommended:** GPU for faster batch processing on large datasets.

---

## Best Practices

1. Organize datasets into **per-class folders**
2. Remove hidden/system files (`._*`)
3. Inspect visualizations to validate detection quality
4. Use smaller images if **GPU memory is limited**
5. Cache models locally to **avoid repeated downloads**
6. Resume labeling after API failures using **skip logic** in scripts

---

## Summary

Rex-Omni Auto-Labeling Service is a **production-ready pipeline** for automated computer vision labeling:

* ✅ Structured **JSON outputs**
* 🖼️ Annotated **visualizations**
* 🤖 Multi-task support for **object detection, keypoints, OCR, and visual prompting**
* 📈 Robust **batch processing with resume and retry logic**

Ideal for **research, dataset preparation, and production AI pipelines**.

---
