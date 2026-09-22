from dataclasses import dataclass


@dataclass(frozen=True)
class CertificateModel:
    id: str
