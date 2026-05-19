import { useEffect, useRef, useState } from "react";

import { connectRealtimeEvents, disconnectRealtimeEvents } from "../services/realtimeService.js";

export function useRealtimeEvents({ enabled = true } = {}) {
  const [status, setStatus] = useState(enabled ? "connecting" : "disconnected");
  const [lastEvent, setLastEvent] = useState(null);
  const connectionRef = useRef(null);
  const eventCounterRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      disconnectRealtimeEvents(connectionRef.current);
      connectionRef.current = null;
      setStatus("disconnected");
      return undefined;
    }

    let isMounted = true;
    setStatus("connecting");

    const connection = connectRealtimeEvents({
      onStatusChange: (nextStatus) => {
        if (isMounted) {
          setStatus(nextStatus);
        }
      },
      onEvent: (event) => {
        if (!isMounted) {
          return;
        }

        eventCounterRef.current += 1;
        setLastEvent({
          ...event,
          id: `${Date.now()}-${eventCounterRef.current}`,
          receivedAt: new Date().toISOString(),
        });
      },
      onError: () => {
        if (isMounted) {
          setStatus("error");
        }
      },
    });

    connectionRef.current = connection;
    if (!connection) {
      setStatus("disconnected");
    }

    return () => {
      isMounted = false;
      disconnectRealtimeEvents(connectionRef.current);
      connectionRef.current = null;
    };
  }, [enabled]);

  return {
    status,
    lastEvent,
  };
}

