# Sprint 1

Completed:

- FastAPI backend package under `backend/app/`
- SQLite persistence at `backend/poultry_iot.db`
- Sensor-only reading endpoint: `POST /api/iot/readings`
- Latest sensor readings endpoint: `GET /api/iot/readings`
- Multipart poultry droppings image-reading endpoint: `POST /api/iot/image-reading`
- Latest droppings image readings endpoint: `GET /api/iot/image-readings`
- Health endpoint: `GET /health`
- Local poultry droppings image storage under `backend/uploads/`
- Mock droppings analysis predictor with deterministic filename-based labels
- Device registry with hashed API keys
- API-key authentication for IoT POST endpoints
- Mosquitto MQTT broker config for local development
- MQTT sensor-reading consumer in the backend
- Simulator MQTT sensor mode
- Dashboard-ready overview, status, history, and health alert API endpoints
- Farm, coop, device/camera, and JSON report API endpoints
- React route structure for dashboard, farms, coops, devices, alerts, reports, and settings
- Live stream placeholders for future ESP32-CAM/IP camera integration
- Laptop simulator for sensor-only and poultry droppings image upload modes
- Documentation for architecture and payload formats

Next likely work:

- Real ESP32/ESP32-CAM firmware integration
- MQTT ingestion path
- Real fecal image classification model adapter
- Final farm management UI polish
- Real live camera streaming
- Authentication
- Deployment configuration
