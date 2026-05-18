# MQTT Sensor Readings

MQTT is used for lightweight sensor telemetry because it is efficient for small,
frequent messages from ESP32 devices. HTTP remains the poultry droppings image
upload path because multipart/form-data is simpler and more appropriate for
larger binary ESP32-CAM captures.

## Local Broker

The project uses Mosquitto for local development:

```bash
docker compose up -d
```

The broker listens on:

```text
localhost:1883
```

Local anonymous connections are allowed by `mosquitto/config/mosquitto.conf`.

## Backend Consumer

The FastAPI backend starts an MQTT consumer on app startup. It subscribes to:

```text
poultry/+/+/readings
```

Default simulator publish topic:

```text
poultry/farm-01/coop-01/readings
```

## Payload

MQTT sensor payloads use the same JSON schema as `POST /api/iot/readings`.
Because MQTT has no HTTP headers, the device API key is included in
`metadata.api_key`.

```json
{
  "schema_version": "1.0",
  "message_id": "unique-message-id",
  "device": {
    "device_id": "esp32-sim-01",
    "device_type": "ESP32-CAM",
    "firmware_version": "sim-1.0.0"
  },
  "location": {
    "farm_id": "farm-01",
    "coop_id": "coop-01"
  },
  "timestamp": "2026-05-17T12:00:00Z",
  "data": {
    "temperature_c": 31.5,
    "humidity_percent": 68,
    "weight_kg": 1.25
  },
  "metadata": {
    "battery_percent": 82,
    "wifi_rssi": -61,
    "source": "simulator",
    "api_key": "dev-secret-key"
  }
}
```

The backend validates this payload with the existing Pydantic schema, checks the
device registry, verifies the API key hash, and stores the reading in SQLite.

## Simulator

From `simulator/`:

```bash
python edge_simulator.py --mode sensor-mqtt --once
```

Then check stored readings:

```bash
curl "http://localhost:8000/api/iot/readings?limit=5"
```

## Future ESP32 Usage

The ESP32 firmware will publish the same JSON shape to the same topic structure:

```text
poultry/{farm_id}/{coop_id}/readings
```

The backend remains independent of whether the sender is the simulator or real
firmware as long as the payload contract and device registry credentials match.
