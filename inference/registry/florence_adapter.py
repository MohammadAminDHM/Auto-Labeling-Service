from .base_adapter import BaseModelAdapter
from .task_types import TaskType
from inference.florence.florence_service import Florence2InferenceService

TASK_MAP = {
    TaskType.DETECTION: "Object Detection",
    TaskType.OPEN_VOCAB_DETECTION: "Open Vocabulary Detection",

    TaskType.OCR: "OCR",
    TaskType.OCR_WITH_REGION: "OCR with Region",

    TaskType.CAPTION: "Caption",
    TaskType.CAPTION_DETAILED: "Detailed Caption",
    TaskType.CAPTION_MORE_DETAILED: "More Detailed Caption",

    TaskType.CAPTION_GROUNDING: "Caption + Grounding",
    TaskType.CAPTION_GROUNDING_DETAILED: "Detailed Caption + Grounding",
    TaskType.CAPTION_GROUNDING_MORE_DETAILED: "More Detailed Caption + Grounding",
    TaskType.CAPTION_TO_PHRASE_GROUNDING: "Caption to Phrase Grounding",

    TaskType.REFERRING_EXPRESSION_SEGMENTATION: "Referring Expression Segmentation",
    TaskType.REGION_SEGMENTATION: "Region to Segmentation",

    TaskType.REGION_CATEGORY: "Region to Category",
    TaskType.REGION_DESCRIPTION: "Region to Description",
    TaskType.REGION_PROPOSAL: "Region Proposal",
    TaskType.DENSE_REGION_CAPTION: "Dense Region Caption",
}

class FlorenceAdapter(BaseModelAdapter):

    def __init__(self):
        self.service = Florence2InferenceService()

    def supported_tasks(self):
        return set(TASK_MAP.keys())

    def run(self, task: TaskType, image_bytes: bytes, **kwargs):
        return self.service.run_task_from_bytes(
            image_bytes=image_bytes,
            task_name=TASK_MAP[task],
            text_input=kwargs.get("text_input"),
            visualize=kwargs.get("visualize", True)
        )
