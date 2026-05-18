# Architecture

Current development architecture:

```text
Farm
        ↓
Coops
        ↓
Camera devices / registered IoT devices
        ↓
Sensor readings + poultry droppings image analyses
        ↓
Reports and health alerts

ESP32 / Laptop Simulator sensor data
        ↓
MQTT Broker
        ↓
FastAPI Backend MQTT Consumer
        ↓
Device Registry validation
        ↓
SQLite Database
        ↓
Dashboard API endpoints
        ↓
Future Dashboard / Mobile App

ESP32-CAM / Laptop Simulator captures poultry droppings image
        ↓ authenticated HTTP multipart request
FastAPI backend receives droppings image upload
        ↓ Device Registry validation
AI model classifies droppings image
        ↓
Disease prediction is stored in SQLite
        ↓
Dashboard API endpoints
        ↓
Dashboard shows health alerts
```

## Components

`simulator/` replaces the ESP32/ESP32-CAM during development. It sends the same
payload format the real firmware will send later.

`backend/app/` receives HTTP poultry droppings image readings, HTTP sensor
readings, and MQTT sensor readings. It validates metadata, saves droppings
images to disk, authenticates registered devices, calls the prediction service
for fecal image classification, and stores metadata in SQLite.

`backend/app/services/` keeps storage, MQTT, authentication, and prediction
logic outside route handlers, making it easier to add dashboard APIs, a real AI
model, and deployment concerns later.

`backend/app/services/device_auth_service.py` hashes API keys for storage and
validates `X-Device-Id` / `X-Device-Api-Key` headers for protected HTTP IoT POST
requests. MQTT messages use the same registry and include the API key in
`metadata.api_key`.

`backend/app/services/mqtt_consumer_service.py` subscribes to MQTT sensor
topics, validates payloads with the same Pydantic schema as HTTP, authenticates
the device, and stores valid readings.

`backend/app/api/dashboard.py` exposes read-only summary, latest status,
history, and health alert endpoints for a future dashboard or mobile app.

`backend/app/ai_model/` contains the real droppings image classifier with mock
fallback. Its public adapter is
`predict_poultry_disease(image_path: str) -> dict`.

The AI model classifies poultry droppings images into disease-related classes:
Coccidiosis, Newcastle Disease, Salmonella, and Healthy.

## Farm Management Layer

`Farm`, `Coop`, and `CameraDevice` provide the product hierarchy for a real farm
operations platform. The existing `Device` table remains the API-key
authentication registry used by ESP32 devices and the simulator. Management
camera rows are synchronized from registered devices so existing IoT ingestion
continues to work.

Reports are JSON endpoints today:

```text
GET /api/farms/{farm_id}/report
GET /api/coops/{coop_id}/report
GET /api/reports/options
```

They summarize devices, readings, droppings analyses, and recent health alerts.
PDF export can be added later.

Live camera streaming is planned but not implemented. The frontend and data
model include `stream_url` and stream placeholders for future ESP32-CAM/IP camera
integration.
