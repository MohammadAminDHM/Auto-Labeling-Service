from abc import ABC, abstractmethod
from typing import Dict, Any
from .task_types import TaskType

class BaseModelAdapter(ABC):

    @abstractmethod
    def supported_tasks(self) -> set[TaskType]:
        pass

    @abstractmethod
    def run(
        self,
        task: TaskType,
        image_bytes: bytes,
        **kwargs
    ) -> Dict[str, Any]:
        pass
