import { Link } from "react-router-dom";

import Card from "../common/Card.jsx";
import StatusBadge from "../dashboard/StatusBadge.jsx";
import { formatDateTime, formatPercent } from "../../utils/formatters.js";

function DeviceMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs font-semibold text-[#6B7280]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#1C2B21] truncate" title={value}>{value || "N/A"}</p>
    </div>
  );
}

export default function DeviceCard({ device, canEdit = false, onEdit }) {
  const prediction = device.latest_prediction || device.latestPrediction;
  const isActive = device.is_active ?? device.isActive;
  const status = device.status || (isActive ? "unknown" : "offline");
  const lastSeenAt = device.last_seen_at || device.lastSeenAt;
  const lastEventType = device.last_event_type || device.lastEventType;
  const deviceId = device.device_id || device.deviceId;
  const streamUrl = device.stream_url || device.streamUrl;

  return (
    <Card
      title={device.name || deviceId}
      description={device.device_type || device.deviceType || "ESP32-CAM"}
      action={
        <div className="flex flex-wrap justify-end gap-2">
          <StatusBadge status={status} />
          {deviceId ? (
            <Link className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#1C2B21] transition-colors hover:bg-gray-50" to={`/devices/${deviceId}`}>
              Details
            </Link>
          ) : null}
          {canEdit ? (
            <button
              type="button"
              className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#1C2B21] transition-colors hover:bg-gray-50"
              onClick={onEdit}
            >
              Edit
            </button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-dashed border-gray-200 bg-[#F9FAF9] p-4 text-sm text-[#6B7280]">
          {streamUrl ? (
            <span>
              Stream URL configured:{" "}
              <a className="font-semibold text-[#15803D] hover:underline" href={streamUrl} target="_blank" rel="noreferrer">
                Open stream
              </a>
            </span>
          ) : (
            "Live stream placeholder - no stream URL configured yet"
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <DeviceMetric label="Device ID" value={deviceId} />
          <DeviceMetric label="Status" value={status === "online" ? "Online" : status === "offline" ? "Offline" : "Unknown"} />
          <DeviceMetric label="Farm" value={device.farm_id || device.farmId || "N/A"} />
          <DeviceMetric label="Coop" value={device.coop_id || device.coopId || "N/A"} />
          <DeviceMetric label="Camera Type" value={device.camera_type || device.cameraType || "N/A"} />
          <DeviceMetric label="Location" value={device.location_label || device.locationLabel || "N/A"} />
          <DeviceMetric label="Latest Analysis" value={prediction?.disease_type || prediction?.diseaseType || prediction?.prediction_status || "None"} />
          <DeviceMetric label="Confidence" value={formatPercent(prediction?.confidence)} />
        </div>
        {prediction?.image_path || prediction?.imagePath ? (
          <p
            className="truncate text-xs font-medium text-[#6B7280]"
            title={prediction.image_path || prediction.imagePath}
          >
            Droppings image: {prediction.image_path || prediction.imagePath}
          </p>
        ) : null}
        {prediction?.timestamp ? (
          <p className="text-xs font-medium text-[#6B7280]">Captured {formatDateTime(prediction.timestamp)}</p>
        ) : null}
      </div>
    </Card>
  );
}
