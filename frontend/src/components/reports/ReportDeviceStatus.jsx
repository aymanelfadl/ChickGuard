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
          <div className="hidden overflow-x-auto rounded-lg border border-[#E2E8F0] md:block">
            <table className="min-w-[980px] divide-y divide-[#E2E8F0] text-sm">
              <thead className="bg-[#F8FBF8] text-left text-xs uppercase text-[#64748B]">
                <tr>
                  <HeaderCell>Device Name</HeaderCell>
                  <HeaderCell>Device ID</HeaderCell>
                  <HeaderCell>Coop</HeaderCell>
                  <HeaderCell>Type</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Last Seen</HeaderCell>
                  <HeaderCell>Last Event</HeaderCell>
                  <HeaderCell>Latest Prediction</HeaderCell>
                  <HeaderCell>Action</HeaderCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F7] bg-white">
                {devices.map((device) => (
                  <tr key={device.device_id || device.id} className="align-top hover:bg-[#F8FBF8]">
                    <BodyCell strong>{device.name || device.device_id || "N/A"}</BodyCell>
                    <BodyCell>{device.device_id || "N/A"}</BodyCell>
                    <BodyCell>{device.coop_name || device.coop_id || "N/A"}</BodyCell>
                    <BodyCell>{device.device_type || "N/A"}</BodyCell>
                    <BodyCell><StatusBadge status={device.status} /></BodyCell>
                    <BodyCell>{formatDateTime(device.last_seen_at)}</BodyCell>
                    <BodyCell>{device.last_event_type || "N/A"}</BodyCell>
                    <BodyCell>
                      {device.latest_prediction?.disease_type ||
                        device.latest_prediction?.prediction_status ||
                        "None"}
                      {device.latest_prediction?.confidence ? (
                        <span className="block text-xs text-[#64748B]">
                          {formatPercent(device.latest_prediction.confidence)}
                        </span>
                      ) : null}
                    </BodyCell>
                    <BodyCell>
                      {device.device_id ? (
                        <Link className="font-semibold text-[#14532D] hover:underline" to={`/devices/${device.device_id}`}>
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
              <article key={device.device_id || device.id} className="rounded-lg border border-[#E2E8F0] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-[#102A1C]">{device.name || device.device_id}</h3>
                    <p className="text-xs text-[#64748B]">{device.device_type || "Camera / Device"}</p>
                  </div>
                  <StatusBadge status={device.status} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm">
                  <MobileRow label="Device ID" value={device.device_id} />
                  <MobileRow label="Coop" value={device.coop_name || device.coop_id} />
                  <MobileRow label="Last Seen" value={formatDateTime(device.last_seen_at)} />
                  <MobileRow label="Last Event" value={device.last_event_type} />
                  <MobileRow
                    label="Latest Prediction"
                    value={device.latest_prediction?.disease_type || device.latest_prediction?.prediction_status}
                  />
                </dl>
                {device.device_id ? (
                  <Link className="mt-4 inline-flex rounded-lg bg-[#14532D] px-3 py-2 text-sm font-semibold text-white" to={`/devices/${device.device_id}`}>
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
  return <td className={`px-4 py-4 ${strong ? "font-semibold text-[#102A1C]" : "text-[#475569]"}`}>{children}</td>;
}

function MobileRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[#EEF2F7] pb-2 last:border-0">
      <dt className="text-[#64748B]">{label}</dt>
      <dd className="max-w-[60%] truncate text-right font-semibold text-[#102A1C]">{value || "N/A"}</dd>
    </div>
  );
}
