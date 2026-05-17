from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas import DeviceOut, DeviceRegisterAck, DeviceRegisterCreate
from app.services.device_auth_service import hash_api_key


router = APIRouter(prefix="/api/devices", tags=["devices"])


@router.post("/register", response_model=DeviceRegisterAck)
def register_device(
    payload: DeviceRegisterCreate,
    db: Session = Depends(get_db),
) -> DeviceRegisterAck:
    """
    Register a development ESP32/simulator device.

    The raw API key is accepted once, hashed, and then discarded.
    """
    device = models.Device(
        device_id=payload.device_id,
        device_type=payload.device_type,
        farm_id=payload.farm_id,
        coop_id=payload.coop_id,
        api_key_hash=hash_api_key(payload.api_key),
        is_active=True,
    )

    db.add(device)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A device with this device_id already exists",
        ) from error

    return DeviceRegisterAck(
        status="success",
        message="Device registered",
        device_id=device.device_id,
    )


@router.get("", response_model=List[DeviceOut])
def list_devices(db: Session = Depends(get_db)) -> list[models.Device]:
    """List registered devices without exposing API key hashes."""
    return db.query(models.Device).order_by(models.Device.created_at.desc()).all()


@router.patch("/{device_id}/deactivate", response_model=DeviceRegisterAck)
def deactivate_device(
    device_id: str,
    db: Session = Depends(get_db),
) -> DeviceRegisterAck:
    device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    device.is_active = False
    db.commit()

    return DeviceRegisterAck(
        status="success",
        message="Device deactivated",
        device_id=device.device_id,
    )
