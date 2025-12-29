from .task_types import TaskType
from .model_types import ModelType
from .rexomni_adapter import RexOmniAdapter
from .florence_adapter import FlorenceAdapter

# Define which inputs each task requires
TASK_INPUTS = {
    TaskType.DETECTION: ["categories"],
    TaskType.OPEN_VOCAB_DETECTION: ["categories"],
    TaskType.OCR: [],
    TaskType.OCR_WITH_REGION: [],
    TaskType.VISUAL_PROMPTING: ["visual_prompt_boxes"],
    TaskType.KEYPOINT: [],
    TaskType.CAPTION: ["text_input"],
    TaskType.CAPTION_DETAILED: ["text_input"],
    TaskType.CAPTION_MORE_DETAILED: ["text_input"],
    TaskType.CAPTION_GROUNDING: ["text_input"],
    TaskType.CAPTION_GROUNDING_DETAILED: ["text_input"],
    TaskType.CAPTION_GROUNDING_MORE_DETAILED: ["text_input"],
    TaskType.CAPTION_TO_PHRASE_GROUNDING: ["text_input"],
    TaskType.REFERRING_EXPRESSION_SEGMENTATION: ["text_input"],
    TaskType.REGION_SEGMENTATION: [],
    TaskType.REGION_CATEGORY: ["text_input"],
    TaskType.REGION_DESCRIPTION: ["text_input"],
    TaskType.REGION_PROPOSAL: [],
    TaskType.DENSE_REGION_CAPTION: [],
}

class ModelRegistry:

    def __init__(self):
        self.adapters = {
            #ModelType.REXOMNI: RexOmniAdapter(),
            ModelType.FLORENCE: FlorenceAdapter(),
        }

        self.default_model = {
            TaskType.DETECTION: ModelType.FLORENCE,
            TaskType.OPEN_VOCAB_DETECTION: ModelType.FLORENCE,
            TaskType.OCR: ModelType.REXOMNI,
            TaskType.OCR_WITH_REGION: ModelType.FLORENCE,
            TaskType.VISUAL_PROMPTING: ModelType.REXOMNI,
            TaskType.KEYPOINT: ModelType.REXOMNI,
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

    def run(self, task: TaskType, image_bytes: bytes, model: ModelType | None = None, **kwargs):
        model = model or self.default_model.get(task)
        if not model or model not in self.adapters:
            raise ValueError(f"No adapter found for model {model}")

        adapter = self.adapters[model]

        if task not in adapter.supported_tasks():
            raise ValueError(f"{model} does not support task {task}")

        return adapter.run(task, image_bytes, **kwargs)

    def get_task_config(self, task: TaskType):
        """
        Returns:
        - allowed_models: set of ModelType
        - required_args: list of strings (e.g., text_input, categories)
        """
        allowed_models = {m for m, adapter in self.adapters.items() if task in adapter.supported_tasks()}
        required_args = TASK_INPUTS.get(task, [])
        return allowed_models, required_args
