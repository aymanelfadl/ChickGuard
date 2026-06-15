from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import DATABASE_URL


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Provide one database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_database_schema() -> None:
    """
    Apply small development-safe SQLite migrations.

    SQLAlchemy create_all creates missing tables but does not alter existing
    tables, so this keeps old local/Docker databases compatible after adding
    the real model raw_label output.
    """
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    if "image_readings" in table_names:
        columns = {column["name"] for column in inspector.get_columns("image_readings")}
        if "raw_label" not in columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE image_readings ADD COLUMN raw_label VARCHAR(100)"))

    for table_name in ("iot_readings", "image_readings"):
        if table_name not in table_names:
            continue

        columns = {column["name"] for column in inspector.get_columns(table_name)}
        if "motion" not in columns:
            with engine.begin() as connection:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN motion INTEGER"))

    for table_name in ("devices", "camera_devices"):
        if table_name not in table_names:
            continue

        table_columns = {column["name"] for column in inspector.get_columns(table_name)}
        with engine.begin() as connection:
            if "name" not in table_columns:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN name VARCHAR(255)"))
            if "camera_type" not in table_columns:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN camera_type VARCHAR(100)"))
            if "stream_url" not in table_columns:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN stream_url VARCHAR(500)"))
            if "location_label" not in table_columns:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN location_label VARCHAR(255)"))
            if "description" not in table_columns:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN description VARCHAR(1000)"))
            if "last_seen_at" not in table_columns:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN last_seen_at DATETIME"))
            if "status" not in table_columns:
                connection.execute(
                    text(f"ALTER TABLE {table_name} ADD COLUMN status VARCHAR(20) DEFAULT 'offline'")
                )
            if "last_event_type" not in table_columns:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN last_event_type VARCHAR(50)"))
