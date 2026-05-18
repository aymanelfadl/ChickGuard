# Poultry Health Frontend Dashboard

React + Vite dashboard for the IoT poultry health monitoring backend.

The dashboard presents poultry health telemetry and health alerts from
droppings analysis. The AI result shown in the UI is based on poultry droppings
images captured from fecal/manure samples.

The frontend is now structured as a farm management platform with routed pages
for dashboard, farms, coops, devices/cameras, alerts, reports, and settings.
Live streaming is represented by placeholders only; real ESP32-CAM/IP camera
stream integration is planned for a later sprint.

## Structure

```text
src/
  App.jsx                         Dashboard composition only
  config/apiConfig.js             API base URL and endpoint paths
  pages/                          Route-level product pages
  services/                       Dashboard, farm, coop, device, and report API calls
  models/dashboardModels.js       Backend response normalization
  hooks/useDashboardData.js       Loading, error, refresh, and data state
  components/layout/              Page shell and header
  components/common/              Reusable UI primitives
  components/dashboard/           Dashboard-specific presentation components
  components/farm/                Farm cards and summaries
  components/coop/                Coop cards and summaries
  components/devices/             Camera/device cards with stream placeholders
  components/reports/             JSON report viewer
  utils/                          Formatting and status helpers
```

Visual components do not call `fetch` directly. Data flows through:

```text
dashboardService -> dashboardModels -> useDashboardData -> components
```

## Expected Backend

The frontend fetches data from:

```text
http://localhost:8000
```

Make sure the FastAPI backend is running before starting the frontend.

For local development, the API base URL can be configured with:

```text
VITE_API_BASE_URL=http://localhost:8000
```

Create a local `.env` from `.env.example` if you need to override the backend
URL. Docker Compose passes the same value during the production build.

## Install Dependencies

```bash
cd frontend
npm install
```

## Run the Frontend

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Dashboard Data

The app uses these backend endpoints:

```text
GET /api/dashboard/overview
GET /api/dashboard/latest-status
GET /api/dashboard/health-history
GET /api/dashboard/alerts
GET /api/farms
GET /api/farms/{farm_id}
GET /api/farms/{farm_id}/coops
GET /api/coops/{coop_id}
GET /api/coops/{coop_id}/devices
GET /api/farms/{farm_id}/report
GET /api/coops/{coop_id}/report
GET /api/reports/options
GET /api/devices
```

No fake dashboard data is hardcoded in the frontend. Empty and null backend
values are shown as safe fallback states.

## Authentication

The dashboard uses JWT user authentication. Device authentication for ESP32 or
the simulator remains separate and still uses device API key headers.

Register a dashboard user through the backend:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "full_name": "Admin User",
    "password": "admin123"
  }'
```

Then open the frontend and log in:

```text
http://localhost:5173
```

The JWT access token is stored in `localStorage` for local development. Protected
dashboard API calls include:

```text
Authorization: Bearer <access_token>
```

Logging out clears the stored token and returns the app to the login page.

## Docker

The Docker image builds the Vite app and serves the static files with nginx.
Docker Compose exposes it at:

```text
http://localhost:5173
```

Browser requests still call:

```text
http://localhost:8000
```

This is intentional because the browser runs on the user's machine, not inside
the Docker network.
