# Payload Format

## Sensor Metadata JSON

Both sensor-only and poultry droppings image-reading requests use this metadata
shape:

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
    "motion": 1
  },
  "metadata": {
    "battery_percent": 82,
    "wifi_rssi": -61,
    "source": "simulator"
  }
}
```

Future sensor fields should be added inside `data`.

## Sensor-Only Request

```text
POST /api/iot/readings
Content-Type: application/json
X-Device-Id: esp32-sim-01
X-Device-Api-Key: dev-secret-key
```

The request body is the metadata JSON object.

## MQTT Sensor Request

MQTT sensor readings publish the same JSON object to:

```text
poultry/{farm_id}/{coop_id}/readings
```

For local development:

```text
poultry/farm-01/coop-01/readings
```

Because MQTT messages do not have HTTP headers, include the device key in:

```json
{
  "metadata": {
    "api_key": "dev-secret-key"
  }
}
```

## Droppings Image Reading Request

```text
POST /api/iot/image-reading
Content-Type: multipart/form-data
X-Device-Id: esp32-sim-01
X-Device-Api-Key: dev-secret-key
```

The endpoint name remains `image-reading` for client compatibility. In this
project, the uploaded image is a poultry droppings/fecal sample image.

Multipart fields:

- `image`: JPEG or PNG poultry droppings image file
- `metadata`: JSON string using the same schema shown above

Poultry droppings images are saved to:

```text
backend/uploads/{device_id}/{YYYY-MM-DD}/{message_id}.{extension}
```

SQLite stores the droppings image path, file metadata, sensor metadata, and
droppings analysis prediction fields.
