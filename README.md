# IoT Poultry Health Monitoring

FastAPI backend and laptop IoT simulator for poultry health monitoring.

The project currently supports device registration, API-key authenticated HTTP
sensor readings, MQTT sensor readings, ESP32-CAM-style HTTP image uploads, local
image storage, SQLite persistence, and a mock AI predictor that can be replaced
by a real model later.

## Architecture

```text
ESP32/ESP32-CAM or Laptop Simulator sensor data
        ↓
MQTT Broker
        ↓
FastAPI Backend MQTT Consumer
        ↓
SQLite Database

ESP32-CAM or Laptop Simulator image data
        ↓ authenticated HTTP multipart request
FastAPI Backend
        ↓ Device Registry validation
        ↓ Mock AI Predictor now / Real AI Model later
SQLite Database
```

## Structure

```text
backend/      FastAPI app, SQLite database, uploads, mock AI adapter
simulator/    Laptop ESP32/ESP32-CAM simulator and sample images
docs/         Architecture, payload, MQTT, and sprint notes
mosquitto/    Local Mosquitto broker configuration
```

## Start Mosquitto

```bash
docker compose up -d
```

## Run Backend

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend URL:

```text
http://localhost:8000
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

Image upload still uses HTTP:

```bash
python edge_simulator.py --mode image-http --once
```

See [backend/README.md](backend/README.md), [simulator/README.md](simulator/README.md),
and [docs/mqtt.md](docs/mqtt.md) for details.
