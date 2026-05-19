from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app import models


ONLINE_STATUS = "online"
OFFLINE_STATUS = "offline"
UNKNOWN_STATUS = "unknown"
OFFLINE_AFTER_SECONDS = 60


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def format_utc(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    return value.replace(microsecond=0).isoformat().replace("+00:00", "Z")


def effective_device_status(
    stored_status: str | None,
    last_seen_at: datetime | None,
    now: datetime | None = None,
) -> str:
    if stored_status != ONLINE_STATUS:
        return stored_status or UNKNOWN_STATUS

    if last_seen_at is None:
        return OFFLINE_STATUS

    reference_time = now or utc_now()
    if last_seen_at.tzinfo is None:
        last_seen_at = last_seen_at.replace(tzinfo=timezone.utc)
    else:
        last_seen_at = last_seen_at.astimezone(timezone.utc)

    if reference_time - last_seen_at > timedelta(seconds=OFFLINE_AFTER_SECONDS):
        return OFFLINE_STATUS

    return ONLINE_STATUS


def update_device_presence(
    db: Session,
    device: models.Device,
    event_type: str,
    status: str = ONLINE_STATUS,
    seen_at: datetime | None = None,
) -> models.Device:
    seen_at = seen_at or utc_now()
    device.last_seen_at = seen_at
    device.status = status
    device.last_event_type = event_type

    camera = (
        db.query(models.CameraDevice)
        .filter(models.CameraDevice.device_id == device.device_id)
        .first()
    )
    if camera:
        camera.last_seen_at = seen_at
        camera.status = status
        camera.last_event_type = event_type
        camera.device_type = device.device_type

    return device


def device_status_event_payload(device: models.Device) -> dict:
    return {
        "device_id": device.device_id,
        "farm_id": device.farm_id,
        "coop_id": device.coop_id,
        "status": effective_device_status(device.status, device.last_seen_at),
        "last_seen_at": format_utc(device.last_seen_at),
    }


def device_status_fields(record: models.Device | models.CameraDevice) -> dict:
    return {
        "status": effective_device_status(record.status, record.last_seen_at),
        "last_seen_at": format_utc(record.last_seen_at),
        "last_event_type": record.last_event_type,
    }
