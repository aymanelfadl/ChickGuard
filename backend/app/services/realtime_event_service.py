import asyncio
import json
import logging
import queue
import threading
import time
from collections.abc import AsyncIterator
from typing import Any


logger = logging.getLogger("uvicorn.error")


class RealtimeEventManager:
    """Manage Server-Sent Events clients and one-way dashboard notifications."""

    def __init__(self) -> None:
        self._clients: set[queue.Queue[str]] = set()
        self._lock = threading.Lock()

    def connect(self) -> queue.Queue[str]:
        client_queue: queue.Queue[str] = queue.Queue(maxsize=100)
        with self._lock:
            self._clients.add(client_queue)
            client_count = len(self._clients)
        logger.info("SSE client connected: clients=%s", client_count)
        return client_queue

    def disconnect(self, client_queue: queue.Queue[str]) -> None:
        with self._lock:
            self._clients.discard(client_queue)
            client_count = len(self._clients)
        logger.info("SSE client disconnected: clients=%s", client_count)

    def broadcast(self, event_name: str, payload: dict[str, Any]) -> None:
        message = format_sse_message(event_name, payload)
        disconnected_clients: list[queue.Queue[str]] = []

        with self._lock:
            clients = list(self._clients)

        for client_queue in clients:
            try:
                client_queue.put_nowait(message)
            except queue.Full:
                disconnected_clients.append(client_queue)

        if disconnected_clients:
            with self._lock:
                for client_queue in disconnected_clients:
                    self._clients.discard(client_queue)

        logger.info(
            "SSE event broadcasted: event=%s clients=%s dropped=%s",
            event_name,
            len(clients),
            len(disconnected_clients),
        )

    async def stream(self, client_queue: queue.Queue[str], request: Any) -> AsyncIterator[str]:
        next_keepalive_at = time.monotonic() + 15

        try:
            yield ": connected\n\n"
            while True:
                if await request.is_disconnected():
                    break

                try:
                    yield await asyncio.to_thread(client_queue.get, True, 1)
                except queue.Empty:
                    pass

                if time.monotonic() >= next_keepalive_at:
                    yield ": keepalive\n\n"
                    next_keepalive_at = time.monotonic() + 15
        finally:
            self.disconnect(client_queue)


def format_sse_message(event_name: str, payload: dict[str, Any]) -> str:
    data = json.dumps(payload, separators=(",", ":"), default=str)
    return f"event: {event_name}\ndata: {data}\n\n"


realtime_event_manager = RealtimeEventManager()
