# Backend

FastAPI backend for the poultry health monitoring system.

## Farm Management Model

The backend now models the product hierarchy used by the management UI:

```text
Farm
  -> Coop
      -> CameraDevice
      -> Registered Device credentials
      -> Sensor readings
      -> Poultry droppings analyses
      -> Health alerts
```

`Device` remains the authentication registry for ESP32/simulator ingestion.
`CameraDevice` stores product-facing camera metadata such as name, camera type,
location label, status, and a future `stream_url`. Live video streaming is not
implemented yet; reports and UI cards expose placeholders for future
ESP32-CAM/IP camera integration.

`device_type` identifies the hardware or firmware, such as `esp32-cam`, `esp32`,
or `ip-camera`. `camera_type` describes the camera role in the coop, such as
`droppings-camera`, `overview-camera`, `environmental-camera`, or
`security-camera`.

Dashboard users register and manage device metadata with JWT authentication.
Physical devices and the simulator send telemetry, heartbeats, and poultry
droppings image uploads with `X-Device-Id` and `X-Device-Api-Key`.

Farm and coop reports return JSON for now, not PDF.

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

SQLite data persists in the `backend_data` volume, and uploaded poultry
droppings images persist in the `backend_uploads` volume.

## AI Model Assets

The droppings image predictor uses a real droppings image-only Keras model when
these files exist:

```text
backend/app/ai_model/model/chicken_disease_model.keras/
backend/app/ai_model/model/labels.json
```

Trained model assets are intentionally ignored by git so the repository stays
portable. Keep local assets under `backend/app/ai_model/model/`; the repo tracks
only `README.md`, `.gitkeep`, and `labels.example.json` in that directory.

The `.keras` path is an unzipped Keras directory, not a single file:

```text
backend/app/ai_model/model/chicken_disease_model.keras/
├── config.json
├── metadata.json
└── model.weights.h5
```

`labels.json` must keep the exact training output order. Do not sort or rename
these values, because each index maps directly to the model prediction index:

```json
[
  "cocci",
  "healty",
  "ncd",
  "pcrcocci",
  "pcrhealthy",
  "pcrncd",
  "pcrsalmo",
  "salmo"
]
```

The AI model classifies poultry droppings images into disease-related classes:

- Coccidiosis
- Newcastle Disease
- Salmonella
- Healthy

For local setup, copy the example labels file and extract the model zip:

```bash
cd backend/app/ai_model/model
cp labels.example.json labels.json
unzip /path/to/chicken_disease_model.keras.zip -d chicken_disease_model.keras
```

If the zip already contains a top-level `chicken_disease_model.keras/`
directory, extract it directly into `backend/app/ai_model/model/`. If the zip
contains `config.json`, `metadata.json`, and `model.weights.h5` at the archive
root, extract it into the `chicken_disease_model.keras/` directory.

The backend loads the model lazily on the first droppings image prediction with
`tf.keras.models.load_model(...)`. If the model directory, labels file, or
TensorFlow runtime is missing during development, the backend logs a warning and
uses the deterministic mock predictor fallback.

Prediction responses include the droppings analysis label and dashboard-friendly
mapping:

```json
{
  "prediction_status": "sick",
  "disease_type": "Coccidiosis",
  "raw_label": "cocci",
  "confidence": 0.88
}
```

The `raw_label` column is added automatically for local SQLite databases. If a
development database still has schema issues after pulling this change, reset the
Docker volumes from the project root:

```bash
docker compose down -v
```

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
- `GET /api/devices/{device_id}`
- `PATCH /api/devices/{device_id}`
- `PATCH /api/devices/{device_id}/deactivate`
- `GET /api/farms`
- `POST /api/farms`
- `GET /api/farms/{farm_id}`
- `GET /api/farms/{farm_id}/coops`
- `POST /api/farms/{farm_id}/coops`
- `GET /api/coops/{coop_id}`
- `GET /api/coops/{coop_id}/devices`
- `GET /api/farms/{farm_id}/report`
- `GET /api/coops/{coop_id}/report`
- `GET /api/reports/options`
- `POST /api/iot/readings`
- `GET /api/iot/readings`
- `POST /api/iot/image-reading`
- `GET /api/iot/image-readings`
- `GET /api/dashboard/overview`
- `GET /api/dashboard/latest-status`
- `GET /api/dashboard/health-history`
- `GET /api/dashboard/alerts`

## Register a Development Device

IoT POST endpoints require device credentials. Create the farm and coop first
through the dashboard or `POST /api/farms` and
`POST /api/farms/{farm_id}/coops`. Then an admin dashboard user registers the
simulator or camera once with a JWT:

```bash
curl -X POST http://localhost:8000/api/devices/register \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "esp32-sim-01",
    "name": "Coop 01 Simulator Camera",
    "farm_id": "farm-01",
    "coop_id": "coop-01",
    "device_type": "esp32-cam",
    "camera_type": "droppings-camera",
    "stream_url": "http://example.local/stream",
    "location_label": "Coop 01 - East side",
    "description": "Development camera focused on the droppings collection area",
    "api_key": "dev-secret-key"
  }'
```

Expected response:

```json
{
  "status": "success",
  "message": "Device registered",
  "device_id": "esp32-sim-01",
  "api_key": null,
  "device": {
    "device_id": "esp32-sim-01",
    "name": "Coop 01 Simulator Camera",
    "device_type": "esp32-cam",
    "camera_type": "droppings-camera"
  }
}
```

If `api_key` is omitted, the backend generates one and returns it once in the
`api_key` response field. Copy that key immediately and configure the physical
device or simulator. Raw API keys are never stored in SQLite. The backend stores
only a salted hash and verifies incoming keys with constant-time comparison.

Update camera metadata:

```bash
curl -X PATCH http://localhost:8000/api/devices/esp32-sim-01 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coop 01 East Droppings Camera",
    "camera_type": "droppings-camera",
    "location_label": "Coop 01 - East side",
    "description": "Primary fecal image classification camera"
  }'
```

List devices:

```bash
curl http://localhost:8000/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Deactivate a device:

```bash
curl -X PATCH http://localhost:8000/api/devices/esp32-sim-01/deactivate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Authenticated IoT requests must include:

```bash
-H "X-Device-Id: esp32-sim-01"
-H "X-Device-Api-Key: dev-secret-key"
```

## Droppings Image Reading Test

Use a new `message_id` for each request.
The route name remains `/api/iot/image-reading` for compatibility; the uploaded
file should be a poultry droppings/fecal sample image.

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
    "raw_label": "healty",
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

These endpoints are ready for a future web dashboard or mobile app. Health
alerts are based on poultry droppings image analysis.

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

Health alerts from droppings analysis:

```bash
curl "http://localhost:8000/api/dashboard/alerts?limit=20"
```

## Storage

SQLite stays at:

```text
backend/poultry_iot.db
```

Uploaded poultry droppings images stay at:

```text
backend/uploads/{device_id}/{YYYY-MM-DD}/{message_id}.{extension}
```

Only droppings image paths and metadata are stored in SQLite. Image binaries are
stored on disk.

## AI Predictor And Mock Fallback

The AI adapter accepts a saved poultry droppings image path:

```python
predict_poultry_disease(image_path: str) -> dict
```

When local Keras model assets are present, it performs fecal image
classification. If the model is unavailable during development, the deterministic
mock fallback checks the saved filename for labels such as `healthy`,
`coccidiosis`, `newcastle`, and `salmonella`. The route calls the adapter through
`app/services/prediction_service.py`, so the endpoint contract does not change.
