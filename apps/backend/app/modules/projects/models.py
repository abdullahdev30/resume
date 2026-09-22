from dataclasses import dataclass


@dataclass(frozen=True)
class ProjectModel:
    id: str
