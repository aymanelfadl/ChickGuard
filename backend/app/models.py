from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String

from app.database import Base


class Device(Base):
    """Registered ESP32/ESP32-CAM or simulator allowed to send IoT readings."""

    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    device_type = Column(String(100), nullable=False)
    camera_type = Column(String(100), nullable=True)
    farm_id = Column(String(100), index=True, nullable=False)
    coop_id = Column(String(100), index=True, nullable=False)
    stream_url = Column(String(500), nullable=True)
    location_label = Column(String(255), nullable=True)
    description = Column(String(1000), nullable=True)
    api_key_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), nullable=False, default="offline")
    last_event_type = Column(String(50), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


class User(Base):
    """Human dashboard user authenticated with a password and JWT session."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="admin")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


class Farm(Base):
    """Farm managed by the platform."""

    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    location = Column(String(255), nullable=True)
    description = Column(String(1000), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


class Coop(Base):
    """Coop or house inside a farm."""

    __tablename__ = "coops"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), index=True, nullable=False)
    name = Column(String(255), index=True, nullable=False)
    description = Column(String(1000), nullable=True)
    capacity = Column(Integer, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


class CameraDevice(Base):
    """Camera/device presentation metadata linked to the device registry."""

    __tablename__ = "camera_devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), unique=True, index=True, nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), index=True, nullable=False)
    coop_id = Column(Integer, ForeignKey("coops.id"), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    device_type = Column(String(100), nullable=False)
    camera_type = Column(String(100), nullable=True)
    stream_url = Column(String(500), nullable=True)
    location_label = Column(String(255), nullable=True)
    description = Column(String(1000), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), nullable=False, default="offline")
    last_event_type = Column(String(50), nullable=True)
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
    motion = Column(Integer, nullable=True)
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
    """Droppings image readings received from ESP32-CAM devices or the simulator."""

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
    motion = Column(Integer, nullable=True)
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
    raw_label = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
