from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy import or_
from sqlalchemy.orm import Session
from starlette.responses import FileResponse

from app import models
from app.ai_model.labels import LABEL_DISPLAY_NAMES
from app.config import DEFAULT_LIMIT, MAX_LIMIT, UPLOAD_DIR, UPLOAD_PATH_PREFIX
from app.database import get_db
from app.services.auth_service import bearer_scheme, decode_access_token
from app.services.farm_management_service import alert_dict, format_utc, latest_sensor_dict


router = APIRouter(prefix="/api/image-gallery", tags=["image-gallery"])


def authenticate_gallery_user(
    token: str | None,
    credentials: HTTPAuthorizationCredentials | None,
    db: Session,
) -> models.User:
    raw_token = credentials.credentials if credentials and credentials.scheme.lower() == "bearer" else token
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(raw_token)
        email = payload.get("sub")
    except JWTError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")
    return user


def require_gallery_user(
    token: str | None = Query(default=None),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    return authenticate_gallery_user(token, credentials, db)


def farm_for_reading(db: Session, reading: models.ImageReading) -> models.Farm | None:
    farm = None
    if reading.farm_id.isdigit():
        farm = db.query(models.Farm).filter(models.Farm.id == int(reading.farm_id)).first()
    return farm or db.query(models.Farm).filter(models.Farm.name == reading.farm_id).first()


def coop_for_reading(
    db: Session,
    reading: models.ImageReading,
    farm: models.Farm | None,
) -> models.Coop | None:
    coop = None
    if reading.coop_id.isdigit():
        coop = db.query(models.Coop).filter(models.Coop.id == int(reading.coop_id)).first()
    if coop:
        return coop
    query = db.query(models.Coop).filter(models.Coop.name == reading.coop_id)
    if farm:
        query = query.filter(models.Coop.farm_id == farm.id)
    return query.first()


def image_url(reading_id: int) -> str:
    return f"/api/image-gallery/{reading_id}/image"


def farm_filter_values(db: Session, farm_id: str) -> list[str]:
    values = {farm_id}
    farm = None
    if farm_id.isdigit():
        farm = db.query(models.Farm).filter(models.Farm.id == int(farm_id)).first()
    if not farm:
        farm = db.query(models.Farm).filter(models.Farm.name == farm_id).first()
    if farm:
        values.add(farm.name)
        values.add(str(farm.id))
    return list(values)


def coop_filter_values(db: Session, coop_id: str) -> list[str]:
    values = {coop_id}
    coop = None
    if coop_id.isdigit():
        coop = db.query(models.Coop).filter(models.Coop.id == int(coop_id)).first()
    if not coop:
        coop = db.query(models.Coop).filter(models.Coop.name == coop_id).first()
    if coop:
        values.add(coop.name)
        values.add(str(coop.id))
    return list(values)


def gallery_item(db: Session, reading: models.ImageReading) -> dict:
    farm = farm_for_reading(db, reading)
    coop = coop_for_reading(db, reading, farm)
    camera = db.query(models.CameraDevice).filter(models.CameraDevice.device_id == reading.device_id).first()
    device = db.query(models.Device).filter(models.Device.device_id == reading.device_id).first()
    disease_display_name = (
        LABEL_DISPLAY_NAMES.get(reading.raw_label)
        if reading.raw_label
        else reading.disease_type
    )

    return {
        "id": reading.id,
        "image_url": image_url(reading.id),
        "image_filename": reading.image_filename,
        "image_path": reading.image_path,
        "farm_id": reading.farm_id,
        "farm_name": farm.name if farm else reading.farm_id,
        "farm_record_id": farm.id if farm else None,
        "coop_id": reading.coop_id,
        "coop_name": coop.name if coop else reading.coop_id,
        "coop_record_id": coop.id if coop else None,
        "device_id": reading.device_id,
        "device_name": camera.name if camera else reading.device_id,
        "device_type": reading.device_type or (device.device_type if device else None),
        "camera_type": camera.device_type if camera else reading.device_type,
        "prediction_status": reading.prediction_status,
        "disease_type": reading.disease_type,
        "disease_display_name": disease_display_name or reading.disease_type,
        "raw_label": reading.raw_label,
        "confidence": reading.confidence,
        "captured_at": format_utc(reading.timestamp),
        "created_at": format_utc(reading.created_at),
    }


def resolve_upload_path(reading: models.ImageReading) -> Path:
    uploads_root = UPLOAD_DIR.resolve()
    stored_path = Path(reading.image_path)
    if stored_path.is_absolute():
        candidate = stored_path.resolve()
    else:
        parts = stored_path.parts
        if parts and parts[0] == UPLOAD_PATH_PREFIX:
            relative_path = Path(*parts[1:])
        else:
            relative_path = stored_path
        if any(part == ".." for part in relative_path.parts):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
        candidate = (uploads_root / relative_path).resolve()

    if not candidate.is_relative_to(uploads_root):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    if not candidate.exists() or not candidate.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image file not found")
    return candidate


def nearest_sensor_snapshot(db: Session, reading: models.ImageReading) -> dict | None:
    candidates = (
        db.query(models.IoTReading)
        .filter(
            models.IoTReading.device_id == reading.device_id,
            models.IoTReading.farm_id == reading.farm_id,
            models.IoTReading.coop_id == reading.coop_id,
        )
        .order_by(models.IoTReading.timestamp.desc())
        .limit(50)
        .all()
    )
    if not candidates:
        return None

    reading_time = reading.timestamp
    if reading_time.tzinfo is None:
        reading_time = reading_time.replace(tzinfo=timezone.utc)
    else:
        reading_time = reading_time.astimezone(timezone.utc)

    def distance(sensor: models.IoTReading) -> float:
        sensor_time = sensor.timestamp
        if sensor_time.tzinfo is None:
            sensor_time = sensor_time.replace(tzinfo=timezone.utc)
        else:
            sensor_time = sensor_time.astimezone(timezone.utc)
        return abs((sensor_time - reading_time).total_seconds())

    nearest = min(candidates, key=distance)
    return latest_sensor_dict(nearest) | {
        "device_id": nearest.device_id,
        "farm_id": nearest.farm_id,
        "coop_id": nearest.coop_id,
    }


@router.get("", dependencies=[Depends(require_gallery_user)])
def list_image_gallery(
    farm_id: str | None = None,
    coop_id: str | None = None,
    device_id: str | None = None,
    prediction_status: Literal["healthy", "sick"] | None = None,
    disease_type: str | None = None,
    camera_type: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    search: str | None = None,
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(models.ImageReading)

    if farm_id:
        query = query.filter(models.ImageReading.farm_id.in_(farm_filter_values(db, farm_id)))
    if coop_id:
        query = query.filter(models.ImageReading.coop_id.in_(coop_filter_values(db, coop_id)))
    if device_id:
        query = query.filter(models.ImageReading.device_id == device_id)
    if prediction_status:
        query = query.filter(models.ImageReading.prediction_status == prediction_status)
    if disease_type:
        query = query.filter(models.ImageReading.disease_type == disease_type)
    if camera_type:
        query = query.filter(models.ImageReading.device_type == camera_type)
    if date_from:
        query = query.filter(models.ImageReading.timestamp >= date_from)
    if date_to:
        query = query.filter(models.ImageReading.timestamp <= date_to)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.ImageReading.image_filename.ilike(pattern),
                models.ImageReading.device_id.ilike(pattern),
                models.ImageReading.farm_id.ilike(pattern),
                models.ImageReading.coop_id.ilike(pattern),
            )
        )

    total_count = query.count()
    readings = (
        query.order_by(models.ImageReading.timestamp.desc(), models.ImageReading.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "items": [gallery_item(db, reading) for reading in readings],
        "total_count": total_count,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{reading_id}", dependencies=[Depends(require_gallery_user)])
def get_image_analysis_detail(reading_id: int, db: Session = Depends(get_db)) -> dict:
    reading = db.query(models.ImageReading).filter(models.ImageReading.id == reading_id).first()
    if not reading:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image reading not found")

    related_alerts = (
        db.query(models.ImageReading)
        .filter(
            models.ImageReading.device_id == reading.device_id,
            models.ImageReading.farm_id == reading.farm_id,
            models.ImageReading.coop_id == reading.coop_id,
            models.ImageReading.prediction_status == "sick",
        )
        .order_by(models.ImageReading.timestamp.desc(), models.ImageReading.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        **gallery_item(db, reading),
        "prediction": {
            "prediction_status": reading.prediction_status,
            "disease_type": reading.disease_type,
            "disease_display_name": (
                LABEL_DISPLAY_NAMES.get(reading.raw_label)
                if reading.raw_label
                else reading.disease_type
            ),
            "raw_label": reading.raw_label,
            "confidence": reading.confidence,
        },
        "sensor_snapshot": nearest_sensor_snapshot(db, reading),
        "related_alerts": [alert_dict(alert) for alert in related_alerts],
    }


@router.get("/{reading_id}/image")
def get_image_file(
    reading_id: int,
    token: str | None = Query(default=None),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> FileResponse:
    authenticate_gallery_user(token, credentials, db)
    reading = db.query(models.ImageReading).filter(models.ImageReading.id == reading_id).first()
    if not reading:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image reading not found")

    image_path = resolve_upload_path(reading)
    return FileResponse(
        image_path,
        media_type=reading.image_content_type,
        headers={"Cache-Control": "private, max-age=300"},
    )
