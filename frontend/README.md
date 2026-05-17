# Poultry Health Frontend Dashboard

React + Vite dashboard for the IoT poultry health monitoring backend.

## Expected Backend

The frontend fetches data from:

```text
http://localhost:8000
```

Make sure the FastAPI backend is running before starting the frontend.

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
```

No fake dashboard data is hardcoded in the frontend. Empty and null backend values are shown as safe fallback states.
