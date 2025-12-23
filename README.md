# Multi-task Automate Annotation Platform

![Project Banner](https://github.com/alirzx/Auto-Labeling-Service-Based-on-RexOmni-Arcitecture-/blob/main/rexomni_pic.png?raw=true)

---

# MultiModal Auto-Annotation Service

A **modular FastAPI service** leveraging the **Rex-Omni multimodal framework**, designed for **automated dataset labeling** across **14+ computer vision tasks**.

Supports **multi-model inference** via a **registry system**, allowing flexible selection between **RexOmni** and **Florence** models for different tasks.

**Key Supported Tasks:**

* **Object Detection** – generic objects, person, face, etc.
* **Visual Prompting** – guided detection via user-provided bounding boxes
* **Keypoint Estimation** – human pose, hand, face, animal
* **OCR** – configurable text detection and recognition
* **Region Proposal & Segmentation** – dense and categorical region labeling
* **Captioning & Grounded Captioning** – multi-granularity text description
* **Referring Expression Segmentation** – object identification via natural language
* **Action & Posture Recognition** – HAR and posture-based tasks

The service returns **annotated images** and **structured JSON**, suitable for **dataset bootstrapping, batch labeling pipelines, and interactive demos**.

---

## Features

* 🚀 **FastAPI app** with modular routers and OpenAPI documentation
* 🖼️ **Detection endpoint** streams annotated JPEGs and returns detection metadata in headers (`X-Rex-Detections`)
* 🔍 **Visual Prompting** supports bounding boxes for guided inference
* 🧍 **Keypoint Detection** supports human, hand, animal, and face landmarks
* 📝 **OCR** with configurable output format (`Box`/`Text`) and granularity (`Word`/`Line`)
* 🗂️ **Region Tasks** including region proposal, segmentation, category labeling, and dense captioning
* 🖊️ **Captioning Tasks** – standard, detailed, grounded, and phrase-level captions
* 🛠️ **Robust Auto-Labeling Scripts** for batch processing datasets with per-class JSON outputs
* ✅ **Health Endpoint** for API readiness and uptime checking
* 🎛️ **Multi-model Registry** allows task-to-model mapping between RexOmni and Florence

---

## Updated Project Structure

```
Auto-Labeling-Service-Based-on-RexOmni-Arcitecture/
├─ app/
│  ├─ main.py               # FastAPI entrypoint
│  ├─ dependencies.py       # Shared service instance
│  └─ routers/
│     ├─ detection.py
│     ├─ keypoint.py
│     ├─ ocr.py
│     ├─ visual_prompting.py
│     ├─ vision.py          # Unified task endpoint
│     └─ health.py
├─ inference/
│  ├─ rexomni/
│  │  ├─ rexomni_service.py
│  │  └─ __init__.py
│  ├─ florence/
│  │  ├─ florence_service.py
│  │  └─ __init__.py
│  ├─ registry/
│  │  ├─ base_adapter.py
│  │  ├─ florence_adapter.py
│  │  ├─ rexomni_adapter.py
│  │  ├─ model_registry.py
│  │  ├─ task_types.py
│  │  ├─ model_types.py
│  │  └─ __init__.py
│  └─ __init__.py
├─ label_testing_scripts/
├─ README.md
└─ requirements.txt
```

---

## Workflow Diagram

```text
           ┌───────────────────┐
           │   Input Dataset   │
           │  (images folder)  │
           └────────┬──────────┘
                    │
                    ▼
           ┌──────────────────────────┐
           │ FastAPI Auto-Labeling    │
           │ Service (Rex-Omni +     │
           │ Florence Models)         │
           └────────┬─────────┬──────┘
      ┌─────────────┴─────────┴─────────┐
      │                                 │
      ▼                                 ▼
┌───────────────┐                 ┌───────────────┐
│ JSON Outputs  │                 │ Annotated     │
│ per task      │                 │ Images w/ BBox│
└───────────────┘                 └───────────────┘
      │                                 │
      └───────────────┬─────────────────┘
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

**Recommended:** GPU/accelerator for faster batch processing.

---

### 2. Launch the API

```bash
python -m app.main
```

Access [http://localhost:6996/docs](http://localhost:6996/docs) for **interactive OpenAPI documentation**.

---

## API Overview

| Task                          | Endpoint            | Method | Description                                                            |
| ----------------------------- | ------------------- | ------ | ---------------------------------------------------------------------- |
| Health check                  | `/health`           | GET    | Lightweight uptime probe                                               |
| Object Detection              | `/detection`        | POST   | Annotated JPEGs + detection metadata in headers                        |
| OCR                           | `/ocr`              | POST   | Structured text extraction                                             |
| Keypoint Detection            | `/keypoint`         | POST   | Human, hand, face, animal landmarks                                    |
| Visual Prompting              | `/visual_prompting` | POST   | Accept `visual_prompt_boxes` JSON to guide detections                  |
| Unified Vision Endpoint       | `/vision`           | POST   | Handles all supported tasks & model selection                          |
| Captioning & Grounded Caption | `/vision`           | POST   | Integrated via the registry-based model selection                      |
| Region Tasks                  | `/vision`           | POST   | Region proposal, segmentation, dense captioning, and category labeling |

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

The service includes robust scripts for batch labeling:

* **Face Detection**: `face_auto_label.py`
* **Object Detection**: `object_auto_label.py`
* **Posture & Action Recognition**: `posture_auto_label_robust_fixed_v2.py`
* **Action Recognition Evaluation**: `PD_test.py`

**Script Features:**

* Resume after crashes (skip processed categories)
* Save **per-class JSON annotations** and visualized images
* Handles **API failures and retries**
* Supports **keypoints for persons** with robust mapping to full images
* Tracks **bbox, confidence, area**, and **per-instance keypoints**

---

### Output Example

```
auto_labeling_results/
    person/
        person.json
        vis_1.jpg
    dog/
        dog.json
        vis_1.jpg
```

**JSON structure per task:**

```json
{
  "task": "detection",
  "class": "person",
  "images": [{"id": 1, "file_name": "/path/to/image.jpg"}],
  "annotations": [
    {"image_id": 1, "bbox": [x0, y0, x1, y1], "confidence": 0.95, "area": 1234}
  ]
}
```

For **posture/action recognition**, JSON includes keypoints and actions:

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

* **Routers** in `app/routers/` share a **cached RexOmniService instance**
* **Multi-model registry** maps tasks to appropriate model adapters (`RexOmni` vs `Florence`)
* **Configurable model parameters:** AWQ quantization, cache directory, device selection
* **FastAPI entry point:** `app/main.py`
* Handles **corrupt images**, logs errors, and continues automatically

---

## Posture/Action Recognition Evaluation

* `PD_test.py` evaluates HAR tasks on test datasets
* Metrics: **accuracy, precision, recall, F1 per class**, confusion matrices, top prediction probabilities
* Visualizations:

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
* Rex-Omni and Florence model packages

**Recommended:** GPU for large batch processing

---

## Best Practices

1. Organize datasets into **per-class folders**
2. Remove hidden/system files (`._*`)
3. Validate detection quality via visualizations
4. Use smaller images for **GPU memory constraints**
5. Cache models locally to **avoid repeated downloads**
6. Resume labeling automatically after API failures

---

## Summary

Rex-Omni Auto-Labeling Service is a **production-ready multi-task pipeline** for automated computer vision labeling:

* ✅ Structured **JSON outputs**
* 🖼️ Annotated **visualizations**
* 🤖 Supports **14+ tasks** including detection, keypoints, OCR, visual prompting, captioning, and region tasks
* 📈 Robust **batch processing with retry/resume logic**
* 🔀 Flexible **multi-model registry** for task-to-model mapping

Ideal for **research, dataset preparation, and production AI pipelines**.

