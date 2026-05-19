import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Card from "../components/common/Card.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LiveUpdateStatus from "../components/common/LiveUpdateStatus.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import CoopCard from "../components/coop/CoopCard.jsx";
import DeviceCard from "../components/devices/DeviceCard.jsx";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh.js";
import { fetchFarm, fetchFarmCoops } from "../services/farmService.js";
import { fetchFarmReport } from "../services/reportService.js";

export default function FarmDetailsPage({ realtime }) {
  const { farmId } = useParams();
  const [farm, setFarm] = useState(null);
  const [coops, setCoops] = useState([]);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const loadFarm = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const [farmData, coopData, reportData] = await Promise.all([
        fetchFarm(farmId),
        fetchFarmCoops(farmId),
        fetchFarmReport(farmId),
      ]);
      setFarm(farmData);
      setCoops(coopData);
      setReport(reportData);
      setLastUpdatedAt(new Date().toISOString());
      return true;
    } catch (loadError) {
      if (showLoading) {
        setError(loadError.message || "Unable to load farm.");
      }
      return false;
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [farmId]);
  const { isRefreshing, lastRefreshEventType, liveUpdateReceived, refreshManually } = useRealtimeRefresh(
    realtime,
    loadFarm,
  );

  useEffect(() => {
    loadFarm();
  }, [loadFarm]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="space-y-6">
      <LiveUpdateStatus
        realtimeStatus={realtime?.status}
        lastUpdatedAt={lastUpdatedAt}
        liveUpdateReceived={liveUpdateReceived}
        lastEventType={lastRefreshEventType}
        isRefreshing={isRefreshing}
        onRefresh={refreshManually}
      />
      <Card
        title={farm?.name || "Farm"}
        description={farm?.location || "Farm overview and operational status."}
        action={
          <Link className="rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white" to="/reports">
            Report
          </Link>
        }
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <Metric label="Coops" value={farm?.number_of_coops} />
          <Metric label="Devices" value={farm?.number_of_devices} />
          <Metric label="Online" value={report?.online_devices ?? 0} />
          <Metric label="Offline" value={report?.offline_devices ?? 0} danger />
          <Metric label="Active Alerts" value={farm?.active_alerts} danger />
          <Metric label="Latest Status" value={farm?.latest_health_status || "Unknown"} />
        </div>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-[#102A1C]">Coops</h2>
          <p className="text-sm text-[#64748B]">Coop-level monitoring and alerts inside this farm.</p>
        </div>
        {!coops.length ? (
          <EmptyState title="No coops yet" message="Coops will appear after devices are registered or an admin creates them." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {coops.map((coop) => (
              <CoopCard key={coop.id} coop={coop} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-[#102A1C]">Devices</h2>
          <p className="text-sm text-[#64748B]">Camera/device status and live stream placeholders for this farm.</p>
        </div>
        {report?.devices?.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {report.devices.map((device) => (
              <DeviceCard key={device.device_id} device={device} />
            ))}
          </div>
        ) : (
          <EmptyState title="No farm devices" message="Registered devices for this farm will appear here." />
        )}
      </section>

      <Card title="Recent Farm Alerts" description="Health alerts from droppings analysis.">
        {report?.recent_alerts?.length ? (
          <div className="space-y-3">
            {report.recent_alerts.slice(0, 5).map((alert) => (
              <p key={alert.id} className="rounded-lg border border-[#FECACA] bg-red-50 p-3 text-sm text-[#7F1D1D]">
                {alert.disease_type || "Sick detection"} on device {alert.device_id} with {Math.round((alert.confidence || 0) * 100)}% confidence.
              </p>
            ))}
          </div>
        ) : (
          <EmptyState title="No active farm alerts" message="Sick detections from droppings analysis will appear here." />
        )}
      </Card>
    </div>
  );
}

function Metric({ label, value, danger = false }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FBF8] p-4">
      <p className="text-xs font-semibold uppercase text-[#64748B]">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${danger ? "text-[#DC2626]" : "text-[#102A1C]"}`}>
        {value ?? 0}
      </p>
    </div>
  );
}
