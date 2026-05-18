import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Card from "../components/common/Card.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import DeviceCard from "../components/devices/DeviceCard.jsx";
import StatusBadge from "../components/dashboard/StatusBadge.jsx";
import { fetchCoop, fetchCoopDevices } from "../services/coopService.js";
import { fetchCoopReport } from "../services/reportService.js";
import { formatDateTime, formatHumidity, formatTemperature, formatWeight } from "../utils/formatters.js";

export default function CoopDetailsPage() {
  const { coopId } = useParams();
  const [coop, setCoop] = useState(null);
  const [devices, setDevices] = useState([]);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCoop() {
      setIsLoading(true);
      setError(null);
      try {
        const [coopData, deviceData, reportData] = await Promise.all([
          fetchCoop(coopId),
          fetchCoopDevices(coopId),
          fetchCoopReport(coopId),
        ]);
        setCoop(coopData);
        setDevices(deviceData);
        setReport(reportData);
      } catch (loadError) {
        setError(loadError.message || "Unable to load coop.");
      } finally {
        setIsLoading(false);
      }
    }

    loadCoop();
  }, [coopId]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  const latestAnalysis = report?.latest_droppings_analysis;
  const latestSensor = report?.latest_sensor_readings?.[0];

  return (
    <div className="space-y-6">
      <Card
        title={coop?.name || "Coop"}
        description={coop?.description || "Coop overview, cameras, sensor history, and health alerts."}
        action={
          <Link className="rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white" to="/reports">
            Report
          </Link>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="Capacity" value={coop?.capacity ?? "Not set"} />
          <Metric label="Devices" value={coop?.number_of_devices} />
          <Metric label="Active Alerts" value={coop?.active_alerts} danger />
        </div>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-[#102A1C]">Camera Devices</h2>
          <p className="text-sm text-[#64748B]">Device cards include a live stream placeholder for future ESP32-CAM/IP camera integration.</p>
        </div>
        {!devices.length ? (
          <EmptyState title="No camera devices" message="Registered devices for this coop will appear here." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {devices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card
          title="Latest Droppings Analysis"
          description="Most recent fecal image classification for this coop."
          action={<StatusBadge status={latestAnalysis?.prediction_status} />}
        >
          {latestAnalysis ? (
            <dl className="space-y-3 text-sm">
              <Row label="Disease" value={latestAnalysis.disease_type || "No disease detected"} />
              <Row label="Raw Label" value={latestAnalysis.raw_label} />
              <Row label="Confidence" value={latestAnalysis.confidence ? `${Math.round(latestAnalysis.confidence * 100)}%` : "N/A"} />
              <Row label="Droppings Image" value={latestAnalysis.image_path} />
              <Row label="Captured" value={formatDateTime(latestAnalysis.timestamp)} />
            </dl>
          ) : (
            <EmptyState title="No droppings analysis yet" message="Upload a droppings image to populate this section." />
          )}
        </Card>

        <Card title="Latest Sensor Reading" description="Latest environmental and growth sample.">
          {latestSensor ? (
            <dl className="space-y-3 text-sm">
              <Row label="Temperature" value={formatTemperature(latestSensor.temperature_c)} />
              <Row label="Humidity" value={formatHumidity(latestSensor.humidity_percent)} />
              <Row label="Weight" value={formatWeight(latestSensor.weight_kg)} />
              <Row label="Captured" value={formatDateTime(latestSensor.timestamp)} />
            </dl>
          ) : (
            <EmptyState title="No sensor readings" message="Sensor readings for this coop will appear here." />
          )}
        </Card>
      </section>

      <Card title="Health Alerts" description="Sick detections from droppings analysis for this coop.">
        {report?.recent_alerts?.length ? (
          <div className="space-y-3">
            {report.recent_alerts.map((alert) => (
              <p key={alert.id} className="rounded-lg border border-[#FECACA] bg-red-50 p-3 text-sm text-[#7F1D1D]">
                {alert.disease_type || "Sick detection"} on {alert.device_id} at {formatDateTime(alert.timestamp)}.
              </p>
            ))}
          </div>
        ) : (
          <EmptyState title="No active health alerts" message="Sick detections will appear here when droppings analysis flags a case." />
        )}
      </Card>
    </div>
  );
}

function Metric({ label, value, danger = false }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FBF8] p-4">
      <p className="text-xs font-semibold uppercase text-[#64748B]">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${danger ? "text-[#DC2626]" : "text-[#102A1C]"}`}>{value ?? 0}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#EEF2F7] pb-2 last:border-0">
      <dt className="text-[#64748B]">{label}</dt>
      <dd className="max-w-[65%] truncate text-right font-semibold text-[#102A1C]" title={value || undefined}>
        {value || "N/A"}
      </dd>
    </div>
  );
}
