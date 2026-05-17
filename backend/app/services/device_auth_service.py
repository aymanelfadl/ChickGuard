import hashlib
import hmac
import secrets

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.schemas import IoTReadingCreate


HASH_NAME = "pbkdf2_sha256"
HASH_ITERATIONS = 200_000


def hash_api_key(api_key: str) -> str:
    """
    Hash a device API key before storage.

    Raw API keys are never stored. If the database is leaked later, attackers
    should not immediately get usable ESP32 credentials.
    """
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        api_key.encode("utf-8"),
        bytes.fromhex(salt),
        HASH_ITERATIONS,
    ).hex()
    return f"{HASH_NAME}${HASH_ITERATIONS}${salt}${digest}"


def verify_api_key(raw_api_key: str, stored_hash: str) -> bool:
    """Verify a raw API key against a stored PBKDF2 hash."""
    try:
        hash_name, iterations, salt, expected_digest = stored_hash.split("$", 3)
    except ValueError:
        return False

    if hash_name != HASH_NAME:
        return False

    digest = hashlib.pbkdf2_hmac(
        "sha256",
        raw_api_key.encode("utf-8"),
        bytes.fromhex(salt),
        int(iterations),
    ).hex()
    return hmac.compare_digest(digest, expected_digest)


def get_authenticated_device(
    db: Session,
    device_id: str | None,
    api_key: str | None,
) -> models.Device:
    """
    Authenticate a device using the headers sent by simulator or ESP32 firmware.

    Real ESP32 devices can later store the API key in firmware or secure
    provisioning. The backend-side validation stays the same.
    """
    if not device_id or not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Device-Id or X-Device-Api-Key header",
        )

    device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid device credentials",
        )

    if not device.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Device is inactive",
        )

    if not verify_api_key(api_key, device.api_key_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid device credentials",
        )

    return device


def validate_payload_matches_device(payload: IoTReadingCreate, device: models.Device) -> None:
    """
    Prevent a valid key from submitting readings under another device/location.

    This matters for MQTT too: messages are accepted from a broker, but the
    payload still has to match the registered device identity.
    """
    if payload.device.device_id != device.device_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payload device_id does not match authenticated device",
        )

    if payload.location.farm_id != device.farm_id or payload.location.coop_id != device.coop_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payload location does not match authenticated device registry",
        )
