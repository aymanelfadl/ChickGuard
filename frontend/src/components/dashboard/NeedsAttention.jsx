import { Camera, MapPin, ShieldCheck, Siren, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import Card from "../common/Card.jsx";
import { formatDateTime, formatPercent } from "../../utils/formatters.js";

export default function NeedsAttention({ alerts }) {
  const topAlerts = alerts?.slice(0, 3) || [];

  return (
    <Card
      title="Needs Attention"
      description="Top actionable health alerts requiring your immediate review."
      className="bg-white"
      action={
        alerts?.length > 0 ? (
          <Link to="/alerts" className="text-sm font-semibold text-[#15803D] hover:underline flex items-center gap-1">
            View all alerts <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null
      }
    >
      {!topAlerts.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-[#15803D] mb-4">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-[#1C2B21]">All Systems Clear</h3>
          <p className="mt-1 text-sm text-[#6B7280]">No active disease detections or offline devices to review.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topAlerts.map((alert) => (
            <div key={alert.id} className="relative flex flex-col rounded-xl border border-amber-100 bg-white p-5 shadow-apple-sm transition-colors hover:border-amber-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-amber-700">
                  <Siren className="h-5 w-5" />
                  <span className="font-semibold">{alert.diseaseType || "Unknown Alert"}</span>
                </div>
                <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-1 rounded-full ring-1 ring-inset ring-amber-200">
                  {formatPercent(alert.confidence)} Match
                </span>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">Device {alert.deviceId || "N/A"} • Farm {alert.farmId || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <Camera className="h-4 w-4 shrink-0" />
                  <span className="truncate" title={alert.imagePath}>{alert.imagePath || "N/A"}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-[#6B7280] mb-4">
                Detected: {formatDateTime(alert.timestamp)}
              </div>
              
              <div className="mt-auto grid grid-cols-3 gap-2">
                <Link to="/gallery" className="flex flex-col items-center justify-center rounded-lg bg-gray-50 py-2 text-xs font-medium text-[#1C2B21] transition hover:bg-gray-100">
                  <ExternalLink className="h-4 w-4 mb-1" />
                  View Image
                </Link>
                <Link to={`/coops/${alert.coopId || "1"}`} className="flex flex-col items-center justify-center rounded-lg bg-gray-50 py-2 text-xs font-medium text-[#1C2B21] transition hover:bg-gray-100">
                  <MapPin className="h-4 w-4 mb-1" />
                  Open Coop
                </Link>
                <Link to={`/devices/${alert.deviceId}`} className="flex flex-col items-center justify-center rounded-lg bg-gray-50 py-2 text-xs font-medium text-[#1C2B21] transition hover:bg-gray-100">
                  <Camera className="h-4 w-4 mb-1" />
                  Open Device
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
