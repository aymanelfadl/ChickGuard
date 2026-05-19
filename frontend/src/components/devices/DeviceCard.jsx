import { Link } from "react-router-dom";

import Card from "../common/Card.jsx";
import StatusBadge from "../dashboard/StatusBadge.jsx";
import { formatDateTime, formatPercent } from "../../utils/formatters.js";

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
            <Link className="rounded-full border border-[#CFE8D7] px-3 py-1.5 text-xs font-semibold text-[#14532D]" to={`/devices/${deviceId}`}>
              Details
            </Link>
          ) : null}
          {canEdit ? (
            <button
              type="button"
              className="rounded-full border border-[#CFE8D7] px-3 py-1.5 text-xs font-semibold text-[#14532D]"
              onClick={onEdit}
            >
              Edit
            </button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-dashed border-[#BBF7D0] bg-[#F8FBF8] p-4 text-sm text-[#475569]">
          {streamUrl ? (
            <span>
              Stream URL configured:{" "}
              <a className="font-semibold text-[#14532D] underline" href={streamUrl} target="_blank" rel="noreferrer">
                Open stream
              </a>
            </span>
          ) : (
            "Live stream placeholder - no stream URL configured yet"
          )}
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-[#64748B]">Device ID</p>
            <p className="mt-1 font-semibold text-[#102A1C]">{deviceId}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#64748B]">Status</p>
            <p className={`mt-1 font-semibold ${status === "online" ? "text-[#16A34A]" : "text-[#64748B]"}`}>
              {status === "online" ? "Online" : status === "offline" ? "Offline" : "Unknown"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#64748B]">Farm</p>
            <p className="mt-1 font-semibold text-[#102A1C]">{device.farm_id || device.farmId || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#64748B]">Coop</p>
            <p className="mt-1 font-semibold text-[#102A1C]">{device.coop_id || device.coopId || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#64748B]">Type</p>
            <p className="mt-1 font-semibold text-[#102A1C]">{device.device_type || device.deviceType || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#64748B]">Camera Type</p>
            <p className="mt-1 font-semibold text-[#102A1C]">{device.camera_type || device.cameraType || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#64748B]">Stream URL</p>
            <p className="mt-1 font-semibold text-[#102A1C]">{streamUrl ? "Configured" : "Not set"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#64748B]">Location</p>
            <p className="mt-1 font-semibold text-[#102A1C]">{device.location_label || device.locationLabel || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#64748B]">Last Event</p>
            <p className="mt-1 font-semibold text-[#102A1C]">{lastEventType || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#64748B]">Last Seen</p>
            <p className="mt-1 font-semibold text-[#102A1C]">{formatDateTime(lastSeenAt)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#64748B]">Latest Analysis</p>
            <p className="mt-1 font-semibold text-[#102A1C]">
              {prediction?.disease_type || prediction?.diseaseType || prediction?.prediction_status || "None"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#64748B]">Confidence</p>
            <p className="mt-1 font-semibold text-[#102A1C]">{formatPercent(prediction?.confidence)}</p>
          </div>
        </div>
        {prediction?.image_path || prediction?.imagePath ? (
          <p
            className="truncate text-sm text-[#64748B]"
            title={prediction.image_path || prediction.imagePath}
          >
            Droppings image: {prediction.image_path || prediction.imagePath}
          </p>
        ) : null}
        {prediction?.timestamp ? (
          <p className="text-xs text-[#64748B]">Captured {formatDateTime(prediction.timestamp)}</p>
        ) : null}
      </div>
    </Card>
  );
}
