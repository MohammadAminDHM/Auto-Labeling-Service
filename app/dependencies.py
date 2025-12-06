"""Shared application dependencies."""
from functools import lru_cache

from inference.rexomni_service import RexOmniService


@lru_cache(maxsize=1)
def get_rexomni_service() -> RexOmniService:
    """Return a single RexOmniService instance for reuse across requests."""
    return RexOmniService(
        model_path="IDEA-Research/Rex-Omni",
        use_awq=False,
        cache_dir=None,
    )
