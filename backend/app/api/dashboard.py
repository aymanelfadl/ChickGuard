from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models
from app.config import DEFAULT_LIMIT, MAX_LIMIT
from app.database import get_db
from app.schemas import (
    DashboardAlert,
    DashboardHealthHistoryItem,
    DashboardLatestPrediction,
    DashboardLatestSensor,
    DashboardLatestStatus,
    DashboardOverview,
)
from app.services.auth_service import get_current_user


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])
require_dashboard_user = Depends(get_current_user)


def format_utc(value: datetime | None) -> str | None:
    """Return dashboard timestamps in ISO 8601 UTC form for frontend clients."""
    if value is None:
        return None

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)

    return value.replace(microsecond=0).isoformat().replace("+00:00", "Z")


def latest_prediction_for_sensor(
    db: Session,
    sensor_reading: models.IoTReading,
) -> models.ImageReading | None:
    """Find prediction context for a sensor reading on the same device timeline."""
    return (
        db.query(models.ImageReading)
        .filter(
            models.ImageReading.device_id == sensor_reading.device_id,
            models.ImageReading.farm_id == sensor_reading.farm_id,
            models.ImageReading.coop_id == sensor_reading.coop_id,
            models.ImageReading.timestamp <= sensor_reading.timestamp,
            models.ImageReading.prediction_status.is_not(None),
        )
        .order_by(models.ImageReading.timestamp.desc(), models.ImageReading.created_at.desc())
        .first()
    )


@router.get("/overview", response_model=DashboardOverview, dependencies=[require_dashboard_user])
def get_dashboard_overview(db: Session = Depends(get_db)) -> DashboardOverview:
    """
    Return dashboard summary counts.

    These endpoints are shaped for a future web/mobile dashboard and keep UI
    aggregation out of the frontend.
    """
    latest_sensor_at = db.query(func.max(models.IoTReading.timestamp)).scalar()
    latest_image_at = db.query(func.max(models.ImageReading.timestamp)).scalar()
    latest_reading_at = max(
        [value for value in (latest_sensor_at, latest_image_at) if value is not None],
        default=None,
    )

    return DashboardOverview(
        total_devices=db.query(models.Device).count(),
        active_devices=db.query(models.Device).filter(models.Device.is_active.is_(True)).count(),
        total_sensor_readings=db.query(models.IoTReading).count(),
        total_image_readings=db.query(models.ImageReading).count(),
        healthy_detections=(
            db.query(models.ImageReading)
            .filter(models.ImageReading.prediction_status == "healthy")
            .count()
        ),
        sick_detections=(
            db.query(models.ImageReading)
            .filter(models.ImageReading.prediction_status == "sick")
            .count()
        ),
        latest_reading_at=format_utc(latest_reading_at),
    )


@router.get("/latest-status", response_model=DashboardLatestStatus, dependencies=[require_dashboard_user])
def get_latest_status(db: Session = Depends(get_db)) -> DashboardLatestStatus:
    """Return the latest sensor state and latest image prediction."""
    latest_sensor = (
        db.query(models.IoTReading)
        .order_by(models.IoTReading.timestamp.desc(), models.IoTReading.created_at.desc())
        .first()
    )
    latest_prediction = (
        db.query(models.ImageReading)
        .filter(models.ImageReading.prediction_status.is_not(None))
        .order_by(models.ImageReading.timestamp.desc(), models.ImageReading.created_at.desc())
        .first()
    )

    reference = latest_sensor or latest_prediction

    return DashboardLatestStatus(
        device_id=reference.device_id if reference else None,
        farm_id=reference.farm_id if reference else None,
        coop_id=reference.coop_id if reference else None,
        latest_sensor=(
            DashboardLatestSensor(
                temperature_c=latest_sensor.temperature_c,
                humidity_percent=latest_sensor.humidity_percent,
                weight_kg=latest_sensor.weight_kg,
                timestamp=format_utc(latest_sensor.timestamp),
            )
            if latest_sensor
            else None
        ),
        latest_prediction=(
            DashboardLatestPrediction(
                prediction_status=latest_prediction.prediction_status,
                disease_type=latest_prediction.disease_type,
                confidence=latest_prediction.confidence,
                image_path=latest_prediction.image_path,
                timestamp=format_utc(latest_prediction.timestamp),
            )
            if latest_prediction
            else None
        ),
    )


@router.get("/health-history", response_model=List[DashboardHealthHistoryItem], dependencies=[require_dashboard_user])
def get_health_history(
    device_id: str | None = None,
    limit: int = Query(default=50, ge=1, le=MAX_LIMIT),
    db: Session = Depends(get_db),
) -> list[DashboardHealthHistoryItem]:
    """Return sensor history with prediction context for dashboard charts."""
    query = db.query(models.IoTReading)
    if device_id:
        query = query.filter(models.IoTReading.device_id == device_id)

    sensor_readings = (
        query.order_by(models.IoTReading.timestamp.desc(), models.IoTReading.created_at.desc())
        .limit(limit)
        .all()
    )

    history = []
    for reading in sensor_readings:
        prediction = latest_prediction_for_sensor(db, reading)
        history.append(
            DashboardHealthHistoryItem(
                timestamp=format_utc(reading.timestamp) or "",
                device_id=reading.device_id,
                farm_id=reading.farm_id,
                coop_id=reading.coop_id,
                temperature_c=reading.temperature_c,
                humidity_percent=reading.humidity_percent,
                weight_kg=reading.weight_kg,
                prediction_status=prediction.prediction_status if prediction else None,
                disease_type=prediction.disease_type if prediction else None,
                confidence=prediction.confidence if prediction else None,
            )
        )

    return history


@router.get("/alerts", response_model=List[DashboardAlert], dependencies=[require_dashboard_user])
def get_dashboard_alerts(
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    db: Session = Depends(get_db),
) -> list[DashboardAlert]:
    """Return sick detections for future dashboard alert panels."""
    alerts = (
        db.query(models.ImageReading)
        .filter(models.ImageReading.prediction_status == "sick")
        .order_by(models.ImageReading.timestamp.desc(), models.ImageReading.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        DashboardAlert(
            id=alert.id,
            device_id=alert.device_id,
            farm_id=alert.farm_id,
            coop_id=alert.coop_id,
            disease_type=alert.disease_type,
            confidence=alert.confidence,
            image_path=alert.image_path,
            timestamp=format_utc(alert.timestamp) or "",
            created_at=format_utc(alert.created_at) or "",
        )
        for alert in alerts
    ]
