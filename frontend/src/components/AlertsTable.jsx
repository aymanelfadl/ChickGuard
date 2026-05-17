import StatusBadge from "./StatusBadge.jsx";

function formatConfidence(value) {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "N/A";
}

export default function AlertsTable({ alerts }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Disease Alerts</h2>
          <p className="text-sm text-slate-500">Sick detections from image readings.</p>
        </div>
        <StatusBadge status={alerts?.length ? "sick" : null} />
      </div>

      {!alerts?.length ? (
        <p className="text-sm text-slate-500">No active disease alerts.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3 font-semibold">Device</th>
                <th className="px-3 py-3 font-semibold">Farm</th>
                <th className="px-3 py-3 font-semibold">Coop</th>
                <th className="px-3 py-3 font-semibold">Disease</th>
                <th className="px-3 py-3 font-semibold">Confidence</th>
                <th className="px-3 py-3 font-semibold">Image Path</th>
                <th className="px-3 py-3 font-semibold">Timestamp</th>
                <th className="px-3 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.map((alert) => (
                <tr key={alert.id} className="align-top">
                  <td className="px-3 py-3 font-medium text-slate-900">{alert.device_id}</td>
                  <td className="px-3 py-3 text-slate-700">{alert.farm_id}</td>
                  <td className="px-3 py-3 text-slate-700">{alert.coop_id}</td>
                  <td className="px-3 py-3 text-slate-700">{alert.disease_type ?? "Unknown"}</td>
                  <td className="px-3 py-3 text-slate-700">{formatConfidence(alert.confidence)}</td>
                  <td className="max-w-xs px-3 py-3 text-slate-700">
                    <span className="break-all">{alert.image_path}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{alert.timestamp}</td>
                  <td className="px-3 py-3 text-slate-700">{alert.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
