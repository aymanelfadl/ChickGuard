# Sprint 1

Completed:

- FastAPI backend package under `backend/app/`
- SQLite persistence at `backend/poultry_iot.db`
- Sensor-only reading endpoint: `POST /api/iot/readings`
- Latest sensor readings endpoint: `GET /api/iot/readings`
- Multipart image-reading endpoint: `POST /api/iot/image-reading`
- Latest image readings endpoint: `GET /api/iot/image-readings`
- Health endpoint: `GET /health`
- Local image storage under `backend/uploads/`
- Mock AI predictor with deterministic filename-based labels
- Device registry with hashed API keys
- API-key authentication for IoT POST endpoints
- Mosquitto MQTT broker config for local development
- MQTT sensor-reading consumer in the backend
- Simulator MQTT sensor mode
- Dashboard-ready overview, status, history, and alerts API endpoints
- Laptop simulator for sensor-only and image upload modes
- Documentation for architecture and payload formats

Next likely work:

- Real ESP32/ESP32-CAM firmware integration
- MQTT ingestion path
- Real AI model adapter
- Dashboard and alerts
- Authentication
- Deployment configuration
