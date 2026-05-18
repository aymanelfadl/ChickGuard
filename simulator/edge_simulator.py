import argparse
import json
import random
import time
import uuid
from pathlib import Path
from datetime import datetime, timezone

import requests


# Backend API endpoints. The sensor-only URL sends JSON, while the droppings
# image URL sends multipart/form-data with droppings image bytes plus JSON metadata.
BACKEND_URL = "http://localhost:8000/api/iot/readings"
BACKEND_IMAGE_URL = "http://localhost:8000/api/iot/image-reading"

# Local Mosquitto broker and topic used for sensor-only MQTT telemetry.
MQTT_BROKER_HOST = "localhost"
MQTT_BROKER_PORT = 1883
MQTT_TOPIC_READINGS = "poultry/farm-01/coop-01/readings"

# The simulator owns its own sample droppings image folder and stays separate
# from the backend package. Put files such as
# simulator/sample_images/healthy_droppings_01.jpg there.
SIMULATOR_DIR = Path(__file__).resolve().parent
IMAGE_FOLDER = SIMULATOR_DIR / "sample_images"

# Stable identifiers for this simulated edge device and its location.
DEVICE_ID = "esp32-sim-01"
DEVICE_API_KEY = "dev-secret-key"
FARM_ID = "farm-01"
COOP_ID = "coop-01"

# The simulator sends one message every 5 seconds, like a periodic ESP32 task.
SEND_INTERVAL_SECONDS = 5

IMAGE_CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}


def auth_headers() -> dict:
    """Headers used by the simulator and later by real ESP32 firmware."""
    return {
        "X-Device-Id": DEVICE_ID,
        "X-Device-Api-Key": DEVICE_API_KEY,
    }


def utc_timestamp() -> str:
    """Return an ISO 8601 UTC timestamp using the same format as the ESP32 payload."""
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def generate_sensor_data() -> dict:
    """Generate realistic fake poultry coop sensor values for development testing."""
    return {
        "temperature_c": round(random.uniform(28.0, 36.0), 1),
        "humidity_percent": random.randint(55, 85),
        "weight_kg": round(random.uniform(0.8, 2.6), 2),
    }


def generate_device_metadata(include_api_key: bool = False) -> dict:
    """Generate device health and connection metadata that would come from the ESP32."""
    metadata = {
        "battery_percent": random.randint(45, 100),
        "wifi_rssi": random.randint(-85, -45),
        "source": "simulator",
    }
    if include_api_key:
        metadata["api_key"] = DEVICE_API_KEY
    return metadata


def build_payload(
    message_id_prefix: str | None = None,
    include_api_key: bool = False,
) -> dict:
    """
    Build the versioned JSON metadata payload.

    Future sensors should be added inside the data object so the backend
    contract stays stable for both this simulator and the real ESP32-CAM.
    """
    message_id = str(uuid.uuid4())
    if message_id_prefix:
        safe_prefix = "".join(
            character if character.isalnum() or character in "_.-" else "_"
            for character in message_id_prefix
        ).strip("._")
        if safe_prefix:
            message_id = f"{safe_prefix}-{message_id}"

    return {
        "schema_version": "1.0",
        "message_id": message_id,
        "device": {
            "device_id": DEVICE_ID,
            "device_type": "ESP32-CAM",
            "firmware_version": "sim-1.0.0",
        },
        "location": {
            "farm_id": FARM_ID,
            "coop_id": COOP_ID,
        },
        "timestamp": utc_timestamp(),
        "data": generate_sensor_data(),
        "metadata": generate_device_metadata(include_api_key=include_api_key),
    }


def find_sample_images() -> list[Path]:
    """Return supported JPEG/PNG droppings images from sample_images/."""
    if not IMAGE_FOLDER.exists():
        raise FileNotFoundError(f"Droppings image folder not found: {IMAGE_FOLDER}")

    images = [
        path
        for path in IMAGE_FOLDER.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_CONTENT_TYPES
    ]
    if not images:
        raise FileNotFoundError(
            f"No .jpg, .jpeg, or .png droppings images found in {IMAGE_FOLDER}"
        )
    return images


def select_sample_image() -> Path:
    """Pick one local poultry droppings image to simulate an ESP32-CAM capture."""
    return random.choice(find_sample_images())


def print_backend_response(response: requests.Response) -> None:
    """Print the backend response body as JSON when possible."""
    print(f"Backend response status: {response.status_code}")
    try:
        print("Backend response body:")
        print(json.dumps(response.json(), indent=2))
    except ValueError:
        print("Backend response body:")
        print(response.text)


def send_sensor_payload(payload: dict) -> None:
    """Send one sensor-only JSON payload to the existing backend endpoint."""
    print("\nSending sensor-only payload:")
    print(json.dumps(payload, indent=2))

    try:
        response = requests.post(BACKEND_URL, json=payload, headers=auth_headers(), timeout=10)
        print_backend_response(response)
    except requests.exceptions.RequestException as error:
        print(f"Connection error while sending sensor payload: {error}")


def publish_mqtt_sensor_payload(payload: dict) -> None:
    """Publish one sensor-only reading to Mosquitto using MQTT."""
    try:
        import paho.mqtt.client as mqtt
    except ImportError:
        print("paho-mqtt is not installed. Run: python -m pip install -r requirements.txt")
        return

    print("\nPublishing MQTT sensor payload:")
    print(f"Broker: {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}")
    print(f"Topic: {MQTT_TOPIC_READINGS}")
    print(json.dumps(payload, indent=2))

    client = None
    try:
        client = create_mqtt_client(mqtt, client_id=f"poultry-simulator-{uuid.uuid4()}")
        client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, keepalive=60)
        client.loop_start()
        result = client.publish(MQTT_TOPIC_READINGS, json.dumps(payload), qos=1)
        result.wait_for_publish()

        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print("MQTT publish status: success")
        else:
            print(f"MQTT publish status: failed rc={result.rc}")
    except OSError as error:
        print(f"Connection error while publishing MQTT payload: {error}")
    finally:
        if client is not None:
            client.loop_stop()
            client.disconnect()


def create_mqtt_client(mqtt_module, client_id: str):
    """Create a Paho client without deprecation warnings on newer versions."""
    if hasattr(mqtt_module, "CallbackAPIVersion"):
        return mqtt_module.Client(
            callback_api_version=mqtt_module.CallbackAPIVersion.VERSION2,
            client_id=client_id,
        )
    return mqtt_module.Client(client_id=client_id)


def send_image_payload(payload: dict, image_path: Path) -> None:
    """
    Send one multipart poultry droppings image reading.

    requests builds multipart/form-data when files= is provided. The metadata
    field stays a JSON string, matching what a real ESP32-CAM can send later.
    """
    content_type = IMAGE_CONTENT_TYPES[image_path.suffix.lower()]

    print("\nSelected droppings image path:")
    print(image_path)
    print("Metadata sent:")
    print(json.dumps(payload, indent=2))

    try:
        with image_path.open("rb") as image_file:
            response = requests.post(
                BACKEND_IMAGE_URL,
                data={"metadata": json.dumps(payload)},
                files={"image": (image_path.name, image_file, content_type)},
                headers=auth_headers(),
                timeout=30,
            )
        print_backend_response(response)
    except requests.exceptions.RequestException as error:
        print(f"Connection error while sending droppings image payload: {error}")


def run_sensor_http_mode(send_once: bool) -> None:
    """Run sensor-only mode over the existing HTTP endpoint."""
    print(f"Starting HTTP sensor simulator for device {DEVICE_ID}")
    print(f"Sending readings to {BACKEND_URL} every {SEND_INTERVAL_SECONDS} seconds")

    while True:
        send_sensor_payload(build_payload())
        if send_once:
            break
        time.sleep(SEND_INTERVAL_SECONDS)


def run_sensor_mqtt_mode(send_once: bool) -> None:
    """Run sensor-only mode over MQTT."""
    print(f"Starting MQTT sensor simulator for device {DEVICE_ID}")
    print(f"Publishing readings to {MQTT_TOPIC_READINGS} every {SEND_INTERVAL_SECONDS} seconds")

    while True:
        publish_mqtt_sensor_payload(build_payload(include_api_key=True))
        if send_once:
            break
        time.sleep(SEND_INTERVAL_SECONDS)


def run_image_http_mode(send_once: bool) -> None:
    """Run the ESP32-CAM-style HTTP droppings image upload simulator mode."""
    print(f"Starting HTTP droppings image simulator for device {DEVICE_ID}")
    print(f"Reading sample droppings images from {IMAGE_FOLDER}")
    print(f"Sending droppings image readings to {BACKEND_IMAGE_URL} every {SEND_INTERVAL_SECONDS} seconds")

    while True:
        try:
            image_path = select_sample_image()
            send_image_payload(build_payload(message_id_prefix=image_path.stem), image_path)
        except FileNotFoundError as error:
            print(error)
            break

        if send_once:
            break
        time.sleep(SEND_INTERVAL_SECONDS)


def main() -> None:
    """Choose HTTP sensor, MQTT sensor, or HTTP droppings image mode from the command line."""
    parser = argparse.ArgumentParser(description="Poultry IoT ESP32/ESP32-CAM simulator")
    parser.add_argument(
        "--mode",
        choices=["sensor-http", "sensor-mqtt", "image-http", "sensor", "image"],
        default="sensor-http",
        help="Use sensor-http, sensor-mqtt, or image-http. sensor/image remain aliases.",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Send one payload and exit instead of looping forever.",
    )
    args = parser.parse_args()

    if args.mode in {"image-http", "image"}:
        run_image_http_mode(args.once)
    elif args.mode == "sensor-mqtt":
        run_sensor_mqtt_mode(args.once)
    else:
        run_sensor_http_mode(args.once)


if __name__ == "__main__":
    main()
