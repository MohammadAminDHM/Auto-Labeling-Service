from .task_types import TaskType
from .model_types import ModelType
from .rexomni_adapter import RexOmniAdapter
from .florence_adapter import FlorenceAdapter

class ModelRegistry:

    def __init__(self):
        self.adapters = {
            ModelType.REXOMNI: RexOmniAdapter(),
            ModelType.FLORENCE: FlorenceAdapter(),
        }

        self.default_model = {
            TaskType.DETECTION: ModelType.REXOMNI,
            TaskType.OPEN_VOCAB_DETECTION: ModelType.FLORENCE,
            TaskType.OCR: ModelType.REXOMNI,
            TaskType.OCR_WITH_REGION: ModelType.FLORENCE,

            TaskType.VISUAL_PROMPTING: ModelType.REXOMNI,
            TaskType.KEYPOINT: ModelType.REXOMNI,

            # Florence-only
            TaskType.CAPTION: ModelType.FLORENCE,
            TaskType.CAPTION_DETAILED: ModelType.FLORENCE,
            TaskType.CAPTION_MORE_DETAILED: ModelType.FLORENCE,
            TaskType.CAPTION_GROUNDING: ModelType.FLORENCE,
            TaskType.CAPTION_GROUNDING_DETAILED: ModelType.FLORENCE,
            TaskType.CAPTION_GROUNDING_MORE_DETAILED: ModelType.FLORENCE,
            TaskType.CAPTION_TO_PHRASE_GROUNDING: ModelType.FLORENCE,
            TaskType.REFERRING_EXPRESSION_SEGMENTATION: ModelType.FLORENCE,
            TaskType.REGION_SEGMENTATION: ModelType.FLORENCE,
            TaskType.REGION_CATEGORY: ModelType.FLORENCE,
            TaskType.REGION_DESCRIPTION: ModelType.FLORENCE,
            TaskType.REGION_PROPOSAL: ModelType.FLORENCE,
            TaskType.DENSE_REGION_CAPTION: ModelType.FLORENCE,
        }

    def run(
        self,
        task: TaskType,
        image_bytes: bytes,
        model: ModelType | None = None,
        **kwargs
    ):
        model = model or self.default_model[task]
        adapter = self.adapters[model]

        if task not in adapter.supported_tasks():
            raise ValueError(f"{model} does not support {task}")

        return adapter.run(task, image_bytes, **kwargs)
