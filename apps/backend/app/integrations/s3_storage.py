# backend/app/integrations/s3_storage.py
import boto3
from fastapi import UploadFile
from app.core.config import settings

class S3StorageService:
    def __init__(self):
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=getattr(settings, "AWS_ACCESS_KEY_ID", ""),
            aws_secret_access_key=getattr(settings, "AWS_SECRET_ACCESS_KEY", ""),
            region_name=getattr(settings, "AWS_REGION", "us-east-1"),
        )
        self.bucket_name = getattr(settings, "AWS_S3_BUCKET_NAME", "")

    async def upload_file(self, file: UploadFile, folder: str = "general") -> str:
        file_path = f"{folder}/{file.filename}"
        self.s3_client.upload_fileobj(
            file.file,
            self.bucket_name,
            file_path,
            ExtraArgs={"ContentType": file.content_type}
        )
        region = getattr(settings, "AWS_REGION", "us-east-1")
        file_url = f"https://{self.bucket_name}.s3.{region}.amazonaws.com/{file_path}"
        return file_url