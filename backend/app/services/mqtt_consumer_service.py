import json
import logging

import paho.mqtt.client as mqtt
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

from app import models
from app.config import MQTT_BROKER_HOST, MQTT_BROKER_PORT, MQTT_TOPIC_READINGS_SUBSCRIPTION
from app.database import SessionLocal
from app.schemas import IoTReadingCreate
from app.services.device_auth_service import get_authenticated_device, validate_payload_matches_device


logger = logging.getLogger(__name__)
_mqtt_client: mqtt.Client | None = None


def start_mqtt_consumer() -> None:
    """
    Start the MQTT consumer loop for sensor-only readings.

    MQTT is used for lightweight telemetry. Image upload stays on HTTP because
    multipart/form-data is a better fit for larger binary camera captures.
    """
    global _mqtt_client
    if _mqtt_client is not None:
        return

    client = mqtt.Client(client_id="poultry-backend-mqtt-consumer")
    client.on_connect = _on_connect
    client.on_message = _on_message
    client.on_disconnect = _on_disconnect
    client.reconnect_delay_set(min_delay=1, max_delay=30)

    try:
        client.connect_async(MQTT_BROKER_HOST, MQTT_BROKER_PORT, keepalive=60)
        client.loop_start()
        _mqtt_client = client
        logger.info(
            "MQTT consumer starting: broker=%s:%s topic=%s",
            MQTT_BROKER_HOST,
            MQTT_BROKER_PORT,
            MQTT_TOPIC_READINGS_SUBSCRIPTION,
        )
    except Exception:
        logger.exception("MQTT consumer failed to start")


def stop_mqtt_consumer() -> None:
    """Stop the background MQTT network loop on FastAPI shutdown."""
    global _mqtt_client
    if _mqtt_client is None:
        return

    _mqtt_client.loop_stop()
    _mqtt_client.disconnect()
    _mqtt_client = None
    logger.info("MQTT consumer stopped")


def _on_connect(client: mqtt.Client, userdata, flags, rc) -> None:
    if rc == 0:
        client.subscribe(MQTT_TOPIC_READINGS_SUBSCRIPTION)
        logger.info("MQTT consumer connected and subscribed to %s", MQTT_TOPIC_READINGS_SUBSCRIPTION)
    else:
        logger.warning("MQTT consumer connection failed with rc=%s", rc)


def _on_disconnect(client: mqtt.Client, userdata, rc) -> None:
    if rc != 0:
        logger.warning("MQTT consumer disconnected unexpectedly with rc=%s", rc)


def _on_message(client: mqtt.Client, userdata, message: mqtt.MQTTMessage) -> None:
    try:
        payload_text = message.payload.decode("utf-8")
    except UnicodeDecodeError:
        logger.warning("Invalid MQTT message on %s: payload is not UTF-8", message.topic)
        return

    try:
        raw_payload = json.loads(payload_text)
    except json.JSONDecodeError as error:
        logger.warning("Invalid MQTT message on %s: bad JSON: %s", message.topic, error)
        return

    try:
        payload = IoTReadingCreate.model_validate(raw_payload)
    except ValidationError as error:
        logger.warning("Invalid MQTT message on %s: schema validation failed: %s", message.topic, error)
        return

    api_key = payload.metadata.api_key if payload.metadata else None
    db = SessionLocal()
    try:
        device = get_authenticated_device(db, payload.device.device_id, api_key)
        validate_payload_matches_device(payload, device)
        reading_id = _store_mqtt_reading(db, payload)
        logger.info("Stored MQTT reading id=%s message_id=%s", reading_id, payload.message_id)
    except HTTPException as error:
        logger.warning(
            "Rejected MQTT reading message_id=%s: %s %s",
            payload.message_id,
            error.status_code,
            error.detail,
        )
    except IntegrityError:
        db.rollback()
        logger.warning("Rejected MQTT reading message_id=%s: duplicate message_id", payload.message_id)
    except Exception:
        db.rollback()
        logger.exception("Failed to process MQTT reading message_id=%s", payload.message_id)
    finally:
        db.close()


def _store_mqtt_reading(db, payload: IoTReadingCreate) -> int:
    metadata = payload.metadata
    reading = models.IoTReading(
        schema_version=payload.schema_version,
        message_id=payload.message_id,
        device_id=payload.device.device_id,
        device_type=payload.device.device_type,
        firmware_version=payload.device.firmware_version,
        farm_id=payload.location.farm_id,
        coop_id=payload.location.coop_id,
        timestamp=payload.timestamp,
        temperature_c=payload.data.temperature_c,
        humidity_percent=payload.data.humidity_percent,
        weight_kg=payload.data.weight_kg,
        battery_percent=metadata.battery_percent if metadata else None,
        wifi_rssi=metadata.wifi_rssi if metadata else None,
        source=metadata.source if metadata else None,
    )

    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading.id
