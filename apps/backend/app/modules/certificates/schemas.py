from pydantic import BaseModel


class CertificateResponse(BaseModel):
    id: str
