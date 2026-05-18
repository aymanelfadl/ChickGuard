from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas import CameraDeviceOut, DeviceDetailOut, DeviceOut, DeviceRegisterAck, DeviceRegisterCreate
from app.services.auth_service import get_current_user, require_roles
from app.services.device_auth_service import hash_api_key
from app.services.farm_management_service import latest_prediction_dict, latest_sensor_dict, sync_hierarchy_from_registered_devices


router = APIRouter(prefix="/api/devices", tags=["devices"])
require_dashboard_user = Depends(get_current_user)
require_manager_user = Depends(require_roles("admin", "manager"))
require_admin_user = Depends(require_roles("admin"))


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


@router.get("", response_model=List[DeviceOut], dependencies=[require_dashboard_user])
def list_devices(db: Session = Depends(get_db)) -> list[models.Device]:
    """List registered devices without exposing API key hashes."""
    sync_hierarchy_from_registered_devices(db)
    return db.query(models.Device).order_by(models.Device.created_at.desc()).all()


@router.get("/{device_id}", response_model=DeviceDetailOut, dependencies=[require_manager_user])
def get_device(device_id: str, db: Session = Depends(get_db)) -> DeviceDetailOut:
    sync_hierarchy_from_registered_devices(db)
    device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    camera = db.query(models.CameraDevice).filter(models.CameraDevice.device_id == device.device_id).first()
    latest_analysis = (
        db.query(models.ImageReading)
        .filter(models.ImageReading.device_id == device.device_id, models.ImageReading.prediction_status.is_not(None))
        .order_by(models.ImageReading.timestamp.desc(), models.ImageReading.created_at.desc())
        .first()
    )
    latest_sensor = (
        db.query(models.IoTReading)
        .filter(models.IoTReading.device_id == device.device_id)
        .order_by(models.IoTReading.timestamp.desc(), models.IoTReading.created_at.desc())
        .first()
    )

    return DeviceDetailOut(
        id=device.id,
        device_id=device.device_id,
        device_type=device.device_type,
        farm_id=device.farm_id,
        coop_id=device.coop_id,
        is_active=device.is_active,
        created_at=device.created_at,
        camera=(
            CameraDeviceOut(
                id=camera.id,
                device_id=camera.device_id,
                farm_id=camera.farm_id,
                coop_id=camera.coop_id,
                name=camera.name,
                device_type=camera.device_type,
                stream_url=camera.stream_url,
                is_active=camera.is_active,
                created_at=camera.created_at,
                latest_prediction=latest_prediction_dict(latest_analysis),
            )
            if camera
            else None
        ),
        latest_prediction=latest_prediction_dict(latest_analysis),
        latest_sensor=latest_sensor_dict(latest_sensor),
    )


@router.patch("/{device_id}/deactivate", response_model=DeviceRegisterAck, dependencies=[require_admin_user])
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
