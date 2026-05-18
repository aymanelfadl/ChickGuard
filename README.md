# IoT Poultry Health Monitoring

FastAPI backend, React dashboard, MQTT broker, and laptop IoT simulator for
poultry health monitoring.

The project supports dashboard user login with JWT, device registration,
API-key authenticated HTTP sensor readings, MQTT sensor readings, ESP32-CAM-style
HTTP poultry droppings image uploads, local droppings image storage, SQLite
persistence, dashboard-ready APIs, and a fecal image classification predictor
with mock fallback for development.

The product structure now follows a farm management hierarchy:

```text
Farm
  -> Coop
      -> Camera / Device
          -> Sensor readings
          -> Poultry droppings image analyses
          -> Health alerts
```

Live camera streaming is planned but not implemented yet. The frontend includes
camera cards with a stream placeholder for future ESP32-CAM/IP camera
integration. Farm and coop reports are JSON responses for now; PDF export can be
added later.

The repository does not include trained model assets. Add them locally under
`backend/app/ai_model/model/`; see
`backend/app/ai_model/model/README.md` for the expected Keras directory and
labels file layout.

## Architecture

```text
ESP32/ESP32-CAM or Laptop Simulator sensor data
        |
        v
MQTT Broker
        |
        v
FastAPI Backend MQTT Consumer
        |
        v
SQLite Database
        |
        v
Dashboard API endpoints
        |
        v
React Dashboard

ESP32-CAM / Laptop Simulator captures poultry droppings image
        |
        v
FastAPI backend receives authenticated droppings image upload
        |
        v
AI model classifies droppings image
        |
        v
Disease prediction is stored in SQLite
        |
        v
Dashboard shows health alerts
```

## Structure

```text
backend/      FastAPI app, SQLite database, uploads, droppings AI adapter
frontend/     React + Vite farm management UI served by nginx in Docker
simulator/    Laptop ESP32/ESP32-CAM simulator and sample droppings images
docs/         Architecture, payload, MQTT, and sprint notes
mosquitto/    Local Mosquitto broker configuration
```

## Model Validation

Run the local predictor validation tool against sample droppings images:

```bash
python -m pip install -r backend/requirements.txt
python scripts/validate_model_predictions.py
```

Use `--image-dir path/to/droppings-images` for a custom folder. The tool writes
`reports/model_validation_report.csv` and is intended for integration
validation, not full scientific model evaluation.

When TensorFlow is not installed locally, run validation inside the backend
Docker container:

```bash
docker compose up -d --build
make validate-model
```

See [docs/model_validation.md](docs/model_validation.md) for filename label
rules and report details.

## Docker

Build and start all services:

```bash
docker compose up --build
```

Start in the background:

```bash
docker compose up -d --build
```

Stop services:

```bash
docker compose down
```

Reset the persisted SQLite database and uploaded droppings images:

```bash
docker compose down -v
```

Service URLs:

```text
Frontend:    http://localhost:5173
Backend:     http://localhost:8000
API docs:    http://localhost:8000/docs
MQTT broker: localhost:1883
```

After the stack starts, register a dashboard user before opening the dashboard:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "full_name": "Admin User",
    "password": "admin123"
  }'
```

Docker volumes:

```text
backend_data     SQLite database at /app/data/poultry_iot.db
backend_uploads  Uploaded droppings images at /app/uploads
```

## Local Development

Start Mosquitto only:

```bash
docker compose up -d mosquitto
```

Run the backend directly on the host:

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

Run the frontend directly on the host:

```bash
cd frontend
npm install
npm run dev
```

## Register Simulator Device

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

If the response says the device already exists, you can continue.

## Run Simulator

```bash
cd simulator
python -m pip install -r requirements.txt
python edge_simulator.py --mode sensor-mqtt --once
```

Check that MQTT readings were stored:

```bash
curl "http://localhost:8000/api/iot/readings?limit=5"
```

Droppings image upload still uses HTTP:

```bash
python edge_simulator.py --mode image-http --once
```

The simulator runs on the host machine. Use `localhost` for both local and
Docker-backed services because Docker Compose exposes the backend and Mosquitto
ports to the host.

```text
BACKEND_URL=http://localhost:8000
MQTT_BROKER_HOST=localhost
```

## Verification Checklist

- `docker compose up --build` starts backend, frontend, and Mosquitto.
- `curl http://localhost:8000/health` returns `{"status":"ok"}`.
- API docs open at `http://localhost:8000/docs`.
- Frontend opens at `http://localhost:5173`.
- Mosquitto is reachable on `localhost:1883`.
- Simulator publishes MQTT sensor data to `localhost:1883`.
- Simulator uploads droppings images to `http://localhost:8000/api/iot/image-reading`.
- Uploaded droppings images persist in the `backend_uploads` volume.
- SQLite data persists in the `backend_data` volume.
- `docker compose down -v` removes persisted database and uploads.

See [backend/README.md](backend/README.md), [simulator/README.md](simulator/README.md),
and [docs/mqtt.md](docs/mqtt.md) for details.
