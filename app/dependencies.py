"""Shared application dependencies."""
from functools import lru_cache

# Absolute import from project root
from inference.rexomni.rexomni_service import RexOmniService


@lru_cache(maxsize=1)
def get_rexomni_service() -> RexOmniService:
    """Return a single RexOmniService instance for reuse across requests."""
    return RexOmniService(
        model_path="IDEA-Research/Rex-Omni",
        use_awq=False,
        cache_dir=None,
    )


"""Shared application dependencies."""
from functools import lru_cache

from inference.florence.florence_service import Florence2InferenceService


@lru_cache(maxsize=1)
def get_florence_service() -> Florence2InferenceService:
    """
    Return a single Florence-2 service instance
    reused across all requests.
    """
    return Florence2InferenceService(
        model_name="microsoft/Florence-2-large",
        device="cuda",  # or "cpu" if needed
    )
