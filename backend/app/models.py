from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String

from app.database import Base


class Device(Base):
    """Registered ESP32/ESP32-CAM or simulator allowed to send IoT readings."""

    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), unique=True, index=True, nullable=False)
    device_type = Column(String(100), nullable=False)
    farm_id = Column(String(100), index=True, nullable=False)
    coop_id = Column(String(100), index=True, nullable=False)
    api_key_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


class IoTReading(Base):
    """Sensor-only readings received from ESP32 devices or the simulator."""

    __tablename__ = "iot_readings"

    id = Column(Integer, primary_key=True, index=True)
    schema_version = Column(String(20), nullable=False)
    message_id = Column(String(120), unique=True, index=True, nullable=False)

    device_id = Column(String(100), index=True, nullable=False)
    device_type = Column(String(100), nullable=True)
    firmware_version = Column(String(100), nullable=True)

    farm_id = Column(String(100), index=True, nullable=False)
    coop_id = Column(String(100), index=True, nullable=False)

    timestamp = Column(DateTime(timezone=True), index=True, nullable=False)

    temperature_c = Column(Float, nullable=True)
    humidity_percent = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)

    battery_percent = Column(Float, nullable=True)
    wifi_rssi = Column(Integer, nullable=True)
    source = Column(String(50), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


class ImageReading(Base):
    """Image readings received from ESP32-CAM devices or the simulator."""

    __tablename__ = "image_readings"

    id = Column(Integer, primary_key=True, index=True)
    schema_version = Column(String(20), nullable=False)
    message_id = Column(String(120), unique=True, index=True, nullable=False)

    device_id = Column(String(100), index=True, nullable=False)
    device_type = Column(String(100), nullable=True)
    firmware_version = Column(String(100), nullable=True)

    farm_id = Column(String(100), index=True, nullable=False)
    coop_id = Column(String(100), index=True, nullable=False)

    timestamp = Column(DateTime(timezone=True), index=True, nullable=False)

    temperature_c = Column(Float, nullable=True)
    humidity_percent = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)

    battery_percent = Column(Float, nullable=True)
    wifi_rssi = Column(Integer, nullable=True)
    source = Column(String(50), nullable=True)

    image_path = Column(String(500), nullable=False)
    image_filename = Column(String(255), nullable=False)
    image_content_type = Column(String(100), nullable=False)
    image_size_bytes = Column(Integer, nullable=False)

    prediction_status = Column(String(50), nullable=True)
    disease_type = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
