from datetime import date, datetime, time, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy.orm import Session

from app import models
from app.config import (
    DECISION_DAYLIGHT_END_HOUR,
    DECISION_DAYLIGHT_START_HOUR,
    DECISION_TIMEZONE,
)


def decision_timezone() -> ZoneInfo:
    try:
        return ZoneInfo(DECISION_TIMEZONE)
    except ZoneInfoNotFoundError:
        return ZoneInfo("UTC")


def localize_timestamp(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None or value.utcoffset() is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(decision_timezone())


def classify_period(value: datetime | None) -> dict:
    local_value = localize_timestamp(value)
    if local_value is None:
        return {
            "period": "unknown",
            "timezone": DECISION_TIMEZONE,
            "local_date": None,
            "local_time": None,
            "daylight_start_hour": DECISION_DAYLIGHT_START_HOUR,
            "daylight_end_hour": DECISION_DAYLIGHT_END_HOUR,
        }

    hour = local_value.hour
    period = (
        "daylight"
        if DECISION_DAYLIGHT_START_HOUR <= hour < DECISION_DAYLIGHT_END_HOUR
        else "night"
    )
    return {
        "period": period,
        "timezone": DECISION_TIMEZONE,
        "local_date": local_value.date().isoformat(),
        "local_time": local_value.strftime("%H:%M:%S"),
        "daylight_start_hour": DECISION_DAYLIGHT_START_HOUR,
        "daylight_end_hour": DECISION_DAYLIGHT_END_HOUR,
    }


def timestamp_for_decision(
    sensor: models.IoTReading | None,
    prediction: models.ImageReading | None,
) -> datetime | None:
    if sensor and prediction:
        return max(sensor.timestamp, prediction.timestamp)
    if sensor:
        return sensor.timestamp
    if prediction:
        return prediction.timestamp
    return None


def temperature_thresholds(period: str) -> dict:
    if period == "night":
        return {
            "low_warning": 16,
            "high_warning": 32,
            "high_critical": 38,
        }
    return {
        "low_warning": 18,
        "high_warning": 35,
        "high_critical": 40,
    }


def decision_payload(
    *,
    decision_id: str,
    severity: str,
    title: str,
    description: str,
    action: str,
    source: str,
    reference: models.IoTReading | models.ImageReading | None,
    context: dict,
) -> dict:
    return {
        "id": decision_id,
        "severity": severity,
        "title": title,
        "description": description,
        "action": action,
        "source": source,
        "period": context["period"],
        "timezone": context["timezone"],
        "local_date": context["local_date"],
        "local_time": context["local_time"],
        "device_id": reference.device_id if reference else None,
        "farm_id": reference.farm_id if reference else None,
        "coop_id": reference.coop_id if reference else None,
        "event_timestamp": reference.timestamp.isoformat() if reference else None,
    }


def evaluate_health_decisions(
    sensor: models.IoTReading | None = None,
    prediction: models.ImageReading | None = None,
) -> list[dict]:
    """
    Convert sensor telemetry and droppings analysis into operator decisions.

    Rules use the reading timestamp to apply daylight vs night context. They
    remain deterministic: the same stored readings always produce the same
    decisions.
    """
    decisions: list[dict] = []
    reference_time = timestamp_for_decision(sensor, prediction)
    context = classify_period(reference_time)

    if prediction and prediction.prediction_status == "sick":
        disease = prediction.disease_type or "sick detection"
        decisions.append(
            decision_payload(
                decision_id="sick-droppings-analysis",
                severity="critical",
                title="Health alert from droppings analysis",
                description=f"Latest poultry droppings image was classified as {disease}.",
                action="Inspect the coop, isolate visibly sick birds, and review the uploaded droppings image.",
                source="image",
                reference=prediction,
                context=context,
            )
        )

    if sensor:
        thresholds = temperature_thresholds(context["period"])
        if sensor.temperature_c is not None:
            if sensor.temperature_c >= thresholds["high_warning"]:
                decisions.append(
                    decision_payload(
                        decision_id="high-temperature",
                        severity="critical" if sensor.temperature_c >= thresholds["high_critical"] else "warning",
                        title="High coop temperature",
                        description=(
                            f"Latest {context['period']} temperature is {sensor.temperature_c:.1f} C. "
                            f"Warning threshold is {thresholds['high_warning']} C."
                        ),
                        action="Increase ventilation, check heat sources, and inspect birds for heat stress.",
                        source="sensor",
                        reference=sensor,
                        context=context,
                    )
                )
            elif sensor.temperature_c <= thresholds["low_warning"]:
                decisions.append(
                    decision_payload(
                        decision_id="low-temperature",
                        severity="warning",
                        title="Low coop temperature",
                        description=(
                            f"Latest {context['period']} temperature is {sensor.temperature_c:.1f} C. "
                            f"Low threshold is {thresholds['low_warning']} C."
                        ),
                        action="Check heating, drafts, and sensor placement.",
                        source="sensor",
                        reference=sensor,
                        context=context,
                    )
                )

        if sensor.humidity_percent is not None:
            if sensor.humidity_percent >= 75:
                decisions.append(
                    decision_payload(
                        decision_id="high-humidity",
                        severity="warning",
                        title="High humidity",
                        description=f"Latest humidity is {sensor.humidity_percent:.0f}%.",
                        action="Improve ventilation and check litter moisture.",
                        source="sensor",
                        reference=sensor,
                        context=context,
                    )
                )
            elif sensor.humidity_percent <= 35:
                decisions.append(
                    decision_payload(
                        decision_id="low-humidity",
                        severity="info",
                        title="Low humidity",
                        description=f"Latest humidity is {sensor.humidity_percent:.0f}%.",
                        action="Confirm sensor placement and monitor bird comfort.",
                        source="sensor",
                        reference=sensor,
                        context=context,
                    )
                )

        if sensor.motion == 0 and context["period"] == "daylight":
            decisions.append(
                decision_payload(
                    decision_id="no-daylight-motion",
                    severity="warning",
                    title="No daytime movement detected",
                    description="The latest daylight PIR reading did not detect movement.",
                    action="Check bird activity and verify the PIR sensor is positioned correctly.",
                    source="sensor",
                    reference=sensor,
                    context=context,
                )
            )
        elif sensor.motion == 1 and context["period"] == "night":
            decisions.append(
                decision_payload(
                    decision_id="night-motion",
                    severity="info",
                    title="Night movement detected",
                    description="The PIR sensor detected movement during the configured night period.",
                    action="Check for disturbance if this repeats over multiple night readings.",
                    source="sensor",
                    reference=sensor,
                    context=context,
                )
            )

    decision_ids = {item["id"] for item in decisions}
    has_sick_image = "sick-droppings-analysis" in decision_ids
    has_environment_warning = bool(
        decision_ids.intersection({"high-temperature", "low-temperature", "high-humidity"})
    )
    has_activity_warning = "no-daylight-motion" in decision_ids

    if "high-temperature" in decision_ids and "high-humidity" in decision_ids:
        reference = sensor or prediction
        decisions.insert(
            0,
            decision_payload(
                decision_id="heat-stress-risk",
                severity="critical",
                title="Heat stress risk",
                description="High temperature and high humidity are present together.",
                action="Prioritize ventilation and check birds for heat stress.",
                source="combined",
                reference=reference,
                context=context,
            ),
        )

    if has_sick_image and (has_environment_warning or has_activity_warning):
        reference = prediction or sensor
        decisions.insert(
            0,
            decision_payload(
                decision_id="combined-health-risk",
                severity="critical",
                title="Combined health risk",
                description="Sick droppings analysis is present together with abnormal telemetry.",
                action="Prioritize this coop for immediate inspection and corrective action.",
                source="combined",
                reference=reference,
                context=context,
            ),
        )

    if not decisions and (sensor or prediction):
        reference = sensor or prediction
        decisions.append(
            decision_payload(
                decision_id="normal-monitoring",
                severity="normal",
                title="No immediate action",
                description="Latest available signals do not cross configured action thresholds.",
                action="Continue routine monitoring.",
                source="rules",
                reference=reference,
                context=context,
            )
        )

    return decisions


def latest_prediction_for_sensor(
    db: Session,
    sensor: models.IoTReading,
) -> models.ImageReading | None:
    return (
        db.query(models.ImageReading)
        .filter(
            models.ImageReading.device_id == sensor.device_id,
            models.ImageReading.farm_id == sensor.farm_id,
            models.ImageReading.coop_id == sensor.coop_id,
            models.ImageReading.timestamp <= sensor.timestamp,
            models.ImageReading.prediction_status.is_not(None),
        )
        .order_by(models.ImageReading.timestamp.desc(), models.ImageReading.created_at.desc())
        .first()
    )


def latest_sensor_for_prediction(
    db: Session,
    prediction: models.ImageReading,
) -> models.IoTReading | None:
    return (
        db.query(models.IoTReading)
        .filter(
            models.IoTReading.device_id == prediction.device_id,
            models.IoTReading.farm_id == prediction.farm_id,
            models.IoTReading.coop_id == prediction.coop_id,
            models.IoTReading.timestamp <= prediction.timestamp,
        )
        .order_by(models.IoTReading.timestamp.desc(), models.IoTReading.created_at.desc())
        .first()
    )


def local_day_bounds(target_date: date) -> tuple[datetime, datetime]:
    tz = decision_timezone()
    start_local = datetime.combine(target_date, time.min, tzinfo=tz)
    end_local = datetime.combine(target_date, time.max, tzinfo=tz)
    return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)


def parse_traceability_date(raw_date: str | None) -> date:
    if raw_date:
        return date.fromisoformat(raw_date)
    return datetime.now(decision_timezone()).date()


def numeric_summary(values: list[float]) -> dict:
    if not values:
        return {"min": None, "max": None, "avg": None}
    return {
        "min": min(values),
        "max": max(values),
        "avg": round(sum(values) / len(values), 2),
    }


def period_summary(readings: list[models.IoTReading], period: str) -> dict:
    period_readings = [
        reading for reading in readings if classify_period(reading.timestamp)["period"] == period
    ]
    motion_values = [reading.motion for reading in period_readings if reading.motion is not None]
    motion_detected = sum(1 for value in motion_values if value == 1)
    return {
        "period": period,
        "sensor_readings": len(period_readings),
        "temperature_c": numeric_summary(
            [reading.temperature_c for reading in period_readings if reading.temperature_c is not None]
        ),
        "humidity_percent": numeric_summary(
            [reading.humidity_percent for reading in period_readings if reading.humidity_percent is not None]
        ),
        "motion": {
            "readings": len(motion_values),
            "detected_count": motion_detected,
            "no_motion_count": len(motion_values) - motion_detected,
            "detected_percent": round((motion_detected / len(motion_values)) * 100, 1)
            if motion_values
            else None,
        },
    }


def aggregate_decisions(decisions: list[dict], limit: int) -> list[dict]:
    grouped: dict[tuple, dict] = {}
    severity_rank = {"critical": 0, "warning": 1, "info": 2, "normal": 3}
    for decision in decisions:
        if decision["severity"] == "normal":
            continue
        key = (
            decision["id"],
            decision.get("device_id"),
            decision.get("period"),
            decision.get("local_date"),
        )
        if key not in grouped:
            grouped[key] = {**decision, "occurrences": 0, "latest_event_timestamp": None}
        grouped[key]["occurrences"] += 1
        event_timestamp = decision.get("event_timestamp")
        if event_timestamp and (
            grouped[key]["latest_event_timestamp"] is None
            or event_timestamp > grouped[key]["latest_event_timestamp"]
        ):
            grouped[key]["latest_event_timestamp"] = event_timestamp

    return sorted(
        grouped.values(),
        key=lambda item: (
            severity_rank.get(item["severity"], 4),
            -(item["occurrences"]),
            item.get("latest_event_timestamp") or "",
        ),
    )[:limit]


def timeline_decision(decision: dict, timestamp: datetime | None = None) -> dict:
    if timestamp is None:
        return decision

    context = classify_period(timestamp)
    return {
        **decision,
        "period": context["period"],
        "timezone": context["timezone"],
        "local_date": context["local_date"],
        "local_time": context["local_time"],
        "event_timestamp": timestamp.isoformat(),
    }


def rule_action_timeline(decisions: list[dict]) -> list[dict]:
    seen: set[tuple] = set()
    actions = []
    for decision in decisions:
        if decision.get("severity") == "normal":
            continue
        key = (
            decision.get("id"),
            decision.get("device_id"),
            decision.get("event_timestamp"),
            decision.get("source"),
        )
        if key in seen:
            continue
        seen.add(key)
        actions.append(decision)

    return sorted(
        actions,
        key=lambda item: item.get("event_timestamp") or "",
        reverse=True,
    )


def build_daily_traceability(
    db: Session,
    *,
    traceability_date: str | None = None,
    farm_keys: set[str] | None = None,
    coop_keys: set[str] | None = None,
    device_id: str | None = None,
    decision_limit: int = 20,
) -> dict:
    target_date = parse_traceability_date(traceability_date)
    start_utc, end_utc = local_day_bounds(target_date)

    sensor_query = db.query(models.IoTReading).filter(
        models.IoTReading.timestamp >= start_utc,
        models.IoTReading.timestamp <= end_utc,
    )
    image_query = db.query(models.ImageReading).filter(
        models.ImageReading.timestamp >= start_utc,
        models.ImageReading.timestamp <= end_utc,
    )

    if farm_keys:
        sensor_query = sensor_query.filter(models.IoTReading.farm_id.in_(farm_keys))
        image_query = image_query.filter(models.ImageReading.farm_id.in_(farm_keys))
    if coop_keys:
        sensor_query = sensor_query.filter(models.IoTReading.coop_id.in_(coop_keys))
        image_query = image_query.filter(models.ImageReading.coop_id.in_(coop_keys))
    if device_id:
        sensor_query = sensor_query.filter(models.IoTReading.device_id == device_id)
        image_query = image_query.filter(models.ImageReading.device_id == device_id)

    sensor_readings = sensor_query.order_by(models.IoTReading.timestamp.asc()).all()
    image_readings = image_query.order_by(models.ImageReading.timestamp.asc()).all()
    predictions = [item for item in image_readings if item.prediction_status is not None]

    trace_decisions: list[dict] = []
    rule_actions: list[dict] = []
    for reading in sensor_readings:
        decisions = evaluate_health_decisions(reading, latest_prediction_for_sensor(db, reading))
        trace_decisions.extend(decisions)
        rule_actions.extend(
            timeline_decision(decision, reading.timestamp)
            for decision in decisions
            if decision.get("source") in {"sensor", "combined"}
        )
    for prediction in predictions:
        decisions = evaluate_health_decisions(latest_sensor_for_prediction(db, prediction), prediction)
        trace_decisions.extend(decisions)
        rule_actions.extend(
            timeline_decision(decision, prediction.timestamp)
            for decision in decisions
            if decision.get("source") in {"image", "combined"}
        )

    motion_values = [reading.motion for reading in sensor_readings if reading.motion is not None]
    motion_detected = sum(1 for value in motion_values if value == 1)

    return {
        "date": target_date.isoformat(),
        "timezone": DECISION_TIMEZONE,
        "daylight_window": {
            "start_hour": DECISION_DAYLIGHT_START_HOUR,
            "end_hour": DECISION_DAYLIGHT_END_HOUR,
        },
        "scope": {
            "farm_ids": sorted(farm_keys) if farm_keys else None,
            "coop_ids": sorted(coop_keys) if coop_keys else None,
            "device_id": device_id,
        },
        "sensor_readings_count": len(sensor_readings),
        "image_readings_count": len(image_readings),
        "droppings_analyses_count": len(predictions),
        "healthy_detections": sum(1 for item in predictions if item.prediction_status == "healthy"),
        "sick_detections": sum(1 for item in predictions if item.prediction_status == "sick"),
        "sensor_summary": {
            "temperature_c": numeric_summary(
                [reading.temperature_c for reading in sensor_readings if reading.temperature_c is not None]
            ),
            "humidity_percent": numeric_summary(
                [reading.humidity_percent for reading in sensor_readings if reading.humidity_percent is not None]
            ),
            "motion": {
                "readings": len(motion_values),
                "detected_count": motion_detected,
                "no_motion_count": len(motion_values) - motion_detected,
                "detected_percent": round((motion_detected / len(motion_values)) * 100, 1)
                if motion_values
                else None,
            },
        },
        "periods": [
            period_summary(sensor_readings, "daylight"),
            period_summary(sensor_readings, "night"),
        ],
        "decisions": aggregate_decisions(trace_decisions, decision_limit),
        "rule_actions": rule_action_timeline(rule_actions),
    }
