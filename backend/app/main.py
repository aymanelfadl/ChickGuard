from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.devices import router as devices_router
from app.api.farms import router as farms_router
from app.api.image_gallery import router as image_gallery_router
from app.api.iot import router as iot_router
from app.api.realtime import router as realtime_router
from app.database import engine, ensure_database_schema
from app.services.mqtt_consumer_service import start_mqtt_consumer, stop_mqtt_consumer


models.Base.metadata.create_all(bind=engine)
ensure_database_schema()

app = FastAPI(
    title="Poultry Health IoT Backend",
    description="Receives poultry readings from ESP32 devices or the laptop simulator.",
    version="0.1.0",
)

# The React/Vite dashboard runs on a different local origin than FastAPI, so
# browsers need this explicit CORS allowance during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


@app.on_event("startup")
def startup_event() -> None:
    start_mqtt_consumer()


@app.on_event("shutdown")
def shutdown_event() -> None:
    stop_mqtt_consumer()


app.include_router(iot_router)
app.include_router(devices_router)
app.include_router(farms_router)
app.include_router(image_gallery_router)
app.include_router(dashboard_router)
app.include_router(auth_router)
app.include_router(realtime_router)
