import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import Card from "../components/common/Card.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LiveUpdateStatus from "../components/common/LiveUpdateStatus.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import Modal from "../components/common/Modal.jsx";
import CoopCard from "../components/coop/CoopCard.jsx";
import DeviceCard from "../components/devices/DeviceCard.jsx";
import CoopForm from "../components/forms/CoopForm.jsx";
import RecentImageGrid from "../components/gallery/RecentImageGrid.jsx";
import Breadcrumbs from "../components/navigation/Breadcrumbs.jsx";
import HierarchyContext from "../components/navigation/HierarchyContext.jsx";
import { useImageGallery } from "../hooks/useImageGallery.js";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh.js";
import { createCoop } from "../services/coopService.js";
import { fetchFarm, fetchFarmCoops } from "../services/farmService.js";
import { fetchFarmReport } from "../services/reportService.js";

export default function FarmDetailsPage({ realtime, user }) {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [farm, setFarm] = useState(null);
  const [coops, setCoops] = useState([]);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [isCreateCoopOpen, setIsCreateCoopOpen] = useState(false);
  const [isSubmittingCoop, setIsSubmittingCoop] = useState(false);
  const [coopSubmitError, setCoopSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || "");
  const galleryFarmId = farm?.name || farmId;
  const recentImages = useImageGallery({ farm_id: galleryFarmId, limit: 6, offset: 0 });
  const isAdmin = user?.role === "admin";

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
        recentImages.refreshGallery({ showLoading: false }),
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
  }, [farmId, recentImages.refreshGallery]);
  const { isRefreshing, lastRefreshEventType, liveUpdateReceived, refreshManually } = useRealtimeRefresh(
    realtime,
    loadFarm,
  );

  useEffect(() => {
    loadFarm();
  }, [loadFarm]);

  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  async function handleCreateCoop(payload) {
    setIsSubmittingCoop(true);
    setCoopSubmitError("");
    setSuccessMessage("");
    try {
      const createdCoop = await createCoop(farm?.id || farmId, payload);
      await loadFarm({ showLoading: false });
      setIsCreateCoopOpen(false);
      if (createdCoop?.id) {
        navigate(`/coops/${createdCoop.id}`, {
          state: { successMessage: `${createdCoop.name || "Coop"} created.` },
        });
      } else {
        setSuccessMessage(`${payload.name} created.`);
      }
    } catch (createError) {
      setCoopSubmitError(createError.message || "Unable to create coop.");
    } finally {
      setIsSubmittingCoop(false);
    }
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  const farmName = farm?.name || farmId;
  const firstCoop = coops[0];
  const activeAlerts = farm?.active_alerts ?? report?.recent_alerts?.length ?? 0;

  return (
    <div className="space-y-8 pb-12">
      <div className="space-y-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Farms", to: "/farms" },
            { label: farmName, to: `/farms/${farm?.id || farmId}` },
          ]}
          levelLabel="Farm Level"
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-[#1C2B21] truncate">{farmName}</h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              {[farm?.location, `${coops.length} coops`, `${activeAlerts} active alerts`].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => {
                  setCoopSubmitError("");
                  setIsCreateCoopOpen(true);
                }}
                className="rounded-xl bg-[#15803D] px-4 py-2 text-sm font-semibold text-white shadow-apple-sm hover:bg-green-800 transition-colors"
              >
                Add Coop
              </button>
            ) : null}
            {firstCoop ? (
              <Link className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#1C2B21] shadow-apple-sm hover:bg-gray-50 transition-colors" to={`/coops/${firstCoop.id}`}>
                Open Coop
              </Link>
            ) : null}
            <Link className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#1C2B21] shadow-apple-sm hover:bg-gray-50 transition-colors" to={`/gallery?farm_id=${encodeURIComponent(galleryFarmId)}`}>
              View Gallery
            </Link>
            <Link className="rounded-xl bg-[#15803D] px-4 py-2 text-sm font-semibold text-white shadow-apple-sm hover:bg-green-800 transition-colors" to={`/reports?type=farm&farm_id=${encodeURIComponent(farm?.id || farmId)}`}>
              View Report
            </Link>
          </div>
        </div>
        <HierarchyContext
          farm={{ label: farmName, to: `/farms/${farm?.id || farmId}` }}
          status={farm?.latest_health_status}
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
        <p className="rounded-xl border border-green-200 bg-[#F0FDF4] p-4 text-sm font-semibold text-[#15803D]">
          {successMessage}
        </p>
      ) : null}
      <Card
        title={farm?.name || "Farm Overview"}
        description={farm?.location || "Operational status and infrastructure."}
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <Metric label="Coops" value={farm?.number_of_coops} />
          <Metric label="Devices" value={farm?.number_of_devices} />
          <Metric label="Online" value={report?.online_devices ?? 0} />
          <Metric label="Offline" value={report?.offline_devices ?? 0} danger={report?.offline_devices > 0} />
          <Metric label="Active Alerts" value={farm?.active_alerts} danger={farm?.active_alerts > 0} />
          <Metric label="Latest Status" value={farm?.latest_health_status || "Unknown"} />
        </div>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1C2B21]">Coops</h2>
          <p className="text-sm text-[#6B7280]">Coop-level monitoring and alerts inside this farm.</p>
        </div>
        {!coops.length ? (
          <div className="space-y-6">
            <EmptyState title="No coops yet" message="Create a coop to start organizing cameras/devices inside this farm." />
            {isAdmin ? (
              <button
                type="button"
                onClick={() => {
                  setCoopSubmitError("");
                  setIsCreateCoopOpen(true);
                }}
                className="rounded-xl bg-[#15803D] px-4 py-2 text-sm font-semibold text-white shadow-apple-sm hover:bg-green-800 transition-colors"
              >
                Add Coop
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {coops.map((coop) => (
              <CoopCard key={coop.id} coop={coop} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1C2B21]">Devices</h2>
          <p className="text-sm text-[#6B7280]">Camera/device status and live stream placeholders for this farm.</p>
        </div>
        {report?.devices?.length ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {report.devices.map((device) => (
              <DeviceCard key={device.device_id} device={device} />
            ))}
          </div>
        ) : (
          <EmptyState title="No farm devices" message="Registered devices for this farm will appear here." />
        )}
      </section>

      <Card title="Recent Droppings Images" description="Latest visual evidence from all coops and cameras in this farm.">
        <RecentImageGrid
          images={recentImages.items}
          emptyTitle="No farm images yet"
          emptyMessage="Recent poultry droppings images from this farm will appear here."
        />
      </Card>

      <Card title="Recent Farm Alerts" description="Health alerts from droppings analysis.">
        {report?.recent_alerts?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {report.recent_alerts.slice(0, 6).map((alert) => (
              <div key={alert.id} className="rounded-xl border border-red-100 bg-[#FEF2F2] p-4 text-sm text-red-800">
                <p className="font-semibold mb-1">{alert.disease_type || "Sick detection"}</p>
                <p className="text-xs text-red-600">Device {alert.device_id}</p>
                <p className="text-xs text-red-600 mt-2">{Math.round((alert.confidence || 0) * 100)}% Match</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No active farm alerts" message="Sick detections from droppings analysis will appear here." />
        )}
      </Card>

      <Modal
        title="Add Coop"
        description="Create a coop under this farm before assigning cameras and devices."
        isOpen={isCreateCoopOpen}
        onClose={() => setIsCreateCoopOpen(false)}
      >
        <CoopForm
          farmName={farmName}
          onSubmit={handleCreateCoop}
          onCancel={() => setIsCreateCoopOpen(false)}
          isSubmitting={isSubmittingCoop}
          error={coopSubmitError}
        />
      </Modal>
    </div>
  );
}

function Metric({ label, value, danger = false }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-[#F9FAF9] p-4">
      <p className="text-xs font-semibold text-[#6B7280]">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${danger ? "text-red-600" : "text-[#1C2B21]"}`}>
        {value ?? 0}
      </p>
    </div>
  );
}
