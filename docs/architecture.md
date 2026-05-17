# Architecture

Current development architecture:

```text
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

ESP32-CAM / Laptop Simulator image data
        ↓ authenticated HTTP multipart request
FastAPI Backend
        ↓ Device Registry validation
        ↓ Mock AI Predictor now / Real AI Model later
SQLite Database
        ↓
Dashboard API endpoints
        ↓
Future Dashboard / Mobile App
```

## Components

`simulator/` replaces the ESP32/ESP32-CAM during development. It sends the same
payload format the real firmware will send later.

`backend/app/` receives HTTP image readings, HTTP sensor readings, and MQTT
sensor readings. It validates metadata, saves images to disk, authenticates
registered devices, calls the prediction service for images, and stores metadata
in SQLite.

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
history, and alert endpoints for a future dashboard or mobile app.

`backend/app/ai_model/` contains the current mock predictor. Its public adapter
is `predict_poultry_disease(image_path: str) -> dict`.
