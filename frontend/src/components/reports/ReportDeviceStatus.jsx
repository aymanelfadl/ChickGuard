import { Link } from "react-router-dom";

import Card from "../common/Card.jsx";
import EmptyState from "../common/EmptyState.jsx";
import StatusBadge from "../dashboard/StatusBadge.jsx";
import { formatDateTime } from "../../utils/formatters.js";

export default function ReportDeviceStatus({ devices = [] }) {
  const onlineCount = devices.filter((device) => device.status === "online").length;
  const offlineCount = devices.filter((device) => device.status === "offline").length;

  return (
    <Card
      title="Device Readiness"
      description={`${onlineCount} online · ${offlineCount} offline · ${devices.length} registered`}
    >
      {!devices.length ? (
        <EmptyState title="No devices" message="Registered devices will appear in this report." />
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {devices.map((device) => {
            const isSensorDevice = device.device_type === "esp32";
            const prediction = device.latest_prediction?.disease_type || device.latest_prediction?.prediction_status;
            return (
              <article
                key={device.device_id || device.id}
                className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.2fr)_160px_180px_160px_auto] md:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#1C2B21]">{device.name || device.device_id || "Device"}</p>
                  <p className="mt-1 truncate text-sm text-[#64748B]">
                    {device.device_id || "N/A"} · {isSensorDevice ? "Sensor telemetry" : device.camera_type || "Camera"}
                  </p>
                </div>
                <StatusBadge status={device.status} />
                <SmallInfo label="Last seen" value={formatDateTime(device.last_seen_at)} />
                <SmallInfo label="Last event" value={device.last_event_type || prediction || "N/A"} />
                {device.device_id ? (
                  <Link
                    className="justify-self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#14532D] hover:bg-[#F0FDF4] md:justify-self-end"
                    to={`/devices/${device.device_id}`}
                  >
                    Open
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function SmallInfo({ label, value }) {
  return (
    <div className="min-w-0 text-sm">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#94A3B8]">{label}</p>
      <p className="mt-1 truncate font-semibold text-[#334155]" title={value || undefined}>
        {value || "N/A"}
      </p>
    </div>
  );
}
