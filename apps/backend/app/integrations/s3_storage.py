# backend/app/integrations/s3_storage.py
import logging
from io import BytesIO
from typing import Any, BinaryIO

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import UploadFile
from starlette.concurrency import run_in_threadpool

from app.core.config import settings

logger = logging.getLogger(__name__)

PDF_CONTENT_TYPE = "application/pdf"


class S3StorageError(Exception):
    """Raised when a Supabase Storage (S3-compatible) operation fails."""


class S3StorageService:
    """S3-compatible client for Supabase Storage.

    Credentials, endpoint and bucket come from configuration and are never
    exposed to callers. The ``resumes`` bucket is private, so downloaded files
    are served through short-lived pre-signed URLs only.
    """

    def __init__(self, bucket_name: str | None = None) -> None:
        self.bucket_name = bucket_name or settings.aws_s3_bucket_name
        self._client: Any | None = None

    @property
    def client(self) -> Any:
        if self._client is None:
            self._client = boto3.client(
                "s3",
                endpoint_url=self.endpoint_url,
                aws_access_key_id=settings.aws_access_key_id or None,
                aws_secret_access_key=settings.aws_secret_access_key or None,
                region_name=settings.aws_region,
                config=Config(
                    signature_version="s3v4",
                    s3={"addressing_style": "path"},
                ),
            )
        return self._client

    @property
    def endpoint_url(self) -> str | None:
        """Supabase Storage S3 endpoint.

        Falls back to the Supabase project URL, which exposes the S3-compatible
        API under ``/storage/v1/s3``. Never leave this unset, otherwise boto3
        would silently fall back to the public AWS S3 endpoints.
        """
        if settings.supabase_s3_endpoint:
            return settings.supabase_s3_endpoint
        base = settings.supabase_url.rstrip("/")
        return f"{base}/storage/v1/s3"

    async def upload_file(self, file: UploadFile, folder: str = "general") -> str:
        """Upload an ``UploadFile`` and return a stable object URL."""
        file_path = f"{folder}/{file.filename}"
        await run_in_threadpool(
            self._upload_stream,
            file.file,
            file_path,
            file.content_type or PDF_CONTENT_TYPE,
        )
        return (
            f"https://{self.bucket_name}.s3.{settings.aws_region}"
            f".amazonaws.com/{file_path}"
        )

    async def upload_bytes(
        self,
        storage_path: str,
        data: bytes,
        content_type: str = PDF_CONTENT_TYPE,
    ) -> None:
        """Upload raw bytes to an exact storage path, replacing it if present."""
        try:
            await run_in_threadpool(
                self._upload_bytes,
                storage_path,
                data,
                content_type,
            )
        except (BotoCoreError, ClientError) as exc:
            logger.exception("Storage upload failed for object '%s'", storage_path)
            raise S3StorageError("Unable to upload the storage object.") from exc

    async def delete_object(self, storage_path: str) -> None:
        """Delete an object. Deleting an already missing object is a no-op."""
        try:
            await run_in_threadpool(self._delete_object, storage_path)
        except (BotoCoreError, ClientError) as exc:
            logger.exception("Storage delete failed for object '%s'", storage_path)
            raise S3StorageError("Unable to delete the storage object.") from exc

    def generate_signed_url(
        self,
        storage_path: str,
        expires_in: int | None = None,
    ) -> str:
        """Create a short-lived pre-signed URL for a private object."""
        try:
            return self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": storage_path},
                ExpiresIn=(
                    expires_in or settings.resume_signed_url_expires_in_seconds
                ),
            )
        except (BotoCoreError, ClientError, ValueError) as exc:
            logger.exception("Storage signing failed for object '%s'", storage_path)
            raise S3StorageError("Unable to create a download link.") from exc

    def _upload_stream(
        self,
        stream: BinaryIO,
        key: str,
        content_type: str,
    ) -> None:
        self.client.upload_fileobj(
            stream,
            self.bucket_name,
            key,
            ExtraArgs={"ContentType": content_type},
        )

    def _upload_bytes(self, key: str, data: bytes, content_type: str) -> None:
        self._upload_stream(BytesIO(data), key, content_type)

    def _delete_object(self, key: str) -> None:
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=key)
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code")
            if code in {"404", "NoSuchKey", "NotFound"}:
                return
            raise
