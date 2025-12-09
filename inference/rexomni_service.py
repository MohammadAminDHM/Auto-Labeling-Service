import io
import os
from typing import Dict, List, Optional

from huggingface_hub import snapshot_download
from PIL import Image, ImageDraw, ImageFont
from rex_omni import RexOmniWrapper

from inference.base import LabelingService

class RexOmniService(LabelingService):
    def __init__(
        self,
        model_path: str = "IDEA-Research/Rex-Omni",
        use_awq: bool = False,
        cache_dir: Optional[str] = None
    ):
        self.name = "rex-omni"
        self.description = "Generalist Rex-Omni multimodal vision model"
        self.capabilities = {"detection", "visual_prompting", "keypoint", "ocr"}

        if not cache_dir:
            cache_dir = os.path.join(os.path.expanduser("~"), ".cache", "huggingface")
        self.cache_dir = cache_dir
        os.makedirs(self.cache_dir, exist_ok=True)

        if os.path.isdir(model_path) and os.path.exists(model_path):
            local_model_path = model_path
        else:
            local_model_path = snapshot_download(
                repo_id=model_path,
                repo_type="model",
                cache_dir=self.cache_dir,
                local_files_only=False
            )

        backend = "vllm" if use_awq else "transformers"
        kwargs = dict(
            model_path=local_model_path,
            backend=backend,
            max_tokens=2048,
            temperature=0.0,
            top_p=0.05,
            top_k=1,
            repetition_penalty=1.05,
        )
        if use_awq:
            kwargs["quantization"] = "awq"

        self.model = RexOmniWrapper(**kwargs)
        self.output_dir = os.getcwd()

    # ------------------- INFERENCE -------------------

    def run_detection(self, image_bytes: bytes, categories: Optional[List[str]] = None):
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return self.model.inference(images=image, task="detection", categories=categories or [])

    def run_visual_prompting(
        self, 
        image_bytes: bytes, 
        visual_prompt_boxes: Optional[List[List[float]]] = None,
        categories: Optional[List[str]] = None
    ):
        # Open image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Run Rex-Omni inference
        return self.model.inference(
            images=image,
            task="visual_prompting",
            visual_prompt_boxes=visual_prompt_boxes or [],
            categories=categories or [],
            image_width=image.width,
            image_height=image.height
        )



    def run_keypoint(self, image_bytes: bytes, keypoint_type: str = "human_pose", categories: Optional[List[str]] = None):
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        if not categories:
            if keypoint_type == "human_pose":
                categories = ["person"]
            elif keypoint_type == "hand":
                categories = ["hand"]
            elif keypoint_type == "animal":
                categories = ["animal"]
        return self.model.inference(
            images=image,
            task="keypoint",
            keypoint_type=keypoint_type,
            categories=categories
        )

    def run_ocr(self, image_bytes: bytes, ocr_output_format: str = "Box", ocr_granularity: str = "Word Level"):
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return self.model.inference(
            images=image,
            task="ocr_box",
            ocr_output_format=ocr_output_format,
            ocr_granularity=ocr_granularity
        )

    # ------------------- POSTPROCESS -------------------

    def postprocess_detection(self, raw_results):
        processed = []
        for item in raw_results:
            predictions = item.get("extracted_predictions", {})
            for label, objs in predictions.items():
                for obj in objs:
                    if obj.get("type") == "box" and "coords" in obj:
                        processed.append({
                            "label": label,
                            "bbox": obj["coords"],
                            "score": 1.0
                        })
        return processed

    def postprocess_visual_prompting(self, raw_results):
        # Same format as detection
        processed = []
        for item in raw_results:
            predictions = item.get("extracted_predictions", {})
            for label, objs in predictions.items():
                for obj in objs:
                    if obj.get("type") == "box" and "coords" in obj:
                        processed.append({
                            "label": label,
                            "bbox": obj["coords"],
                            "score": 1.0
                        })
        return processed

    def postprocess_keypoint(self, raw_results):
        """
        Extract keypoints and bbox for keypoint task
        Output format: [{"label": <category>, "bbox": [...], "keypoints": {...}}, ...]
        """
        processed = []
        for item in raw_results:
            predictions = item.get("extracted_predictions", {})
            for label, objs in predictions.items():
                for obj in objs:
                    if obj.get("type") == "keypoint":
                        processed.append({
                            "label": label,
                            "bbox": obj.get("bbox", []),
                            "keypoints": obj.get("keypoints", {}),
                            "score": 1.0
                        })
        return processed

    # ------------------- DRAWING -------------------

    def draw_detections(self, image_bytes, results, return_pil=False, save_name="det_result.jpg"):
        from PIL import Image, ImageDraw

        # Load image
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        draw = ImageDraw.Draw(img)

        # Draw boxes
        for obj in results:
            bbox = obj["bbox"]
            label = obj["label"]
            score = obj["score"]

            draw.rectangle(bbox, outline="red", width=3)
            draw.text((bbox[0], bbox[1]), f"{label} {score:.2f}", fill="red")

        # -- case 1: return PIL image to client
        if return_pil:
            return img

        # -- case 2: original server-local saving (fallback)
        save_path = os.path.join(self.output_dir, save_name)
        img.save(save_path)
        return save_path


    def draw_keypoints(self, image_bytes, results, save_name="keypoint_result.jpg"):
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        draw = ImageDraw.Draw(image)
        try:
            font = ImageFont.load_default()
        except:
            font = None

        for obj in results:
            bbox = obj.get("bbox", [])
            keypoints = obj.get("keypoints", {})
            label = obj.get("label", "unknown")
            score = obj.get("score", 0)

            # Draw bbox
            if bbox and len(bbox) == 4:
                x0, y0, x1, y1 = bbox
                draw.rectangle([x0, y0, x1, y1], outline="blue", width=2)
                text = f"{label}: {score:.2f}"
                if font:
                    draw.text((x0, y0-10), text, fill="blue", font=font)
                else:
                    draw.text((x0, y0-10), text, fill="blue")

            # Draw keypoints
            for kp_name, coords in keypoints.items():
                if isinstance(coords, (list, tuple)) and len(coords) == 2:
                    x, y = coords
                    r = 3
                    draw.ellipse([x-r, y-r, x+r, y+r], fill="green", outline="green")
                    if font:
                        draw.text((x+5, y-5), kp_name, fill="green", font=font)
                    else:
                        draw.text((x+5, y-5), kp_name, fill="green")

        save_path = os.path.join(os.getcwd(), save_name)
        image.save(save_path)
        return save_path

    # Visual Prompting uses same draw method as detection
    draw_visual_prompting = draw_detections
