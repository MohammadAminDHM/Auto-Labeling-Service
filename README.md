# Auto Labeling Service (Rex-Omni)

A structured FastAPI service that wraps the **Rex-Omni** multimodal model for automated image labeling tasks including object detection, visual prompting, keypoint estimation, and OCR. The API streams visualizations, returns structured JSON, and can be used for rapid dataset bootstrapping or interactive demos. The service now includes a **model registry** so you can add new multimodal models and route requests to them with a single hub.

## Features
- 🚀 **FastAPI** application with modular routers and automatic OpenAPI docs.
- 🧠 **Model hub** with registry at `/models` and per-request `model_name` selection.
- 🖼️ **Detection** endpoint streams annotated JPEGs with detection metadata in headers.
- 🔍 **Visual prompting** to guide detections with user-provided bounding boxes.
- 🧍 **Keypoint** support for human pose, hand, and animal landmarks.
- 📝 **OCR** with configurable output format and granularity.
- ✅ **Health** probe for readiness checks.

## Quickstart
1. Install dependencies (ensure GPU/accelerator drivers where appropriate):
   ```bash
   pip install -r requirements.txt
   ```
2. Launch the API:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 6996 --reload
   ```
3. Open the interactive docs at `http://localhost:6996/docs`.

## API Overview
| Task | Endpoint | Method | Notes |
| --- | --- | --- | --- |
| Health check | `/health` | GET | Lightweight uptime probe |
| Model registry | `/models` | GET | Enumerate registered models and capabilities |
| Detection | `/detection` | POST | Multipart upload; returns annotated JPEG stream with `X-Rex-Detections` header |
| OCR | `/ocr` | POST | Returns structured OCR output |
| Keypoint | `/keypoint` | POST | Supports `human_pose`, `hand`, `animal` types |
| Visual prompting | `/visual_prompting` | POST | Accepts `visual_prompt_boxes` JSON array |

### Example: Object Detection (cURL)
```bash
curl -X POST "http://localhost:6996/detection" \
  -F "file=@/path/to/image.jpg" \
  -F "categories=person" \
  -F "model_name=rex-omni" \
  -o annotated.jpg -D headers.txt
```
The annotated image is saved to `annotated.jpg`. Parsed detections are available in `headers.txt` under the `X-Rex-Detections` header.

## Auto-Labeling Script
`app/auto_label.py` demonstrates how to batch images against the detection endpoint and persist per-class JSON summaries. Update `API_URL`, `OUTPUT_DIR`, and `DATASET_DIR` to match your environment before running the script. Set `MODEL_NAME` in the environment if you want to target a specific registered model.

## Model hub basics
- Discover models and their supported tasks: `GET /models`
- Target a model on any task route by adding a `model_name` form field (default: `rex-omni`).
- Add a new model by registering it inside `app/dependencies.py` via the `ModelRegistry` or by creating a new adapter that implements `inference.base.LabelingService`.

## TODO
- Add adapters for popular detectors (e.g., Grounding DINO, YOLO World) and OCR engines.
- Expose per-model configuration via environment variables and OpenAPI enums.
- Persist model registry configuration to disk for dynamic reloads.
- Add authentication and rate limiting ahead of wider hub adoption.

## Development Notes
- Routers live in `app/routers/` and resolve models through the shared `ModelRegistry` in `app/dependencies.py`.
- Add new adapters under `inference/` that implement `LabelingService` and register them in the registry factory.
- The FastAPI entrypoint remains `app/main.py`; local execution via `python app/main.py` is supported for convenience.
