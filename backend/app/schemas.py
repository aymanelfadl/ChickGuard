from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DevicePayload(BaseModel):
    device_id: str = Field(..., min_length=1)
    device_type: Optional[str] = None
    firmware_version: Optional[str] = None


class LocationPayload(BaseModel):
    farm_id: str = Field(..., min_length=1)
    coop_id: str = Field(..., min_length=1)


class SensorDataPayload(BaseModel):
    # Future sensors can be added without changing the top-level API contract.
    model_config = ConfigDict(extra="allow")

    temperature_c: Optional[float] = None
    humidity_percent: Optional[float] = None
    motion: Optional[int] = Field(default=None, ge=0, le=1)
    weight_kg: Optional[float] = None


class MetadataPayload(BaseModel):
    battery_percent: Optional[float] = None
    wifi_rssi: Optional[int] = None
    source: Optional[str] = None
    api_key: Optional[str] = None


class IoTReadingCreate(BaseModel):
    """
    Pydantic validates the shared simulator/ESP32 payload before storage.

    The backend stays independent from the sender by accepting the same schema
    from the laptop simulator and real ESP32/ESP32-CAM firmware.
    """

    schema_version: str = Field(..., min_length=1)
    message_id: str = Field(..., min_length=1)
    device: DevicePayload
    location: LocationPayload
    timestamp: datetime
    data: SensorDataPayload
    metadata: Optional[MetadataPayload] = None

    @field_validator("timestamp")
    @classmethod
    def timestamp_must_include_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("timestamp must include a timezone, for example 2026-05-17T12:00:00Z")
        return value.astimezone(timezone.utc)


class IoTReadingAck(BaseModel):
    status: str
    message: str
    reading_id: int
    device_id: str


class IoTReadingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    schema_version: str
    message_id: str
    device_id: str
    device_type: Optional[str]
    firmware_version: Optional[str]
    farm_id: str
    coop_id: str
    timestamp: datetime
    temperature_c: Optional[float]
    humidity_percent: Optional[float]
    motion: Optional[int]
    weight_kg: Optional[float]
    battery_percent: Optional[float]
    wifi_rssi: Optional[int]
    source: Optional[str]
    created_at: datetime


class ImageReadingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    schema_version: str
    message_id: str
    device_id: str
    device_type: Optional[str]
    firmware_version: Optional[str]
    farm_id: str
    coop_id: str
    timestamp: datetime
    temperature_c: Optional[float]
    humidity_percent: Optional[float]
    motion: Optional[int]
    weight_kg: Optional[float]
    battery_percent: Optional[float]
    wifi_rssi: Optional[int]
    source: Optional[str]
    image_path: str
    image_filename: str
    image_content_type: str
    image_size_bytes: int
    prediction_status: Optional[str]
    disease_type: Optional[str]
    raw_label: Optional[str]
    confidence: Optional[float]
    created_at: datetime


class DeviceRegisterCreate(BaseModel):
    device_id: str = Field(..., min_length=1)
    name: Optional[str] = None
    device_type: str = Field(..., min_length=1)
    camera_type: Optional[str] = None
    farm_id: str = Field(..., min_length=1)
    coop_id: str = Field(..., min_length=1)
    stream_url: Optional[str] = None
    location_label: Optional[str] = None
    description: Optional[str] = None
    api_key: Optional[str] = Field(default=None, min_length=8)


class DeviceRegisterAck(BaseModel):
    status: str
    message: str
    device_id: str
    api_key: Optional[str] = None
    device: Optional[dict] = None


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    farm_id: Optional[str] = None
    coop_id: Optional[str] = None
    device_type: Optional[str] = None
    camera_type: Optional[str] = None
    stream_url: Optional[str] = None
    location_label: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class DeviceHeartbeatCreate(BaseModel):
    farm_id: str = Field(..., min_length=1)
    coop_id: str = Field(..., min_length=1)
    device_type: str = Field(..., min_length=1)
    status: Literal["online"]


class DeviceHeartbeatAck(BaseModel):
    status: str
    message: str
    device_id: str
    last_seen_at: Optional[str]


class DeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: str
    name: Optional[str]
    device_type: str
    camera_type: Optional[str]
    farm_id: str
    coop_id: str
    stream_url: Optional[str]
    location_label: Optional[str]
    description: Optional[str]
    api_key_configured: bool
    is_active: bool
    status: str
    last_seen_at: Optional[str]
    last_event_type: Optional[str]
    created_at: datetime


class FarmCreate(BaseModel):
    name: str = Field(..., min_length=1)
    location: Optional[str] = None
    description: Optional[str] = None


class FarmOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    location: Optional[str]
    description: Optional[str]
    created_at: datetime


class FarmSummary(FarmOut):
    number_of_coops: int
    number_of_devices: int
    active_alerts: int
    latest_health_status: Optional[str]


class CoopCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    capacity: Optional[int] = Field(default=None, ge=0)


class CoopOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    farm_id: int
    name: str
    description: Optional[str]
    capacity: Optional[int]
    created_at: datetime


class CoopSummary(CoopOut):
    number_of_devices: int
    active_alerts: int
    latest_health_status: Optional[str]


class CameraDeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: str
    farm_id: int
    coop_id: int
    name: str
    device_type: str
    camera_type: Optional[str]
    stream_url: Optional[str]
    location_label: Optional[str]
    description: Optional[str]
    is_active: bool
    status: str
    last_seen_at: Optional[str]
    last_event_type: Optional[str]
    created_at: datetime
    latest_prediction: Optional[dict] = None


class DeviceDetailOut(DeviceOut):
    camera: Optional[CameraDeviceOut] = None
    latest_prediction: Optional[dict] = None
    latest_sensor: Optional[dict] = None


class UserRegisterCreate(BaseModel):
    email: str = Field(..., min_length=3)
    full_name: str = Field(..., min_length=1)
    password: str = Field(..., min_length=6)

    @field_validator("email")
    @classmethod
    def email_must_look_valid(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized:
            raise ValueError("email must be valid")
        return normalized


class UserLoginCreate(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str


class UserMe(UserPublic):
    is_active: bool


class UserRegisterAck(BaseModel):
    status: str
    message: str
    user: UserPublic


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserPublic


class DashboardOverview(BaseModel):
    total_devices: int
    active_devices: int
    total_sensor_readings: int
    total_image_readings: int
    healthy_detections: int
    sick_detections: int
    latest_reading_at: Optional[str]


class DashboardLatestSensor(BaseModel):
    temperature_c: Optional[float]
    humidity_percent: Optional[float]
    motion: Optional[int]
    weight_kg: Optional[float]
    timestamp: Optional[str]


class DashboardLatestPrediction(BaseModel):
    prediction_status: Optional[str]
    disease_type: Optional[str]
    confidence: Optional[float]
    image_path: Optional[str]
    timestamp: Optional[str]


class DashboardLatestStatus(BaseModel):
    device_id: Optional[str]
    farm_id: Optional[str]
    coop_id: Optional[str]
    latest_sensor: Optional[DashboardLatestSensor]
    latest_prediction: Optional[DashboardLatestPrediction]
    decisions: list[dict] = Field(default_factory=list)


class DashboardHealthHistoryItem(BaseModel):
    timestamp: str
    device_id: str
    farm_id: str
    coop_id: str
    temperature_c: Optional[float]
    humidity_percent: Optional[float]
    motion: Optional[int]
    weight_kg: Optional[float]
    prediction_status: Optional[str]
    disease_type: Optional[str]
    confidence: Optional[float]


class DashboardAlert(BaseModel):
    id: int
    device_id: str
    farm_id: str
    coop_id: str
    disease_type: Optional[str]
    confidence: Optional[float]
    image_path: str
    timestamp: str
    created_at: str
