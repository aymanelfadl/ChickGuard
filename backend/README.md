# Backend

FastAPI backend for the poultry health monitoring system.

## Run Locally

Start Mosquitto from the project root:

```bash
docker compose up -d mosquitto
```

From this `backend/` directory:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

Local API:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

The backend starts an MQTT consumer on startup and subscribes to:

```text
poultry/+/+/readings
```

## Run With Docker

From the project root:

```bash
docker compose up --build
```

The backend container uses these Docker Compose settings:

```text
DATABASE_URL=sqlite:///./data/poultry_iot.db
UPLOAD_DIR=./uploads
MQTT_BROKER_HOST=mosquitto
MQTT_BROKER_PORT=1883
JWT_SECRET_KEY=change-this-dev-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

SQLite data persists in the `backend_data` volume, and uploaded images persist
in the `backend_uploads` volume.

## Dashboard User Authentication

Dashboard users authenticate with JWT Bearer tokens. This is separate from
device authentication, which still uses `X-Device-Id` and `X-Device-Api-Key`.

Register an admin user:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "full_name": "Admin User",
    "password": "admin123"
  }'
```

Log in:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Use the returned token for dashboard/read endpoints:

```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Protected dashboard endpoints return `401` without a valid token.

## Endpoints

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/devices/register`
- `GET /api/devices`
- `PATCH /api/devices/{device_id}/deactivate`
- `POST /api/iot/readings`
- `GET /api/iot/readings`
- `POST /api/iot/image-reading`
- `GET /api/iot/image-readings`
- `GET /api/dashboard/overview`
- `GET /api/dashboard/latest-status`
- `GET /api/dashboard/health-history`
- `GET /api/dashboard/alerts`

## Register a Development Device

IoT POST endpoints require device credentials. Register the simulator once:

```bash
curl -X POST http://localhost:8000/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "esp32-sim-01",
    "device_type": "ESP32-CAM",
    "farm_id": "farm-01",
    "coop_id": "coop-01",
    "api_key": "dev-secret-key"
  }'
```

Expected response:

```json
{
  "status": "success",
  "message": "Device registered",
  "device_id": "esp32-sim-01"
}
```

Raw API keys are never stored in SQLite. The backend stores only a salted hash
and verifies incoming keys with constant-time comparison.

List devices:

```bash
curl http://localhost:8000/api/devices
```

Deactivate a device:

```bash
curl -X PATCH http://localhost:8000/api/devices/esp32-sim-01/deactivate
```

Authenticated IoT requests must include:

```bash
-H "X-Device-Id: esp32-sim-01"
-H "X-Device-Api-Key: dev-secret-key"
```

## Image Reading Test

Use a new `message_id` for each request.

```bash
curl -X POST "http://localhost:8000/api/iot/image-reading" \
  -H "X-Device-Id: esp32-sim-01" \
  -H "X-Device-Api-Key: dev-secret-key" \
  -F "image=@../simulator/sample_images/healthy_01.jpeg;type=image/jpeg" \
  -F 'metadata={
    "schema_version": "1.0",
    "message_id": "healthy_01-test-001",
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
      "source": "simulator"
    }
  }'
```

Expected response shape:

```json
{
  "status": "success",
  "message": "Image reading received",
  "image_reading_id": 1,
  "device_id": "esp32-sim-01",
  "image_path": "uploads/esp32-sim-01/2026-05-17/healthy_01-test-001.jpg",
  "prediction": {
    "prediction_status": "healthy",
    "disease_type": null,
    "confidence": 0.94
  }
}
```

## Sensor Reading Test

```bash
curl -X POST "http://localhost:8000/api/iot/readings" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: esp32-sim-01" \
  -H "X-Device-Api-Key: dev-secret-key" \
  -d '{
    "schema_version": "1.0",
    "message_id": "sensor-test-001",
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
      "source": "simulator"
    }
  }'
```

## MQTT Sensor Readings

MQTT sensor readings use the same payload as `POST /api/iot/readings`, but the
API key is included in `metadata.api_key` because MQTT messages do not have HTTP
headers.

Start the broker:

```bash
docker compose up -d
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

Register the simulator device if needed, then run:

```bash
cd ../simulator
python edge_simulator.py --mode sensor-mqtt --once
```

Check that the reading was stored:

```bash
curl "http://localhost:8000/api/iot/readings?limit=5"
```

## Dashboard API

These endpoints are ready for a future web dashboard or mobile app.

Overview counts:

```bash
curl "http://localhost:8000/api/dashboard/overview" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Latest combined status:

```bash
curl "http://localhost:8000/api/dashboard/latest-status"
```

Health history:

```bash
curl "http://localhost:8000/api/dashboard/health-history?limit=50"
```

Filter history by device:

```bash
curl "http://localhost:8000/api/dashboard/health-history?device_id=esp32-sim-01&limit=20"
```

Sick-detection alerts:

```bash
curl "http://localhost:8000/api/dashboard/alerts?limit=20"
```

## Storage

SQLite stays at:

```text
backend/poultry_iot.db
```

Uploaded images stay at:

```text
backend/uploads/{device_id}/{YYYY-MM-DD}/{message_id}.{extension}
```

Only image paths and metadata are stored in SQLite. Image binaries are stored on
disk.

## Mock AI Predictor

The current AI layer is a deterministic mock:

```python
predict_poultry_disease(image_path: str) -> dict
```

It checks the saved filename for labels such as `healthy`, `coccidiosis`,
`newcastle`, and `salmonella`. The route calls it through
`app/services/prediction_service.py`, so the real model can replace the mock
without changing the API endpoint.
