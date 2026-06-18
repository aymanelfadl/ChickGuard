import hashlib
import io
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app import models
from app.config import (
    CAMERA_PAIRING_EXPIRE_SECONDS,
    CAMERA_SESSION_EXPIRE_MINUTES,
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
)
from app.services.device_status_service import device_status_fields, format_utc


CAMERA_SESSION_SCOPE = "phone_camera_upload"


class CameraPairingError(Exception):
    """Raised when a camera pairing code or session token cannot be used."""


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_aware(value: datetime) -> datetime:
    if value.tzinfo is None or value.utcoffset() is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def hash_pairing_code(pairing_code: str) -> str:
    return hashlib.sha256(pairing_code.encode("utf-8")).hexdigest()


def is_camera_capable_device(device: models.Device) -> bool:
    return bool(
        device.camera_type
        or "cam" in device.device_type.lower()
        or device.device_type == "phone-browser-camera"
    )


def camera_device_payload(device: models.Device) -> dict:
    status_fields = device_status_fields(device)
    return {
        "device_id": device.device_id,
        "name": device.name or device.device_id,
        "device_type": device.device_type,
        "camera_type": device.camera_type,
        "farm_id": device.farm_id,
        "coop_id": device.coop_id,
        "location_label": device.location_label,
        "description": device.description,
        "is_active": device.is_active,
        "status": status_fields["status"],
        "last_seen_at": status_fields["last_seen_at"],
        "last_event_type": device.last_event_type,
        "created_at": format_utc(device.created_at),
        "api_key_configured": bool(device.api_key_hash),
    }


def normalize_public_base_url(public_base_url: str) -> str:
    normalized = public_base_url.strip().rstrip("/")
    if not normalized.startswith(("https://", "http://")):
        raise CameraPairingError("public_base_url must start with http:// or https://")
    return normalized


def build_pairing_url(public_base_url: str, pairing_code: str) -> str:
    return f"{normalize_public_base_url(public_base_url)}/camera?pairing_code={quote(pairing_code)}"


def build_qr_svg(value: str) -> str:
    try:
        import qrcode
        from qrcode.image.svg import SvgPathImage
    except ImportError as error:
        raise CameraPairingError("QR code support is not installed") from error

    image = qrcode.make(value, image_factory=SvgPathImage, box_size=8, border=2)
    output = io.BytesIO()
    image.save(output)
    return output.getvalue().decode("utf-8")


def create_pairing_response(
    db: Session,
    device: models.Device,
    public_base_url: str,
) -> dict:
    if not device.is_active:
        raise CameraPairingError("Device is inactive")
    if not is_camera_capable_device(device):
        raise CameraPairingError("Pairing is only available for camera-capable devices")

    pairing_code = secrets.token_urlsafe(24)
    expires_at = utc_now() + timedelta(seconds=CAMERA_PAIRING_EXPIRE_SECONDS)
    pairing_record = models.CameraPairingCode(
        device_id=device.device_id,
        code_hash=hash_pairing_code(pairing_code),
        expires_at=expires_at,
    )
    db.add(pairing_record)
    db.commit()

    pairing_url = build_pairing_url(public_base_url, pairing_code)
    return {
        "status": "success",
        "message": "Phone camera pairing QR created",
        "device_id": device.device_id,
        "pairing_url": pairing_url,
        "pairing_code_expires_at": format_utc(expires_at),
        "qr_svg": build_qr_svg(pairing_url),
    }


def create_camera_session_token(device: models.Device) -> tuple[str, datetime]:
    expires_at = utc_now() + timedelta(minutes=CAMERA_SESSION_EXPIRE_MINUTES)
    token = jwt.encode(
        {
            "scope": CAMERA_SESSION_SCOPE,
            "device_id": device.device_id,
            "farm_id": device.farm_id,
            "coop_id": device.coop_id,
            "exp": expires_at,
        },
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )
    return token, expires_at


def consume_pairing_code(db: Session, pairing_code: str) -> tuple[models.Device, str, datetime]:
    pairing_record = (
        db.query(models.CameraPairingCode)
        .filter(models.CameraPairingCode.code_hash == hash_pairing_code(pairing_code))
        .first()
    )
    if not pairing_record:
        raise CameraPairingError("Invalid pairing code")
    if pairing_record.used_at is not None:
        raise CameraPairingError("Pairing code was already used")
    if ensure_aware(pairing_record.expires_at) < utc_now():
        raise CameraPairingError("Pairing code expired")

    device = db.query(models.Device).filter(models.Device.device_id == pairing_record.device_id).first()
    if not device or not device.is_active:
        raise CameraPairingError("Paired device is unavailable")
    if not is_camera_capable_device(device):
        raise CameraPairingError("Paired device is not camera-capable")

    pairing_record.used_at = utc_now()
    session_token, session_expires_at = create_camera_session_token(device)
    db.commit()
    return device, session_token, session_expires_at


def verify_camera_session_token(db: Session, token: str) -> models.Device:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except JWTError as error:
        raise CameraPairingError("Invalid or expired camera session token") from error

    if payload.get("scope") != CAMERA_SESSION_SCOPE:
        raise CameraPairingError("Invalid camera session scope")

    device_id = payload.get("device_id")
    if not device_id:
        raise CameraPairingError("Camera session token is missing device_id")

    device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if not device or not device.is_active:
        raise CameraPairingError("Camera session device is unavailable")
    if payload.get("farm_id") != device.farm_id or payload.get("coop_id") != device.coop_id:
        raise CameraPairingError("Camera session location no longer matches device registry")
    return device
