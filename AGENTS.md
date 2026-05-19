# AGENTS.md

Guidance for Codex and other AI coding agents working in this repository.

## Project Overview

This project is an IoT poultry health monitoring platform. It monitors poultry health using a combination of poultry droppings image analysis, device telemetry, and dashboard reporting.

The AI model performs fecal image classification on poultry droppings images. For the current production path, image analysis is performed through HTTP multipart upload. MQTT is used separately for sensor readings such as environmental telemetry.

Authentication is intentionally split by actor:

- Dashboard users authenticate with JWT.
- IoT devices authenticate with `X-Device-Id` and `X-Device-Api-Key`.

Do not merge these authentication paths.

## Architecture Rules

Keep these API contracts stable:

- `POST /api/iot/readings`
- `POST /api/iot/image-reading`

Important rules:

- Do not rename IoT ingestion endpoints.
- Do not mix user authentication with device authentication.
- Do not protect IoT POST endpoints with JWT.
- Do not remove the mock fallback for the AI model.
- Do not commit heavy model assets.
- Keep frontend code modular.
- Keep backend services separated from API routes.

## Backend Structure

Backend code lives under `backend/app/`.

- `backend/app/api/`: FastAPI route files.
- `backend/app/services/`: Business logic and integration logic.
- `backend/app/models.py`: SQLAlchemy database models.
- `backend/app/schemas.py`: Pydantic request and response schemas.
- `backend/app/ai_model/`: AI prediction logic, labels, preprocessing, and model loading.
- `backend/app/ai_model/model/`: Local model assets only.

API route files should stay thin. Put reusable logic, database operations, prediction orchestration, storage handling, and external integrations in services or dedicated modules.

## Frontend Structure

Frontend code lives under `frontend/src/`.

- `frontend/src/pages/`: Page-level views.
- `frontend/src/components/`: Reusable UI components.
- `frontend/src/services/`: API calls and backend communication.
- `frontend/src/hooks/`: State and data-loading hooks.
- `frontend/src/utils/`: Formatting helpers and shared utilities.
- `frontend/src/config/`: Runtime and API configuration.

Frontend rules:

- Components should not call `fetch` directly.
- API calls must go through service modules.
- Auth token handling must go through `tokenStorage` and `authService`.
- Do not add fake dashboard data unless explicitly requested.

## Model Asset Rules

Real model files are local development and deployment assets. They are ignored by git and should not be committed.

Expected real model directory:

```text
backend/app/ai_model/model/chicken_disease_model.keras/
```

Expected example labels file:

```text
backend/app/ai_model/model/labels.example.json
```

Expected local labels file:

```text
backend/app/ai_model/model/labels.json
```

Rules for labels:

- Use `labels.json` only for model output index order.
- Do not sort labels.
- Do not rename labels.
- The `labels.json` order must match the training `class_names` exactly.

The real image-only Keras predictor must keep a mock fallback so local development does not crash when model files are missing.

## Commands

Docker:

```bash
docker compose up -d --build
docker compose down
```

Backend compile:

```bash
python -m compileall backend/app scripts simulator
```

Frontend build:

```bash
cd frontend
npm run build
```

Model validation:

```bash
make validate-model
```

## Before Finishing a Task

Run the checks that match the files changed:

- Backend or script changes: `python -m compileall backend/app scripts simulator`
- Frontend changes: `npm run build` from `frontend/`
- Docker changes: `docker compose up -d --build`
- Predictor or model validation changes: `make validate-model`

If a check cannot be run, explain why in the final response.

## Domain Wording

Use these terms:

- poultry droppings image
- droppings analysis
- fecal image classification
- health alerts

Avoid these terms:

- chicken garbage
- kaka
- poultry body image

## Safety Rules For Changes

Do not break:

- Docker Compose
- Login flow
- Device authentication
- MQTT ingestion
- Image upload
- Model fallback
- Dashboard API endpoints
- Farm, coop, and device hierarchy

