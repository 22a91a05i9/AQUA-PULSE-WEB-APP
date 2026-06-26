import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy import inspect

from app.core.config import settings
from app.db import SessionLocal, engine
from app.routers import agent, analytics, auth, emergencies, manager, meta, owner, readings, reports, user_settings
from app.seed_data import seed_database

logger = logging.getLogger(__name__)


def schema_ready() -> bool:
    inspector = inspect(engine)
    required_tables = {
        "users",
        "farm_types",
        "species",
        "devices",
        "sites",
        "sensor_readings",
        "alerts",
        "reports",
        "user_settings",
        "emergency_incidents",
    }
    existing_tables = set(inspector.get_table_names())
    return required_tables.issubset(existing_tables)


@asynccontextmanager
async def lifespan(app: FastAPI):
    mqtt_client = None
    if schema_ready():
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
    else:
        logger.warning("Database schema is not ready. Run the database bootstrap command before serving traffic.")

    if settings.mqtt_enabled:
        from app.mqtt_consumer import start_listener

        mqtt_client = start_listener()

    yield

    if mqtt_client is not None:
        from app.mqtt_consumer import stop_listener

        stop_listener(mqtt_client)


app = FastAPI(title=settings.app_name, lifespan=lifespan)

allow_all_origins = settings.cors_origins == ["*"]
allow_all_hosts = settings.trusted_hosts == ["*"]

if not allow_all_hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=not allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Aqua IoT backend is running"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.app_env,
    }


app.include_router(auth.router, prefix="/api")
app.include_router(meta.router, prefix="/api")
app.include_router(manager.router, prefix="/api")
app.include_router(owner.router, prefix="/api")
app.include_router(agent.router, prefix="/api")
app.include_router(readings.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(user_settings.router, prefix="/api")
app.include_router(emergencies.router, prefix="/api")
