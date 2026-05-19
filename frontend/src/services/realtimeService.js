import { API_BASE_URL } from "../config/apiConfig.js";
import { getToken } from "../utils/tokenStorage.js";

const REALTIME_EVENTS = [
  "sensor_reading_created",
  "droppings_analysis_created",
  "health_alert_created",
  "device_status_updated",
];

function parseEventData(message) {
  try {
    return JSON.parse(message.data);
  } catch {
    return {};
  }
}

export function connectRealtimeEvents(callbacks = {}) {
  const token = getToken();
  if (!token) {
    callbacks.onError?.(new Error("Missing auth token"));
    callbacks.onStatusChange?.("disconnected");
    return null;
  }

  const eventSource = new EventSource(
    `${API_BASE_URL}/api/realtime/events?token=${encodeURIComponent(token)}`,
  );

  eventSource.onopen = () => {
    callbacks.onStatusChange?.("connected");
    callbacks.onOpen?.();
  };

  eventSource.onerror = (error) => {
    const nextStatus = eventSource.readyState === EventSource.CLOSED ? "disconnected" : "error";
    callbacks.onStatusChange?.(nextStatus);
    callbacks.onError?.(error);
  };

  REALTIME_EVENTS.forEach((eventType) => {
    eventSource.addEventListener(eventType, (message) => {
      const event = {
        type: eventType,
        data: parseEventData(message),
      };

      callbacks.onEvent?.(event);

      if (eventType === "sensor_reading_created") {
        callbacks.onSensorReadingCreated?.(event);
      }
      if (eventType === "droppings_analysis_created") {
        callbacks.onDroppingsAnalysisCreated?.(event);
      }
      if (eventType === "health_alert_created") {
        callbacks.onHealthAlertCreated?.(event);
      }
      if (eventType === "device_status_updated") {
        callbacks.onDeviceStatusUpdated?.(event);
      }
    });
  });

  return {
    disconnect() {
      eventSource.close();
      callbacks.onStatusChange?.("disconnected");
      callbacks.onClose?.();
    },
  };
}

export function disconnectRealtimeEvents(connection) {
  connection?.disconnect();
}
