import secrets
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas import (
    CameraDeviceOut,
    CameraPairingCreate,
    CameraPairingOut,
    DeviceDetailOut,
    DeviceOut,
    DeviceRegisterAck,
    DeviceRegisterCreate,
    DeviceUpdate,
)
from app.services.auth_service import get_current_user, require_roles
from app.services.camera_pairing_service import CameraPairingError, create_pairing_response
from app.services.device_auth_service import hash_api_key
from app.services.device_status_service import device_status_fields
from app.services.farm_management_service import (
    camera_device_dict,
    latest_prediction_dict,
    latest_sensor_dict,
    sync_hierarchy_from_registered_devices,
)


router = APIRouter(prefix="/api/devices", tags=["devices"])
require_dashboard_user = Depends(get_current_user)
require_manager_user = Depends(require_roles("admin", "manager"))
require_admin_user = Depends(require_roles("admin"))


def clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def get_farm_by_identifier(db: Session, farm_identifier: str) -> models.Farm:
    farm = None
    if farm_identifier.isdigit():
        farm = db.query(models.Farm).filter(models.Farm.id == int(farm_identifier)).first()
    if not farm:
        farm = db.query(models.Farm).filter(models.Farm.name == farm_identifier).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    return farm


def get_coop_for_farm(db: Session, coop_identifier: str, farm: models.Farm) -> models.Coop:
    coop = None
    if coop_identifier.isdigit():
        coop = db.query(models.Coop).filter(models.Coop.id == int(coop_identifier)).first()
    if not coop:
        coop = (
            db.query(models.Coop)
            .filter(models.Coop.farm_id == farm.id, models.Coop.name == coop_identifier)
            .first()
        )
    if not coop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coop not found")
    if coop.farm_id != farm.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coop does not belong to the selected farm",
        )
    return coop


def sync_camera_device(
    db: Session,
    device: models.Device,
    farm: models.Farm,
    coop: models.Coop,
) -> models.CameraDevice:
    camera = db.query(models.CameraDevice).filter(models.CameraDevice.device_id == device.device_id).first()
    if not camera:
        camera = models.CameraDevice(
            device_id=device.device_id,
            farm_id=farm.id,
            coop_id=coop.id,
            name=device.name or device.device_id,
            device_type=device.device_type,
            camera_type=device.camera_type,
            stream_url=device.stream_url,
            location_label=device.location_label,
            description=device.description,
            is_active=device.is_active,
            last_seen_at=device.last_seen_at,
            status=device.status,
            last_event_type=device.last_event_type,
        )
        db.add(camera)
        db.flush()
        return camera

    camera.farm_id = farm.id
    camera.coop_id = coop.id
    camera.name = device.name or device.device_id
    camera.device_type = device.device_type
    camera.camera_type = device.camera_type
    camera.stream_url = device.stream_url
    camera.location_label = device.location_label
    camera.description = device.description
    camera.is_active = device.is_active
    camera.last_seen_at = device.last_seen_at
    camera.status = device.status
    camera.last_event_type = device.last_event_type
    return camera


def device_out(device: models.Device) -> DeviceOut:
    return DeviceOut(
        id=device.id,
        device_id=device.device_id,
        name=device.name,
        device_type=device.device_type,
        camera_type=device.camera_type,
        farm_id=device.farm_id,
        coop_id=device.coop_id,
        stream_url=device.stream_url,
        location_label=device.location_label,
        description=device.description,
        api_key_configured=bool(device.api_key_hash),
        is_active=device.is_active,
        created_at=device.created_at,
        **device_status_fields(device),
    )


@router.post("/register", response_model=DeviceRegisterAck, dependencies=[require_admin_user])
def register_device(
    payload: DeviceRegisterCreate,
    db: Session = Depends(get_db),
) -> DeviceRegisterAck:
    """
    Register an ESP32/simulator device and its dashboard camera metadata.

    If no raw API key is supplied, one is generated and returned once.
    Raw API keys are hashed before storage and are never exposed again.
    """
    farm = get_farm_by_identifier(db, payload.farm_id)
    coop = get_coop_for_farm(db, payload.coop_id, farm)
    raw_api_key = payload.api_key or secrets.token_urlsafe(24)
    device = models.Device(
        device_id=payload.device_id,
        name=clean_optional(payload.name) or payload.device_id,
        device_type=payload.device_type,
        camera_type=clean_optional(payload.camera_type),
        farm_id=farm.name,
        coop_id=coop.name,
        stream_url=clean_optional(payload.stream_url),
        location_label=clean_optional(payload.location_label),
        description=clean_optional(payload.description),
        api_key_hash=hash_api_key(raw_api_key),
        is_active=True,
    )

    db.add(device)
    try:
        db.flush()
        camera = sync_camera_device(db, device, farm, coop)
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A device with this device_id already exists",
        ) from error
    db.refresh(device)
    db.refresh(camera)

    return DeviceRegisterAck(
        status="success",
        message="Device registered",
        device_id=device.device_id,
        api_key=raw_api_key if payload.api_key is None else None,
        device={
            **device_out(device).model_dump(mode="json"),
            "camera": CameraDeviceOut(**camera_device_dict(camera)).model_dump(mode="json"),
        },
    )


@router.get("", response_model=List[DeviceOut], dependencies=[require_dashboard_user])
def list_devices(db: Session = Depends(get_db)) -> list[models.Device]:
    """List registered devices without exposing API key hashes."""
    sync_hierarchy_from_registered_devices(db)
    devices = db.query(models.Device).order_by(models.Device.created_at.desc()).all()
    return [device_out(device) for device in devices]


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
        name=device.name,
        device_type=device.device_type,
        camera_type=device.camera_type,
        farm_id=device.farm_id,
        coop_id=device.coop_id,
        stream_url=device.stream_url,
        location_label=device.location_label,
        description=device.description,
        api_key_configured=bool(device.api_key_hash),
        is_active=device.is_active,
        created_at=device.created_at,
        **device_status_fields(device),
        camera=CameraDeviceOut(**camera_device_dict(camera, latest_analysis)) if camera else None,
        latest_prediction=latest_prediction_dict(latest_analysis),
        latest_sensor=latest_sensor_dict(latest_sensor),
    )


@router.post("/{device_id}/camera-pairing", response_model=CameraPairingOut, dependencies=[require_manager_user])
def create_camera_pairing(
    device_id: str,
    payload: CameraPairingCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    public_base_url = payload.public_base_url or str(request.base_url)
    try:
        return create_pairing_response(db, device, public_base_url)
    except CameraPairingError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.patch("/{device_id}", response_model=DeviceDetailOut, dependencies=[require_admin_user])
def update_device(
    device_id: str,
    payload: DeviceUpdate,
    db: Session = Depends(get_db),
) -> DeviceDetailOut:
    sync_hierarchy_from_registered_devices(db)
    device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    farm_identifier = payload.farm_id or device.farm_id
    farm = get_farm_by_identifier(db, farm_identifier)
    coop_identifier = payload.coop_id or device.coop_id
    coop = get_coop_for_farm(db, coop_identifier, farm)

    update_data = payload.model_dump(exclude_unset=True)
    if "name" in update_data:
        device.name = clean_optional(payload.name) or device.device_id
    if "device_type" in update_data and payload.device_type:
        device.device_type = payload.device_type
    if "camera_type" in update_data:
        device.camera_type = clean_optional(payload.camera_type)
    if "stream_url" in update_data:
        device.stream_url = clean_optional(payload.stream_url)
    if "location_label" in update_data:
        device.location_label = clean_optional(payload.location_label)
    if "description" in update_data:
        device.description = clean_optional(payload.description)
    if "is_active" in update_data and payload.is_active is not None:
        device.is_active = payload.is_active

    device.farm_id = farm.name
    device.coop_id = coop.name
    camera = sync_camera_device(db, device, farm, coop)
    db.commit()
    db.refresh(device)
    db.refresh(camera)

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
        **device_out(device).model_dump(),
        camera=CameraDeviceOut(**camera_device_dict(camera, latest_analysis)),
        latest_prediction=latest_prediction_dict(latest_analysis),
        latest_sensor=latest_sensor_dict(latest_sensor),
    )


@router.patch("/{device_id}/deactivate", response_model=DeviceRegisterAck, dependencies=[require_admin_user])
def deactivate_device(
    device_id: str,
    db: Session = Depends(get_db),
) -> DeviceRegisterAck:
    sync_hierarchy_from_registered_devices(db)
    device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    device.is_active = False
    farm = get_farm_by_identifier(db, device.farm_id)
    coop = get_coop_for_farm(db, device.coop_id, farm)
    sync_camera_device(db, device, farm, coop)
    db.commit()

    return DeviceRegisterAck(
        status="success",
        message="Device deactivated",
        device_id=device.device_id,
    )


@router.delete("/{device_id}", dependencies=[require_admin_user])
def delete_device(device_id: str, db: Session = Depends(get_db)) -> dict:
    sync_hierarchy_from_registered_devices(db)
    device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    camera = db.query(models.CameraDevice).filter(models.CameraDevice.device_id == device.device_id).first()
    if camera:
        db.delete(camera)
    db.delete(device)
    db.commit()

    return {"status": "success", "message": "Device deleted", "device_id": device_id}
