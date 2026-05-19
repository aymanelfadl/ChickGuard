# Device Online/Offline Status

The backend tracks device presence for registered IoT devices and dashboard camera/device rows.

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

