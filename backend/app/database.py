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
    if "image_readings" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("image_readings")}
    if "raw_label" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE image_readings ADD COLUMN raw_label VARCHAR(100)"))
