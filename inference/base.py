"""Abstract interfaces for labeling-capable model services."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable, List, Optional, Set


class LabelingService(ABC):
    """Abstract base for any vision labeling backend."""

    name: str
    description: str
    capabilities: Set[str]

    def supports(self, task: str) -> bool:
        """Return True if the backend advertises support for a task."""

        return task in self.capabilities

    # ------------------- INFERENCE -------------------
    @abstractmethod
    def run_detection(
        self, image_bytes: bytes, categories: Optional[List[str]] = None
    ) -> Iterable:
        ...

    @abstractmethod
    def run_visual_prompting(
        self,
        image_bytes: bytes,
        visual_prompt_boxes: Optional[List[List[float]]] = None,
        categories: Optional[List[str]] = None,
    ) -> Iterable:
        ...

    @abstractmethod
    def run_keypoint(
        self,
        image_bytes: bytes,
        keypoint_type: str = "human_pose",
        categories: Optional[List[str]] = None,
    ) -> Iterable:
        ...

    @abstractmethod
    def run_ocr(
        self, image_bytes: bytes, ocr_output_format: str = "Box", ocr_granularity: str = "Word Level"
    ) -> Iterable:
        ...

    # ------------------- POSTPROCESS -------------------
    def postprocess_detection(self, raw_results):
        return raw_results

    def postprocess_visual_prompting(self, raw_results):
        return raw_results

    def postprocess_keypoint(self, raw_results):
        return raw_results

    # ------------------- DRAWING -------------------
    def draw_detections(self, image_bytes, results, return_pil=False, save_name="det_result.jpg"):
        raise NotImplementedError

    def draw_visual_prompting(self, image_bytes, results, save_name="visual_prompting_result.jpg"):
        raise NotImplementedError

    def draw_keypoints(self, image_bytes, results, save_name="keypoint_result.jpg"):
        raise NotImplementedError
