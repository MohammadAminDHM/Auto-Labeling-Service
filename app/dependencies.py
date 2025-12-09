"""Shared application dependencies."""
from functools import lru_cache

from inference.base import LabelingService
from inference.model_registry import ModelRegistry, registry
from inference.rexomni_service import RexOmniService


@lru_cache(maxsize=1)
def get_model_registry() -> ModelRegistry:
    """Expose a singleton registry so downstream routes can request any registered model."""

    if not registry.has("rex-omni"):
        registry.register(
            name="rex-omni",
            description="Default Rex-Omni multitask vision model",
            capabilities={"detection", "visual_prompting", "keypoint", "ocr"},
            factory=lambda: RexOmniService(
                model_path="IDEA-Research/Rex-Omni",
                use_awq=False,
                cache_dir=None,
            ),
        )
    return registry


def get_labeling_service(model_name: str) -> LabelingService:
    """Resolve a model by name from the registry for per-request routing."""

    return get_model_registry().get(model_name)
