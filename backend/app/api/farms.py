from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models
from app.config import DEFAULT_LIMIT, MAX_LIMIT
from app.database import get_db
from app.schemas import CameraDeviceOut, CoopCreate, CoopOut, CoopSummary, FarmCreate, FarmOut, FarmSummary
from app.services.auth_service import require_roles
from app.services.decision_service import build_daily_traceability, evaluate_health_decisions
from app.services.farm_management_service import (
    alert_dict,
    camera_device_dict,
    coop_lookup_keys,
    farm_lookup_keys,
    latest_prediction_dict,
    latest_sensor_dict,
    sync_hierarchy_from_registered_devices,
)


router = APIRouter(tags=["farm-management"])

admin_user = Depends(require_roles("admin"))
manager_user = Depends(require_roles("admin", "manager"))
report_user = Depends(require_roles("admin", "manager", "viewer"))


def get_farm_or_404(db: Session, farm_id: str) -> models.Farm:
    sync_hierarchy_from_registered_devices(db)
    farm = None
    if farm_id.isdigit():
        farm = db.query(models.Farm).filter(models.Farm.id == int(farm_id)).first()
    if not farm:
        farm = db.query(models.Farm).filter(models.Farm.name == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    return farm


def get_coop_or_404(db: Session, coop_id: str) -> models.Coop:
    sync_hierarchy_from_registered_devices(db)
    coop = None
    if coop_id.isdigit():
        coop = db.query(models.Coop).filter(models.Coop.id == int(coop_id)).first()
    if not coop:
        coop = db.query(models.Coop).filter(models.Coop.name == coop_id).first()
    if not coop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coop not found")
    return coop


def farm_summary(db: Session, farm: models.Farm) -> FarmSummary:
    farm_keys = farm_lookup_keys(farm)
    latest_analysis = (
        db.query(models.ImageReading)
        .filter(models.ImageReading.farm_id.in_(farm_keys), models.ImageReading.prediction_status.is_not(None))
        .order_by(models.ImageReading.timestamp.desc(), models.ImageReading.created_at.desc())
        .first()
    )
    active_alerts = (
        db.query(models.ImageReading)
        .filter(models.ImageReading.farm_id.in_(farm_keys), models.ImageReading.prediction_status == "sick")
        .count()
    )

    return FarmSummary(
        id=farm.id,
        name=farm.name,
        location=farm.location,
        description=farm.description,
        created_at=farm.created_at,
        number_of_coops=db.query(models.Coop).filter(models.Coop.farm_id == farm.id).count(),
        number_of_devices=db.query(models.CameraDevice).filter(models.CameraDevice.farm_id == farm.id).count(),
        active_alerts=active_alerts,
        latest_health_status=latest_analysis.prediction_status if latest_analysis else None,
    )


def coop_summary(db: Session, coop: models.Coop) -> CoopSummary:
    farm = db.query(models.Farm).filter(models.Farm.id == coop.farm_id).first()
    farm_keys = farm_lookup_keys(farm) if farm else {str(coop.farm_id)}
    coop_keys = coop_lookup_keys(coop)
    latest_analysis = (
        db.query(models.ImageReading)
        .filter(
            models.ImageReading.farm_id.in_(farm_keys),
            models.ImageReading.coop_id.in_(coop_keys),
            models.ImageReading.prediction_status.is_not(None),
        )
        .order_by(models.ImageReading.timestamp.desc(), models.ImageReading.created_at.desc())
        .first()
    )
    active_alerts = (
        db.query(models.ImageReading)
        .filter(
            models.ImageReading.farm_id.in_(farm_keys),
            models.ImageReading.coop_id.in_(coop_keys),
            models.ImageReading.prediction_status == "sick",
        )
        .count()
    )

    return CoopSummary(
        id=coop.id,
        farm_id=coop.farm_id,
        name=coop.name,
        description=coop.description,
        capacity=coop.capacity,
        created_at=coop.created_at,
        number_of_devices=db.query(models.CameraDevice).filter(models.CameraDevice.coop_id == coop.id).count(),
        active_alerts=active_alerts,
        latest_health_status=latest_analysis.prediction_status if latest_analysis else None,
    )


def camera_device_out(db: Session, camera: models.CameraDevice) -> CameraDeviceOut:
    latest_analysis = (
        db.query(models.ImageReading)
        .filter(models.ImageReading.device_id == camera.device_id, models.ImageReading.prediction_status.is_not(None))
        .order_by(models.ImageReading.timestamp.desc(), models.ImageReading.created_at.desc())
        .first()
    )
    return CameraDeviceOut(**camera_device_dict(camera, latest_analysis))


def build_report_traceability(db: Session, **kwargs: object) -> dict:
    try:
        return build_daily_traceability(db, **kwargs)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="date must use YYYY-MM-DD format",
        ) from error


def farm_dependency_count(db: Session, farm: models.Farm) -> int:
    farm_keys = farm_lookup_keys(farm)
    return (
        db.query(models.Coop).filter(models.Coop.farm_id == farm.id).count()
        + db.query(models.CameraDevice).filter(models.CameraDevice.farm_id == farm.id).count()
        + db.query(models.Device).filter(models.Device.farm_id.in_(farm_keys)).count()
        + db.query(models.IoTReading).filter(models.IoTReading.farm_id.in_(farm_keys)).count()
        + db.query(models.ImageReading).filter(models.ImageReading.farm_id.in_(farm_keys)).count()
    )


def coop_dependency_count(db: Session, coop: models.Coop) -> int:
    farm = db.query(models.Farm).filter(models.Farm.id == coop.farm_id).first()
    farm_keys = farm_lookup_keys(farm) if farm else {str(coop.farm_id)}
    coop_keys = coop_lookup_keys(coop)
    return (
        db.query(models.CameraDevice).filter(models.CameraDevice.coop_id == coop.id).count()
        + db.query(models.Device)
        .filter(models.Device.farm_id.in_(farm_keys), models.Device.coop_id.in_(coop_keys))
        .count()
        + db.query(models.IoTReading)
        .filter(models.IoTReading.farm_id.in_(farm_keys), models.IoTReading.coop_id.in_(coop_keys))
        .count()
        + db.query(models.ImageReading)
        .filter(models.ImageReading.farm_id.in_(farm_keys), models.ImageReading.coop_id.in_(coop_keys))
        .count()
    )


@router.get("/api/farms", response_model=List[FarmSummary], dependencies=[manager_user])
def list_farms(db: Session = Depends(get_db)) -> list[FarmSummary]:
    sync_hierarchy_from_registered_devices(db)
    farms = db.query(models.Farm).order_by(models.Farm.name.asc()).all()
    return [farm_summary(db, farm) for farm in farms]


@router.get("/api/reports/options", dependencies=[report_user])
def list_report_options(db: Session = Depends(get_db)) -> list[dict]:
    sync_hierarchy_from_registered_devices(db)
    farms = db.query(models.Farm).order_by(models.Farm.name.asc()).all()
    options = []
    for farm in farms:
        coops = (
            db.query(models.Coop)
            .filter(models.Coop.farm_id == farm.id)
            .order_by(models.Coop.name.asc())
            .all()
        )
        options.append(
            {
                "id": farm.id,
                "name": farm.name,
                "coops": [{"id": coop.id, "name": coop.name} for coop in coops],
            }
        )
    return options


@router.post("/api/farms", response_model=FarmOut, dependencies=[admin_user])
def create_farm(payload: FarmCreate, db: Session = Depends(get_db)) -> models.Farm:
    farm = models.Farm(
        name=payload.name,
        location=payload.location,
        description=payload.description,
    )
    db.add(farm)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Farm name already exists") from error
    db.refresh(farm)
    return farm


@router.get("/api/farms/{farm_id}", response_model=FarmSummary, dependencies=[manager_user])
def get_farm(farm_id: str, db: Session = Depends(get_db)) -> FarmSummary:
    return farm_summary(db, get_farm_or_404(db, farm_id))


@router.delete("/api/farms/{farm_id}", dependencies=[admin_user])
def delete_farm(farm_id: str, db: Session = Depends(get_db)) -> dict:
    farm = get_farm_or_404(db, farm_id)
    if farm_dependency_count(db, farm):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Farm cannot be deleted while it has coops, devices, or readings. Delete or move those records first.",
        )

    db.delete(farm)
    db.commit()
    return {"status": "success", "message": "Farm deleted", "farm_id": farm_id}


@router.get("/api/farms/{farm_id}/coops", response_model=List[CoopSummary], dependencies=[manager_user])
def list_farm_coops(farm_id: str, db: Session = Depends(get_db)) -> list[CoopSummary]:
    farm = get_farm_or_404(db, farm_id)
    coops = db.query(models.Coop).filter(models.Coop.farm_id == farm.id).order_by(models.Coop.name.asc()).all()
    return [coop_summary(db, coop) for coop in coops]


@router.post("/api/farms/{farm_id}/coops", response_model=CoopOut, dependencies=[admin_user])
def create_coop(farm_id: str, payload: CoopCreate, db: Session = Depends(get_db)) -> models.Coop:
    farm = get_farm_or_404(db, farm_id)
    coop = models.Coop(
        farm_id=farm.id,
        name=payload.name,
        description=payload.description,
        capacity=payload.capacity,
    )
    db.add(coop)
    db.commit()
    db.refresh(coop)
    return coop


@router.get("/api/coops/{coop_id}", response_model=CoopSummary, dependencies=[manager_user])
def get_coop(coop_id: str, db: Session = Depends(get_db)) -> CoopSummary:
    return coop_summary(db, get_coop_or_404(db, coop_id))


@router.delete("/api/coops/{coop_id}", dependencies=[admin_user])
def delete_coop(coop_id: str, db: Session = Depends(get_db)) -> dict:
    coop = get_coop_or_404(db, coop_id)
    if coop_dependency_count(db, coop):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Coop cannot be deleted while it has devices or readings. Delete or move those records first.",
        )

    db.delete(coop)
    db.commit()
    return {"status": "success", "message": "Coop deleted", "coop_id": coop_id}


@router.get("/api/coops/{coop_id}/devices", response_model=List[CameraDeviceOut], dependencies=[manager_user])
def list_coop_devices(coop_id: str, db: Session = Depends(get_db)) -> list[CameraDeviceOut]:
    coop = get_coop_or_404(db, coop_id)
    cameras = (
        db.query(models.CameraDevice)
        .filter(models.CameraDevice.coop_id == coop.id)
        .order_by(models.CameraDevice.name.asc())
        .all()
    )
    return [camera_device_out(db, camera) for camera in cameras]


@router.get("/api/farms/{farm_id}/report", dependencies=[report_user])
def get_farm_report(
    farm_id: str,
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    traceability_date: str | None = Query(default=None, alias="date"),
    db: Session = Depends(get_db),
) -> dict:
    farm = get_farm_or_404(db, farm_id)
    keys = farm_lookup_keys(farm)
    recent_alerts = (
        db.query(models.ImageReading)
        .filter(models.ImageReading.farm_id.in_(keys), models.ImageReading.prediction_status == "sick")
        .order_by(models.ImageReading.timestamp.desc(), models.ImageReading.created_at.desc())
        .limit(limit)
        .all()
    )
    latest_sensors = (
        db.query(models.IoTReading)
        .filter(models.IoTReading.farm_id.in_(keys))
        .order_by(models.IoTReading.timestamp.desc(), models.IoTReading.created_at.desc())
        .limit(limit)
        .all()
    )
    latest_sensor = latest_sensors[0] if latest_sensors else None
    latest_analysis = (
        db.query(models.ImageReading)
        .filter(models.ImageReading.farm_id.in_(keys), models.ImageReading.prediction_status.is_not(None))
        .order_by(models.ImageReading.timestamp.desc(), models.ImageReading.created_at.desc())
        .first()
    )
    cameras = (
        db.query(models.CameraDevice)
        .filter(models.CameraDevice.farm_id == farm.id)
        .order_by(models.CameraDevice.name.asc())
        .all()
    )
    device_items = [camera_device_out(db, camera).model_dump(mode="json") for camera in cameras]

    return {
        "farm": farm_summary(db, farm).model_dump(mode="json"),
        "number_of_coops": db.query(models.Coop).filter(models.Coop.farm_id == farm.id).count(),
        "number_of_devices": len(device_items),
        "online_devices": sum(1 for device in device_items if device.get("status") == "online"),
        "offline_devices": sum(1 for device in device_items if device.get("status") == "offline"),
        "total_readings": db.query(models.IoTReading).filter(models.IoTReading.farm_id.in_(keys)).count(),
        "total_droppings_analyses": db.query(models.ImageReading).filter(models.ImageReading.farm_id.in_(keys)).count(),
        "healthy_detections": db.query(models.ImageReading).filter(models.ImageReading.farm_id.in_(keys), models.ImageReading.prediction_status == "healthy").count(),
        "sick_detections": db.query(models.ImageReading).filter(models.ImageReading.farm_id.in_(keys), models.ImageReading.prediction_status == "sick").count(),
        "devices": device_items,
        "decisions": evaluate_health_decisions(latest_sensor, latest_analysis),
        "daily_traceability": build_report_traceability(
            db,
            traceability_date=traceability_date,
            farm_keys=keys,
        ),
        "recent_alerts": [alert_dict(alert) for alert in recent_alerts],
        "latest_sensor_readings": [latest_sensor_dict(reading) | {"device_id": reading.device_id, "coop_id": reading.coop_id} for reading in latest_sensors],
    }


@router.get("/api/coops/{coop_id}/report", dependencies=[report_user])
def get_coop_report(
    coop_id: str,
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    traceability_date: str | None = Query(default=None, alias="date"),
    db: Session = Depends(get_db),
) -> dict:
    coop = get_coop_or_404(db, coop_id)
    farm = db.query(models.Farm).filter(models.Farm.id == coop.farm_id).first()
    farm_keys = farm_lookup_keys(farm) if farm else {str(coop.farm_id)}
    coop_keys = coop_lookup_keys(coop)
    latest_analysis = (
        db.query(models.ImageReading)
        .filter(
            models.ImageReading.farm_id.in_(farm_keys),
            models.ImageReading.coop_id.in_(coop_keys),
            models.ImageReading.prediction_status.is_not(None),
        )
        .order_by(models.ImageReading.timestamp.desc(), models.ImageReading.created_at.desc())
        .first()
    )
    latest_sensors = (
        db.query(models.IoTReading)
        .filter(models.IoTReading.farm_id.in_(farm_keys), models.IoTReading.coop_id.in_(coop_keys))
        .order_by(models.IoTReading.timestamp.desc(), models.IoTReading.created_at.desc())
        .limit(limit)
        .all()
    )
    latest_sensor = latest_sensors[0] if latest_sensors else None
    disease_history = (
        db.query(models.ImageReading)
        .filter(
            models.ImageReading.farm_id.in_(farm_keys),
            models.ImageReading.coop_id.in_(coop_keys),
            models.ImageReading.prediction_status.is_not(None),
        )
        .order_by(models.ImageReading.timestamp.desc(), models.ImageReading.created_at.desc())
        .limit(limit)
        .all()
    )
    recent_alerts = [item for item in disease_history if item.prediction_status == "sick"]
    cameras = (
        db.query(models.CameraDevice)
        .filter(models.CameraDevice.coop_id == coop.id)
        .order_by(models.CameraDevice.name.asc())
        .all()
    )

    return {
        "coop": coop_summary(db, coop).model_dump(mode="json"),
        "devices": [camera_device_out(db, camera).model_dump(mode="json") for camera in cameras],
        "decisions": evaluate_health_decisions(latest_sensor, latest_analysis),
        "daily_traceability": build_report_traceability(
            db,
            traceability_date=traceability_date,
            farm_keys=farm_keys,
            coop_keys=coop_keys,
        ),
        "latest_sensor_readings": [latest_sensor_dict(reading) | {"device_id": reading.device_id} for reading in latest_sensors],
        "latest_droppings_analysis": latest_prediction_dict(latest_analysis),
        "disease_history": [latest_prediction_dict(item) | {"device_id": item.device_id} for item in disease_history],
        "recent_alerts": [alert_dict(alert) for alert in recent_alerts[:limit]],
    }
