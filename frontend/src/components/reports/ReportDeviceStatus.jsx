import { Link } from "react-router-dom";

import Card from "../common/Card.jsx";
import EmptyState from "../common/EmptyState.jsx";
import StatusBadge from "../dashboard/StatusBadge.jsx";
import { formatDateTime, formatPercent } from "../../utils/formatters.js";

export default function ReportDeviceStatus({ devices = [] }) {
  return (
    <Card title="Device Status" description="Camera/device availability and latest droppings analysis by device.">
      {!devices.length ? (
        <EmptyState title="No cameras/devices" message="Registered cameras and devices will appear in this report." />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
            <table className="min-w-[1180px] divide-y divide-gray-100 text-sm">
              <thead className="bg-[#F9FAF9] text-left text-xs font-semibold text-[#6B7280]">
                <tr>
                  <HeaderCell>Device Name</HeaderCell>
                  <HeaderCell>Device ID</HeaderCell>
                  <HeaderCell>Coop</HeaderCell>
                  <HeaderCell>Device Type</HeaderCell>
                  <HeaderCell>Camera Type</HeaderCell>
                  <HeaderCell>Stream URL</HeaderCell>
                  <HeaderCell>Location</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Last Seen</HeaderCell>
                  <HeaderCell>Last Event</HeaderCell>
                  <HeaderCell>Latest Prediction</HeaderCell>
                  <HeaderCell>Action</HeaderCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {devices.map((device) => (
                  <tr key={device.device_id || device.id} className="align-top hover:bg-gray-50 transition-colors">
                    <BodyCell strong>{device.name || device.device_id || "N/A"}</BodyCell>
                    <BodyCell>{device.device_id || "N/A"}</BodyCell>
                    <BodyCell>{device.coop_name || device.coop_id || "N/A"}</BodyCell>
                    <BodyCell>{device.device_type || "N/A"}</BodyCell>
                    <BodyCell>{device.camera_type || "N/A"}</BodyCell>
                    <BodyCell>{device.stream_url ? "Configured" : "Not set"}</BodyCell>
                    <BodyCell>{device.location_label || "N/A"}</BodyCell>
                    <BodyCell><StatusBadge status={device.status} /></BodyCell>
                    <BodyCell>{formatDateTime(device.last_seen_at)}</BodyCell>
                    <BodyCell>{device.last_event_type || "N/A"}</BodyCell>
                    <BodyCell>
                      {device.latest_prediction?.disease_type ||
                        device.latest_prediction?.prediction_status ||
                        "None"}
                      {device.latest_prediction?.confidence ? (
                        <span className="block text-xs text-[#6B7280] mt-1">
                          {formatPercent(device.latest_prediction.confidence)}
                        </span>
                      ) : null}
                    </BodyCell>
                    <BodyCell>
                      {device.device_id ? (
                        <Link className="font-semibold text-[#15803D] hover:text-green-800 transition-colors" to={`/devices/${device.device_id}`}>
                          Open Device
                        </Link>
                      ) : (
                        "N/A"
                      )}
                    </BodyCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {devices.map((device) => (
              <article key={device.device_id || device.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-apple-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-[#1C2B21]">{device.name || device.device_id}</h3>
                    <p className="text-xs font-medium text-[#6B7280]">{device.device_type || "Camera / Device"}</p>
                  </div>
                  <StatusBadge status={device.status} />
                </div>
                <div className="mt-4 grid gap-3 text-sm">
                  <MobileRow label="Device ID" value={device.device_id} />
                  <MobileRow label="Coop" value={device.coop_name || device.coop_id} />
                  <MobileRow label="Camera Type" value={device.camera_type} />
                  <MobileRow label="Stream URL" value={device.stream_url ? "Configured" : "Not set"} />
                  <MobileRow label="Location" value={device.location_label} />
                  <MobileRow label="Last Seen" value={formatDateTime(device.last_seen_at)} />
                  <MobileRow label="Last Event" value={device.last_event_type} />
                  <MobileRow
                    label="Latest Prediction"
                    value={device.latest_prediction?.disease_type || device.latest_prediction?.prediction_status}
                  />
                </div>
                {device.device_id ? (
                  <Link className="mt-4 inline-flex rounded-xl bg-[#15803D] px-4 py-2 text-sm font-semibold text-white shadow-apple-sm transition-colors hover:bg-green-800" to={`/devices/${device.device_id}`}>
                    Open Device
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function HeaderCell({ children }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function BodyCell({ children, strong = false }) {
  return <td className={`px-4 py-4 ${strong ? "font-semibold text-[#1C2B21]" : "font-medium text-[#6B7280]"}`}>{children}</td>;
}

function MobileRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-gray-100 pb-2 last:border-0">
      <p className="font-medium text-[#6B7280]">{label}</p>
      <p className="max-w-[60%] truncate text-right font-medium text-[#1C2B21]">{value || "N/A"}</p>
    </div>
  );
}
