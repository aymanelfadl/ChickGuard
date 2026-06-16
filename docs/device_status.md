# Device And Camera Metadata

The backend tracks device presence and camera metadata for registered IoT devices and dashboard camera/device rows.

Dashboard users manage device metadata with JWT authentication. IoT devices use only the device authentication headers:

```text
X-Device-Id
X-Device-Api-Key
```

Do not use dashboard JWTs for IoT ingestion, heartbeat, MQTT, or droppings image upload.

## Device Registration

Admins register cameras/devices through:

```http
POST /api/devices/register
Authorization: Bearer <admin-jwt>
Content-Type: application/json
```

Payload:

```json
{
  "device_id": "esp32-cam-01",
  "name": "Coop 01 Camera",
  "farm_id": "farm-01",
  "coop_id": "coop-01",
  "device_type": "esp32-cam",
  "camera_type": "droppings-camera",
  "stream_url": "http://example.local/stream",
  "location_label": "Coop 01 - East side",
  "description": "Camera focused on droppings collection area"
}
```

The backend validates that the farm exists, the coop exists, and the coop belongs to the farm. It creates the device credential record and syncs the dashboard-facing camera/device row.

If `api_key` is omitted, the backend generates one and returns it once. Copy it immediately and configure the device or simulator with that value. Raw API keys are never exposed again.

Admins can update metadata with:

```http
PATCH /api/devices/{device_id}
Authorization: Bearer <admin-jwt>
```

Updatable fields include `name`, `farm_id`, `coop_id`, `device_type`, `camera_type`, `stream_url`, `location_label`, `description`, and `is_active`.

## Metadata Fields

Device and camera rows support:

- `name`
- `farm_id`
- `coop_id`
- `device_type`
- `camera_type`
- `stream_url`
- `location_label`
- `description`
- `is_active`
- `last_seen_at`
- `status`
- `last_event_type`
- `created_at`

`device_type` identifies the hardware or firmware, such as `esp32-cam`, `esp32`, or `ip-camera`.

`camera_type` describes the camera role in the coop, such as `droppings-camera`, `overview-camera`, `environmental-camera`, or `security-camera`.

`stream_url` is only dashboard metadata for a camera viewer or reference link.
The backend does not parse hosted viewer pages as image streams and does not use
`stream_url` for fecal image classification.

Example:

```json
{
  "device_id": "phone-camera-01",
  "name": "Coop 01 Phone Camera",
  "device_type": "phone-browser-camera",
  "camera_type": "droppings-camera",
  "farm_id": "Farm 02",
  "coop_id": "coop 1",
  "stream_url": null,
  "location_label": "Coop 01 droppings area"
}
```

For the phone demo, generate a short-lived pairing QR from the dashboard device
details page. The QR opens `GET /camera?pairing_code=...` through HTTPS/ngrok.
The browser exchanges the pairing code for a scoped camera session token,
captures JPEG frames, and sends multipart uploads to
`POST /api/iot/image-reading`.

## Stored Fields

Device status fields are stored on both the authentication registry device and the dashboard-facing camera/device row:

- `last_seen_at`
- `status`
- `last_event_type`

The backend updates these fields whenever it receives:

- HTTP sensor readings
- MQTT sensor readings
- HTTP droppings image analysis uploads
- Explicit heartbeat requests

## Heartbeat Endpoint

```http
POST /api/iot/heartbeat
Content-Type: application/json
X-Device-Id: esp32-sim-01
X-Device-Api-Key: dev-secret-key
```

Payload:

```json
{
  "farm_id": "farm-01",
  "coop_id": "coop-01",
  "device_type": "esp32-cam",
  "status": "online"
}
```

The endpoint validates the device API key using the existing device authentication headers. It rejects missing or invalid credentials and rejects heartbeat payloads whose farm or coop does not match the registered device.

## Online/Offline Rule

The database stores the last reported status, but API responses calculate the effective status.

Rule:

```text
last_seen_at within 60 seconds -> online
last_seen_at older than 60 seconds -> offline
```

No background scheduler is required. Devices become effectively offline when dashboard or report APIs read a stale `last_seen_at`.

## Realtime Event

Device status updates are pushed to logged-in dashboard users through SSE:

```text
event: device_status_updated
data: {"device_id":"esp32-sim-01","farm_id":"farm-01","coop_id":"coop-01","status":"online","last_seen_at":"2026-05-19T11:20:52Z"}
```

The frontend still treats REST APIs as the source of truth. When it receives this event, it refreshes the current page data.

## Simulator Usage

Send one heartbeat:

```bash
python simulator/edge_simulator.py --mode heartbeat --once
```

Send heartbeats every 10 seconds:

```bash
python simulator/edge_simulator.py --mode heartbeat --interval 10
```
