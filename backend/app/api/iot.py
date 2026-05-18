import json
from typing import List

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Query, UploadFile, status
from fastapi.encoders import jsonable_encoder
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models
from app.config import DEFAULT_LIMIT, MAX_LIMIT
from app.database import get_db
from app.schemas import ImageReadingOut, IoTReadingAck, IoTReadingCreate, IoTReadingOut
from app.services.device_auth_service import get_authenticated_device, validate_payload_matches_device
from app.services.auth_service import get_current_user
from app.services.prediction_service import run_prediction
from app.services.storage_service import save_uploaded_image


router = APIRouter(prefix="/api/iot", tags=["iot"])
require_dashboard_user = Depends(get_current_user)


def parse_image_metadata(metadata_json: str) -> IoTReadingCreate:
    """
    Validate multipart metadata with the same schema as sensor-only readings.

    This keeps the backend independent from simulator vs real ESP32-CAM. Both
    send the same JSON metadata contract; only transport differs for droppings
    images.
    """
    try:
        raw_metadata = json.loads(metadata_json)
    except json.JSONDecodeError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="metadata must be a valid JSON string",
        ) from error

    if not isinstance(raw_metadata, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="metadata must be a JSON object",
        )

    try:
        return IoTReadingCreate.model_validate(raw_metadata)
    except ValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=jsonable_encoder(error.errors()),
        ) from error


def require_authenticated_device(
    x_device_id: str | None = Header(default=None, alias="X-Device-Id"),
    x_device_api_key: str | None = Header(default=None, alias="X-Device-Api-Key"),
    db: Session = Depends(get_db),
) -> models.Device:
    return get_authenticated_device(db, x_device_id, x_device_api_key)


@router.post("/readings", response_model=IoTReadingAck)
def create_iot_reading(
    payload: IoTReadingCreate,
    db: Session = Depends(get_db),
    authenticated_device: models.Device = Depends(require_authenticated_device),
) -> IoTReadingAck:
    validate_payload_matches_device(payload, authenticated_device)

    metadata = payload.metadata
    reading = models.IoTReading(
        schema_version=payload.schema_version,
        message_id=payload.message_id,
        device_id=payload.device.device_id,
        device_type=payload.device.device_type,
        firmware_version=payload.device.firmware_version,
        farm_id=payload.location.farm_id,
        coop_id=payload.location.coop_id,
        timestamp=payload.timestamp,
        temperature_c=payload.data.temperature_c,
        humidity_percent=payload.data.humidity_percent,
        weight_kg=payload.data.weight_kg,
        battery_percent=metadata.battery_percent if metadata else None,
        wifi_rssi=metadata.wifi_rssi if metadata else None,
        source=metadata.source if metadata else None,
    )

    db.add(reading)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A reading with this message_id already exists",
        ) from error

    db.refresh(reading)

    return IoTReadingAck(
        status="success",
        message="Reading received",
        reading_id=reading.id,
        device_id=reading.device_id,
    )


@router.get("/readings", response_model=List[IoTReadingOut], dependencies=[require_dashboard_user])
def get_latest_iot_readings(
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    db: Session = Depends(get_db),
) -> list[models.IoTReading]:
    return (
        db.query(models.IoTReading)
        .order_by(models.IoTReading.created_at.desc())
        .limit(limit)
        .all()
    )


@router.post("/image-reading")
def create_image_reading(
    image: UploadFile = File(...),
    metadata: str = Form(...),
    db: Session = Depends(get_db),
    authenticated_device: models.Device = Depends(require_authenticated_device),
) -> dict:
    """
    Receive poultry droppings image bytes and JSON metadata in one multipart
    request.

    multipart/form-data matches the ESP32-CAM use case: the droppings image is
    binary, while metadata stays structured JSON. Droppings analysis is called
    through a stable service boundary so model internals can change without
    changing the API.
    """
    payload = parse_image_metadata(metadata)
    validate_payload_matches_device(payload, authenticated_device)

    existing_reading = (
        db.query(models.ImageReading)
        .filter(models.ImageReading.message_id == payload.message_id)
        .first()
    )
    if existing_reading:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An image reading with this message_id already exists",
        )

    stored_image = save_uploaded_image(image, payload)
    prediction, prediction_warning = run_prediction(stored_image.absolute_path.as_posix())

    metadata_payload = payload.metadata
    image_reading = models.ImageReading(
        schema_version=payload.schema_version,
        message_id=payload.message_id,
        device_id=payload.device.device_id,
        device_type=payload.device.device_type,
        firmware_version=payload.device.firmware_version,
        farm_id=payload.location.farm_id,
        coop_id=payload.location.coop_id,
        timestamp=payload.timestamp,
        temperature_c=payload.data.temperature_c,
        humidity_percent=payload.data.humidity_percent,
        weight_kg=payload.data.weight_kg,
        battery_percent=metadata_payload.battery_percent if metadata_payload else None,
        wifi_rssi=metadata_payload.wifi_rssi if metadata_payload else None,
        source=metadata_payload.source if metadata_payload else None,
        image_path=stored_image.path,
        image_filename=stored_image.filename,
        image_content_type=stored_image.content_type,
        image_size_bytes=stored_image.size_bytes,
        prediction_status=prediction["prediction_status"] if prediction else None,
        disease_type=prediction["disease_type"] if prediction else None,
        raw_label=prediction["raw_label"] if prediction else None,
        confidence=prediction["confidence"] if prediction else None,
    )

    db.add(image_reading)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        stored_image.absolute_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An image reading with this message_id already exists",
        ) from error

    db.refresh(image_reading)

    response = {
        "status": "success" if prediction else "partial_success",
        "message": (
            "Image reading received"
            if prediction
            else "Image reading received, but prediction failed"
        ),
        "image_reading_id": image_reading.id,
        "device_id": image_reading.device_id,
        "image_path": image_reading.image_path,
        "prediction": prediction,
    }
    if prediction_warning:
        response["warning"] = prediction_warning

    return response


@router.get("/image-readings", response_model=List[ImageReadingOut], dependencies=[require_dashboard_user])
def get_latest_image_readings(
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    db: Session = Depends(get_db),
) -> list[models.ImageReading]:
    return (
        db.query(models.ImageReading)
        .order_by(models.ImageReading.created_at.desc())
        .limit(limit)
        .all()
    )
