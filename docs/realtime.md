# Realtime Dashboard Events

The dashboard uses Server-Sent Events for simple server push from the FastAPI backend to the React frontend.

SSE is one-way:

```text
Backend -> Frontend
```

That is enough for dashboard notifications because the backend only needs to tell the frontend that new data exists. REST APIs remain the source of truth for initial page load, manual refresh, and refreshed dashboard data after an event arrives.

## Endpoint

```http
GET /api/realtime/events?token=<jwt_token>
```

The browser `EventSource` API does not support custom `Authorization` headers in the same way as normal `fetch` calls, so the dashboard passes the JWT access token through the `token` query parameter.

The backend validates the token before opening the stream. Missing, invalid, or expired tokens are rejected and the SSE connection is not established.

## Event Types

Sensor reading stored:

```text
event: sensor_reading_created
data: {"device_id":"esp32-sim-01","farm_id":"farm-01","coop_id":"coop-01"}
```

Droppings analysis stored:

```text
event: droppings_analysis_created
data: {"device_id":"esp32-sim-01","prediction_status":"sick","disease_type":"Coccidiosis"}
```

Health alert created:

```text
event: health_alert_created
data: {"device_id":"esp32-sim-01","disease_type":"Coccidiosis","confidence":0.91}
```

Device status updated:

```text
event: device_status_updated
data: {"device_id":"esp32-sim-01","farm_id":"farm-01","coop_id":"coop-01","status":"online","last_seen_at":"2026-05-19T11:20:52Z"}
```

## Frontend Behavior

On first page load, dashboard pages call the existing REST APIs.

When an SSE event arrives, the active page performs a lightweight REST refresh for its current data. The frontend keeps the current data visible while the refresh runs and updates the visible "Last updated at" timestamp after the refresh completes.

Manual refresh buttons continue to use REST APIs.

## Scope

SSE is only used for dashboard events:

- Sensor readings
- Droppings analysis
- Health alerts
- Device online/offline status

SSE is not used for camera streaming. Camera streaming is a separate feature.

WebSockets may be added later if the product needs two-way realtime communication.
