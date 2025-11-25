from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from typing import List, Optional
from inference.rexomni_service import RexOmniService
from fastapi.responses import JSONResponse

app = FastAPI(
    title="Rex-Omni API",
    description="Multi-task inference API for Rex-Omni (Detection, OCR, Keypoint, Visual Prompting, etc.)",
    version="1.0"
)

# -----------------------------------------------------------
#  SERVICE INSTANCE
# -----------------------------------------------------------
service = RexOmniService(
    model_path="IDEA-Research/Rex-Omni",
    use_awq=False,
    cache_dir=None       # Auto cache
)

# ===========================================================
#   DETECTION ENDPOINT
# ===========================================================
"""
📌 DETECTION
Purpose: Detect objects in an image

INPUT:
- file: Image file (jpg, png, etc.)
- categories: List of categories to detect, e.g. ["person", "car"]

FORMAT:
- Pass multiple categories using repeated form fields:
    -F "categories=person" -F "categories=car"

OUTPUT:
- JSON containing:
    - label: detected class
    - bbox: [x0, y0, x1, y1]
    - score: confidence
- drawn_image_path: path to image annotated with bounding boxes
"""
from fastapi.responses import StreamingResponse
import io
import json

@app.post("/detection")
async def detection(
    file: UploadFile = File(...),
    categories: Optional[List[str]] = Form(default=[])
):
    try:
        # -------------------------------------------------------
        # Read file
        # -------------------------------------------------------
        image_bytes = await file.read()

        # -------------------------------------------------------
        # Run inference
        # -------------------------------------------------------
        raw_results = service.run_detection(
            image_bytes,
            categories=categories
        )
        results = service.postprocess_detection(raw_results)

        # -------------------------------------------------------
        # Draw bbox image (BUT do NOT save on server)
        # -------------------------------------------------------
        drawn_pil = service.draw_detections(
            image_bytes,
            results,
            return_pil=True          # <- you must update your draw fn
        )

        # Convert PIL → bytes
        img_buffer = io.BytesIO()
        drawn_pil.save(img_buffer, format="JPEG")
        img_buffer.seek(0)

        # -------------------------------------------------------
        # Return streaming image + metadata header
        # -------------------------------------------------------
        return StreamingResponse(
            img_buffer,
            media_type="image/jpeg",
            headers={
                "X-Rex-Detections": json.dumps(results)
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ===========================================================
#   OCR ENDPOINT
# ===========================================================
"""
📌 OCR
Purpose: Extract text from an image

INPUT:
- file: Image file
- ocr_output_format: "Box" (bounding boxes) or "Text" (plain text)
- ocr_granularity: "Word Level" or "Line Level"

OUTPUT:
- JSON containing recognized text and bounding boxes if requested
"""
@app.post("/ocr")
async def ocr(
    file: UploadFile = File(...),
    ocr_output_format: str = Form("Box"),
    ocr_granularity: str = Form("Word Level")
):
    try:
        image_bytes = await file.read()
        results = service.run_ocr(
            image_bytes,
            ocr_output_format=ocr_output_format,
            ocr_granularity=ocr_granularity
        )
        return {"task": "OCR", "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===========================================================
#   KEYPOINT ENDPOINT
# ===========================================================
"""
📌 KEYPOINT
Purpose: Detect keypoints, e.g., human pose

INPUT:
- file: Image file
- keypoint_type: "human_pose", "face", or "hand"

OUTPUT:
- JSON containing keypoints coordinates for the selected type
"""
@app.post("/keypoint")
async def keypoint(
    file: UploadFile = File(...),
    keypoint_type: str = Form("human_pose"),
    categories: Optional[List[str]] = Form(None)
):
    try:
        image_bytes = await file.read()
        # Set default categories if not provided
        if not categories:
            if keypoint_type == "human_pose":
                categories = ["person"]
            elif keypoint_type == "hand":
                categories = ["hand"]
            elif keypoint_type == "animal":
                categories = ["animal"]
        results = service.run_keypoint(image_bytes, keypoint_type=keypoint_type, categories=categories)
        return {"task": "Keypoint", "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===========================================================
#   VISUAL PROMPTING ENDPOINT
# ===========================================================
"""
📌 VISUAL PROMPTING
Purpose: Guide the model with user-defined regions (prompts)

INPUT:
- file: Image file
- visual_prompt_boxes: JSON string of boxes
    Example:
        "[[x0, y0, x1, y1], [x0, y0, x1, y1]]"
    Each box is a list of 4 floats representing top-left and bottom-right corners

OUTPUT:
- JSON with task results
"""
@app.post("/visual_prompting")
async def visual_prompting(
    file: UploadFile = File(...),
    visual_prompt_boxes: Optional[str] = Form("[]"),
    categories: Optional[List[str]] = Form(None)
):
    import json
    try:
        image_bytes = await file.read()
        boxes = json.loads(visual_prompt_boxes)
        if not all(isinstance(b, list) and len(b) == 4 for b in boxes):
            raise HTTPException(status_code=400, detail="Each visual_prompt_box must be [x0, y0, x1, y1]")
        
        # Inference
        results = service.run_visual_prompting(
            image_bytes=image_bytes,
            visual_prompt_boxes=boxes,
            categories=categories
        )
        
        # Postprocess & Draw
        processed_results = service.postprocess_visual_prompting(results)
        drawn_image_path = service.draw_visual_prompting(
            image_bytes=image_bytes,
            results=processed_results,
            save_name="visual_prompting_result.jpg"
        )
        
        return {
            "task": "Visual Prompting",
            "results": processed_results,
            "drawn_image_path": drawn_image_path
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="visual_prompt_boxes must be valid JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===========================================================
#   HEALTH CHECK
# ===========================================================
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Rex-Omni API running successfully 🚀"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=6996, reload=True)