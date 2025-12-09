"""Lightweight registry to expose multiple labeling backends behind a single hub."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Dict, Iterable, List, Optional, Set

from inference.base import LabelingService


@dataclass
class ModelCard:
    name: str
    description: str
    capabilities: Set[str]
    factory: Callable[[], LabelingService]
    instance: Optional[LabelingService] = field(default=None, repr=False)


class ModelRegistry:
    def __init__(self):
        self._models: Dict[str, ModelCard] = {}

    def register(
        self,
        name: str,
        description: str,
        capabilities: Iterable[str],
        factory: Callable[[], LabelingService],
    ) -> None:
        self._models[name] = ModelCard(
            name=name,
            description=description,
            capabilities=set(capabilities),
            factory=factory,
        )

    def get(self, name: str) -> LabelingService:
        if name not in self._models:
            raise KeyError(f"Unknown model '{name}'. Available models: {', '.join(self._models.keys()) or 'none'}")

        card = self._models[name]
        if card.instance is None:
            card.instance = card.factory()
        return card.instance

    def list_models(self) -> List[dict]:
        return [
            {
                "name": card.name,
                "description": card.description,
                "capabilities": sorted(card.capabilities),
            }
            for card in self._models.values()
        ]

    def has(self, name: str) -> bool:
        return name in self._models


registry = ModelRegistry()
