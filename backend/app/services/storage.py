"""Object storage for property media (S3-compatible).

Issues short-lived **presigned PUT URLs** so clients upload large property
photos directly to the bucket/CDN — never proxied through the API. The public
URL of the uploaded object is returned so it can be persisted on the property.

``boto3`` is imported lazily, so the rest of the API runs (and tests pass)
without the dependency or any storage configuration; the upload endpoints
simply report 503 until storage is configured.
"""

import uuid
from dataclasses import dataclass

from app.core.config import settings

# Allow-list of image content types we will hand out upload URLs for.
ALLOWED_CONTENT_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
}


class StorageNotConfiguredError(RuntimeError):
    pass


class UnsupportedMediaTypeError(ValueError):
    pass


@dataclass
class PresignedUpload:
    upload_url: str
    public_url: str
    key: str
    expires_in: int


class StorageService:
    def is_configured(self) -> bool:
        return settings.storage_enabled

    def build_key(self, organization_id: str, property_id: str, content_type: str) -> str:
        ext = ALLOWED_CONTENT_TYPES.get(content_type)
        if ext is None:
            raise UnsupportedMediaTypeError(content_type)
        return f"orgs/{organization_id}/properties/{property_id}/{uuid.uuid4().hex}.{ext}"

    def public_url(self, key: str) -> str:
        if settings.s3_public_base_url:
            return f"{settings.s3_public_base_url.rstrip('/')}/{key}"
        if settings.s3_endpoint_url:
            return f"{settings.s3_endpoint_url.rstrip('/')}/{settings.s3_bucket}/{key}"
        return f"https://{settings.s3_bucket}.s3.{settings.s3_region}.amazonaws.com/{key}"

    def create_presigned_upload(
        self, organization_id: str, property_id: str, content_type: str
    ) -> PresignedUpload:
        if not self.is_configured():
            raise StorageNotConfiguredError("Object storage is not configured")
        try:
            import boto3  # lazy import; only needed when storage is configured
        except ImportError as exc:  # pragma: no cover - depends on deploy env
            raise StorageNotConfiguredError("boto3 is not installed") from exc

        key = self.build_key(organization_id, property_id, content_type)
        client = boto3.client(
            "s3",
            region_name=settings.s3_region,
            endpoint_url=settings.s3_endpoint_url,
            aws_access_key_id=settings.s3_access_key_id,
            aws_secret_access_key=settings.s3_secret_access_key,
        )
        upload_url = client.generate_presigned_url(
            "put_object",
            Params={"Bucket": settings.s3_bucket, "Key": key, "ContentType": content_type},
            ExpiresIn=settings.upload_url_expiry_seconds,
        )
        return PresignedUpload(
            upload_url=upload_url,
            public_url=self.public_url(key),
            key=key,
            expires_in=settings.upload_url_expiry_seconds,
        )


storage_service = StorageService()
