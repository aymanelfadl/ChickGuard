import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import Card from "../components/common/Card.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LiveUpdateStatus from "../components/common/LiveUpdateStatus.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import DeviceCard from "../components/devices/DeviceCard.jsx";
import RecentImageGrid from "../components/gallery/RecentImageGrid.jsx";
import StatusBadge from "../components/dashboard/StatusBadge.jsx";
import Breadcrumbs from "../components/navigation/Breadcrumbs.jsx";
import HierarchyContext from "../components/navigation/HierarchyContext.jsx";
import { useImageGallery } from "../hooks/useImageGallery.js";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh.js";
import { fetchCoop, fetchCoopDevices } from "../services/coopService.js";
import { fetchCoopReport } from "../services/reportService.js";
import { formatDateTime, formatHumidity, formatTemperature, formatWeight } from "../utils/formatters.js";

export default function CoopDetailsPage({ realtime }) {
  const { coopId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [coop, setCoop] = useState(null);
  const [devices, setDevices] = useState([]);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || "");
  const galleryCoopId = coop?.name || coopId;
  const recentImages = useImageGallery({ coop_id: galleryCoopId, limit: 6, offset: 0 });

  const loadCoop = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const [coopData, deviceData, reportData] = await Promise.all([
        fetchCoop(coopId),
        fetchCoopDevices(coopId),
        fetchCoopReport(coopId),
        recentImages.refreshGallery({ showLoading: false }),
      ]);
      setCoop(coopData);
      setDevices(deviceData);
      setReport(reportData);
      setLastUpdatedAt(new Date().toISOString());
      return true;
    } catch (loadError) {
      if (showLoading) {
        setError(loadError.message || "Unable to load coop.");
      }
      return false;
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [coopId, recentImages.refreshGallery]);
  const { isRefreshing, lastRefreshEventType, liveUpdateReceived, refreshManually } = useRealtimeRefresh(
    realtime,
    loadCoop,
  );

  useEffect(() => {
    loadCoop();
  }, [loadCoop]);

  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  const latestAnalysis = report?.latest_droppings_analysis;
  const latestSensor = report?.latest_sensor_readings?.[0];
  const coopName = coop?.name || coopId;
  const farmId = coop?.farm_id || report?.coop?.farm_id || report?.farm_id;
  const farmName = coop?.farm_name || report?.farm?.name || farmId || "Farm";
  const firstDevice = devices[0];
  const firstDeviceId = firstDevice?.device_id || firstDevice?.deviceId || firstDevice?.id;
  const activeAlerts = coop?.active_alerts ?? report?.recent_alerts?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Farms", to: "/farms" },
            { label: farmName, to: farmId ? `/farms/${farmId}` : "/farms" },
            { label: coopName, to: `/coops/${coop?.id || coopId}` },
          ]}
          levelLabel="Coop Level"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold uppercase text-[#14532D]">
              Coop Level
            </span>
            <h1 className="mt-2 truncate text-2xl font-bold text-[#102A1C]">{coopName}</h1>
            <p className="text-sm text-[#64748B]">
              Part of {farmName} · {devices.length} cameras · {activeAlerts} active alerts
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {firstDeviceId ? (
              <Link className="rounded-lg border border-[#CFE8D7] bg-white px-4 py-2 text-sm font-semibold text-[#14532D]" to={`/devices/${firstDeviceId}`}>
                Open Camera
              </Link>
            ) : null}
            <Link className="rounded-lg border border-[#CFE8D7] bg-white px-4 py-2 text-sm font-semibold text-[#14532D]" to={`/gallery?coop_id=${encodeURIComponent(galleryCoopId)}`}>
              View Coop Gallery
            </Link>
            <Link className="rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white" to={`/reports?type=coop&farm_id=${encodeURIComponent(farmId || "")}&coop_id=${encodeURIComponent(coop?.id || coopId)}`}>
              View Coop Report
            </Link>
          </div>
        </div>
        <HierarchyContext
          farm={{ label: farmName, to: farmId ? `/farms/${farmId}` : "/farms" }}
          coop={{ label: coopName, to: `/coops/${coop?.id || coopId}` }}
          status={coop?.latest_health_status}
        />
      </div>

      <LiveUpdateStatus
        realtimeStatus={realtime?.status}
        lastUpdatedAt={lastUpdatedAt}
        liveUpdateReceived={liveUpdateReceived}
        lastEventType={lastRefreshEventType}
        isRefreshing={isRefreshing}
        onRefresh={refreshManually}
      />
      {successMessage ? (
        <p className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-sm font-semibold text-[#14532D]">
          {successMessage}
        </p>
      ) : null}
      <Card
        title={coop?.name || "Coop"}
        description={coop?.description || "Coop overview, cameras, sensor history, and health alerts."}
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <Link className="rounded-lg border border-[#CFE8D7] bg-white px-4 py-2 text-sm font-semibold text-[#14532D]" to={`/gallery?coop_id=${encodeURIComponent(galleryCoopId)}`}>
              View Coop Gallery
            </Link>
            <Link className="rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white" to={`/reports?type=coop&farm_id=${encodeURIComponent(farmId || "")}&coop_id=${encodeURIComponent(coop?.id || coopId)}`}>
              View Coop Report
            </Link>
          </div>
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

      <Card title="Recent Droppings Images" description="Latest visual evidence from this coop.">
        <RecentImageGrid
          images={recentImages.items}
          emptyTitle="No coop images yet"
          emptyMessage="Recent poultry droppings images from this coop will appear here."
        />
      </Card>

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
