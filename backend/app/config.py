import os
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]

DATABASE_PATH = BACKEND_DIR / "poultry_iot.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH}")

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", str(BACKEND_DIR / "uploads")))
UPLOAD_PATH_PREFIX = "uploads"

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
}

DEFAULT_LIMIT = 20
MAX_LIMIT = 100

def get_bool_env(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "on"}


MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD")
MQTT_USE_TLS = get_bool_env("MQTT_USE_TLS")
MQTT_TLS_INSECURE = get_bool_env("MQTT_TLS_INSECURE")
MQTT_CLIENT_ID = os.getenv("MQTT_CLIENT_ID", "poultry-backend-mqtt-consumer")
MQTT_TOPIC_READINGS = os.getenv("MQTT_TOPIC_READINGS", "poultry/farm-01/coop-01/readings")
MQTT_TOPIC_READINGS_SUBSCRIPTION = os.getenv(
    "MQTT_TOPIC_READINGS_SUBSCRIPTION",
    "poultry/+/+/readings",
)

DECISION_TIMEZONE = os.getenv("DECISION_TIMEZONE", "Africa/Casablanca")
DECISION_DAYLIGHT_START_HOUR = int(os.getenv("DECISION_DAYLIGHT_START_HOUR", "6"))
DECISION_DAYLIGHT_END_HOUR = int(os.getenv("DECISION_DAYLIGHT_END_HOUR", "20"))

# Development default only. Production deployments must set a strong secret.
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-dev-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
