from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app import models
from app.services.device_status_service import device_status_fields


def format_utc(value: datetime | None) -> str | None:
    """Return ISO 8601 UTC timestamps for frontend/report clients."""
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    return value.replace(microsecond=0).isoformat().replace("+00:00", "Z")


def sync_hierarchy_from_registered_devices(db: Session) -> None:
    """
    Ensure farm/coop/camera rows exist for registered IoT devices.

    The Device table remains the authentication registry. These management
    tables add product structure for reports, navigation, and future live
    camera support without changing the IoT ingestion payload contract.
    """
    changed = False
    devices = db.query(models.Device).all()

    for device in devices:
        farm = db.query(models.Farm).filter(models.Farm.name == device.farm_id).first()
        if not farm:
            farm = models.Farm(
                name=device.farm_id,
                location=None,
                description="Created from registered IoT device metadata.",
            )
            db.add(farm)
            db.flush()
            changed = True

        coop = (
            db.query(models.Coop)
            .filter(models.Coop.farm_id == farm.id, models.Coop.name == device.coop_id)
            .first()
        )
        if not coop:
            coop = models.Coop(
                farm_id=farm.id,
                name=device.coop_id,
                description="Created from registered IoT device metadata.",
                capacity=None,
            )
            db.add(coop)
            db.flush()
            changed = True

        camera = (
            db.query(models.CameraDevice)
            .filter(models.CameraDevice.device_id == device.device_id)
            .first()
        )
        if not camera:
            camera = models.CameraDevice(
                device_id=device.device_id,
                farm_id=farm.id,
                coop_id=coop.id,
                name=device.device_id,
                device_type=device.device_type,
                stream_url=None,
                is_active=device.is_active,
                last_seen_at=device.last_seen_at,
                status=device.status,
                last_event_type=device.last_event_type,
            )
            db.add(camera)
            changed = True
        else:
            if (
                camera.farm_id != farm.id
                or camera.coop_id != coop.id
                or camera.device_type != device.device_type
                or camera.is_active != device.is_active
                or camera.last_seen_at != device.last_seen_at
                or camera.status != device.status
                or camera.last_event_type != device.last_event_type
            ):
                changed = True
            camera.farm_id = farm.id
            camera.coop_id = coop.id
            camera.device_type = device.device_type
            camera.is_active = device.is_active
            camera.last_seen_at = device.last_seen_at
            camera.status = device.status
            camera.last_event_type = device.last_event_type

    if changed:
        db.commit()


def farm_lookup_keys(farm: models.Farm) -> set[str]:
    """Return values that existing IoT telemetry may use for this farm."""
    return {str(farm.id), farm.name}


def coop_lookup_keys(coop: models.Coop) -> set[str]:
    """Return values that existing IoT telemetry may use for this coop."""
    return {str(coop.id), coop.name}


def latest_prediction_dict(reading: models.ImageReading | None) -> dict | None:
    if not reading:
        return None
    return {
        "prediction_status": reading.prediction_status,
        "disease_type": reading.disease_type,
        "raw_label": reading.raw_label,
        "confidence": reading.confidence,
        "image_path": reading.image_path,
        "timestamp": format_utc(reading.timestamp),
    }


def latest_sensor_dict(reading: models.IoTReading | None) -> dict | None:
    if not reading:
        return None
    return {
        "temperature_c": reading.temperature_c,
        "humidity_percent": reading.humidity_percent,
        "weight_kg": reading.weight_kg,
        "battery_percent": reading.battery_percent,
        "wifi_rssi": reading.wifi_rssi,
        "timestamp": format_utc(reading.timestamp),
    }


def camera_device_dict(camera: models.CameraDevice, latest_analysis: models.ImageReading | None = None) -> dict:
    return {
        "id": camera.id,
        "device_id": camera.device_id,
        "farm_id": camera.farm_id,
        "coop_id": camera.coop_id,
        "name": camera.name,
        "device_type": camera.device_type,
        "stream_url": camera.stream_url,
        "is_active": camera.is_active,
        "created_at": camera.created_at,
        "latest_prediction": latest_prediction_dict(latest_analysis),
        **device_status_fields(camera),
    }


def alert_dict(reading: models.ImageReading) -> dict:
    return {
        "id": reading.id,
        "device_id": reading.device_id,
        "farm_id": reading.farm_id,
        "coop_id": reading.coop_id,
        "disease_type": reading.disease_type,
        "confidence": reading.confidence,
        "image_path": reading.image_path,
        "timestamp": format_utc(reading.timestamp),
        "created_at": format_utc(reading.created_at),
    }
