from .base_adapter import BaseModelAdapter
from .task_types import TaskType
from inference.rexomni.rexomni_service import RexOmniService

class RexOmniAdapter(BaseModelAdapter):

    def __init__(self):
        self.service = RexOmniService()

    def supported_tasks(self):
        return {
            TaskType.DETECTION,
            TaskType.OCR,
            TaskType.VISUAL_PROMPTING,
            TaskType.KEYPOINT,
        }

    def run(self, task: TaskType, image_bytes: bytes, **kwargs):

        if task == TaskType.DETECTION:
            raw = self.service.run_detection(image_bytes, kwargs.get("categories"))
            return self.service.postprocess_detection(raw)

        if task == TaskType.OCR:
            raw = self.service.run_ocr(image_bytes)
            return self.service.postprocess_ocr(raw)

        if task == TaskType.VISUAL_PROMPTING:
            raw = self.service.run_visual_prompting(image_bytes, **kwargs)
            return self.service.postprocess_visual_prompting(raw)

        if task == TaskType.KEYPOINT:
            raw = self.service.run_keypoint(image_bytes)
            return self.service.postprocess_keypoint(raw)

        raise ValueError(f"Unsupported RexOmni task: {task}")
