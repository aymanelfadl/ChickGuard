# Simulator

Laptop simulator for ESP32/ESP32-CAM development.

The backend does not know whether data comes from this simulator or a real
device. Both send the same metadata payload.

## Install

From this `simulator/` directory:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

## HTTP Sensor Mode

```bash
python edge_simulator.py --mode sensor-http --once
```

Omit `--once` to send one reading every 5 seconds.

## MQTT Sensor Mode

Start Mosquitto from the project root for host-based backend development:

```bash
docker compose up -d mosquitto
```

Run the backend, register the simulator device, then publish one MQTT sensor
reading:

```bash
python edge_simulator.py --mode sensor-mqtt --once
```

The simulator publishes to:

```text
poultry/farm-01/coop-01/readings
```

Connection settings when the backend runs directly on the host:

```text
BACKEND_URL=http://localhost:8000
MQTT_BROKER_HOST=localhost
```

Connection settings when the backend runs in Docker Compose:

```text
BACKEND_URL=http://localhost:8000
MQTT_BROKER_HOST=localhost
```

The simulator runs on the host machine, so it reaches Docker services through
the exposed `localhost` ports.

## HTTP Droppings Image Mode

Put sample poultry droppings images in:

```text
simulator/sample_images/
```

Then run:

```bash
python edge_simulator.py --mode image-http --once
```

The simulator sends multipart/form-data to:

```text
http://localhost:8000/api/iot/image-reading
```

The endpoint name remains `image-reading` for compatibility. In this project,
the file represents a poultry droppings/fecal sample image.

It also sends the required device authentication headers:

```text
X-Device-Id: esp32-sim-01
X-Device-Api-Key: dev-secret-key
```

Register that development device in the backend before running the simulator:

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

For the mock droppings analysis fallback, use filenames such as:

```text
healthy_01.jpg
coccidiosis_01.jpg
newcastle_01.jpg
salmonella_01.jpg
```
