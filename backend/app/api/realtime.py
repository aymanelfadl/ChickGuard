import logging

from fastapi import APIRouter, HTTPException, Query, Request, status
from jose import JWTError
from sqlalchemy.orm import Session
from starlette.responses import StreamingResponse

from app import models
from app.database import SessionLocal
from app.services.auth_service import decode_access_token
from app.services.realtime_event_service import realtime_event_manager


logger = logging.getLogger("uvicorn.error")
router = APIRouter(prefix="/api/realtime", tags=["realtime"])


def authenticate_sse_token(token: str | None, db: Session) -> models.User:
    if not token:
        logger.warning("Unauthorized SSE request rejected: missing token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing token",
        )

    try:
        payload = decode_access_token(token)
        email = payload.get("sub")
    except JWTError as error:
        logger.warning("Unauthorized SSE request rejected: invalid or expired token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from error

    if not email:
        logger.warning("Unauthorized SSE request rejected: invalid token payload")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        logger.warning("Unauthorized SSE request rejected: user not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        logger.warning("Unauthorized SSE request rejected: inactive user id=%s", user.id)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )

    return user


@router.get("/events")
def stream_realtime_events(
    request: Request,
    token: str | None = Query(default=None),
) -> StreamingResponse:
    db = SessionLocal()
    try:
        authenticate_sse_token(token, db)
    finally:
        db.close()

    client_queue = realtime_event_manager.connect()
    return StreamingResponse(
        realtime_event_manager.stream(client_queue, request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
