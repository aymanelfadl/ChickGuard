import re
from dataclasses import dataclass
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import ALLOWED_IMAGE_TYPES, UPLOAD_DIR, UPLOAD_PATH_PREFIX
from app.schemas import IoTReadingCreate


SAFE_PATH_PART_PATTERN = re.compile(r"[^A-Za-z0-9_.-]+")


@dataclass(frozen=True)
class StoredImage:
    path: str
    absolute_path: Path
    filename: str
    content_type: str
    size_bytes: int


def validate_image_content_type(content_type: str | None) -> str:
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="image must be a JPEG or PNG file",
        )
    return ALLOWED_IMAGE_TYPES[content_type]


def safe_path_part(value: str, field_name: str) -> str:
    cleaned = SAFE_PATH_PART_PATTERN.sub("_", value).strip("._")
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} cannot be used as a safe file path value",
        )
    return cleaned[:120]


def generate_image_paths(payload: IoTReadingCreate, extension: str) -> tuple[Path, str, str]:
    device_id = safe_path_part(payload.device.device_id, "device.device_id")
    message_id = safe_path_part(payload.message_id, "message_id")
    reading_date = payload.timestamp.date().isoformat()
    filename = f"{message_id}.{extension}"

    absolute_directory = UPLOAD_DIR / device_id / reading_date
    absolute_path = absolute_directory / filename
    relative_path = f"{UPLOAD_PATH_PREFIX}/{device_id}/{reading_date}/{filename}"
    return absolute_path, relative_path, filename


def create_upload_directory(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def save_uploaded_image(image: UploadFile, payload: IoTReadingCreate) -> StoredImage:
    """
    Save poultry droppings image bytes on disk and return metadata for SQLite.

    Binary droppings images are stored outside SQLite so the database remains
    focused on queryable metadata while the filesystem handles larger files
    efficiently.
    """
    extension = validate_image_content_type(image.content_type)
    absolute_path, relative_path, filename = generate_image_paths(payload, extension)
    image_bytes = image.file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="image file is empty",
        )

    create_upload_directory(absolute_path)
    absolute_path.write_bytes(image_bytes)

    return StoredImage(
        path=relative_path,
        absolute_path=absolute_path,
        filename=filename,
        content_type=image.content_type or "",
        size_bytes=len(image_bytes),
    )
