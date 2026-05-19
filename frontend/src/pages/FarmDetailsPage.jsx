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
    <div className="space-y-6">
      <div className="space-y-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Farms", to: "/farms" },
            { label: farmName, to: `/farms/${farm?.id || farmId}` },
          ]}
          levelLabel="Farm Level"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold uppercase text-[#14532D]">
              Farm Level
            </span>
            <h1 className="mt-2 truncate text-2xl font-bold text-[#102A1C]">{farmName}</h1>
            <p className="text-sm text-[#64748B]">
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
                className="rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white"
              >
                Add Coop
              </button>
            ) : null}
            {firstCoop ? (
              <Link className="rounded-lg border border-[#CFE8D7] bg-white px-4 py-2 text-sm font-semibold text-[#14532D]" to={`/coops/${firstCoop.id}`}>
                Open Coop
              </Link>
            ) : null}
            <Link className="rounded-lg border border-[#CFE8D7] bg-white px-4 py-2 text-sm font-semibold text-[#14532D]" to={`/gallery?farm_id=${encodeURIComponent(galleryFarmId)}`}>
              View Farm Gallery
            </Link>
            <Link className="rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white" to={`/reports?type=farm&farm_id=${encodeURIComponent(farm?.id || farmId)}`}>
              View Farm Report
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
        <p className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-sm font-semibold text-[#14532D]">
          {successMessage}
        </p>
      ) : null}
      <Card
        title={farm?.name || "Farm"}
        description={farm?.location || "Farm overview and operational status."}
        action={
          <div className="flex flex-wrap justify-end gap-2">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => {
                  setCoopSubmitError("");
                  setIsCreateCoopOpen(true);
                }}
                className="rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white"
              >
                Add Coop
              </button>
            ) : null}
            <Link className="rounded-lg border border-[#CFE8D7] bg-white px-4 py-2 text-sm font-semibold text-[#14532D]" to={`/gallery?farm_id=${encodeURIComponent(galleryFarmId)}`}>
              View Farm Gallery
            </Link>
            <Link className="rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white" to={`/reports?type=farm&farm_id=${encodeURIComponent(farm?.id || farmId)}`}>
              View Farm Report
            </Link>
          </div>
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
          <div className="space-y-4">
            <EmptyState title="No coops yet" message="Create a coop to start organizing cameras/devices inside this farm." />
            {isAdmin ? (
              <button
                type="button"
                onClick={() => {
                  setCoopSubmitError("");
                  setIsCreateCoopOpen(true);
                }}
                className="rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white"
              >
                Add Coop
              </button>
            ) : null}
          </div>
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

      <Card title="Recent Droppings Images" description="Latest visual evidence from all coops and cameras in this farm.">
        <RecentImageGrid
          images={recentImages.items}
          emptyTitle="No farm images yet"
          emptyMessage="Recent poultry droppings images from this farm will appear here."
        />
      </Card>

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
    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FBF8] p-4">
      <p className="text-xs font-semibold uppercase text-[#64748B]">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${danger ? "text-[#DC2626]" : "text-[#102A1C]"}`}>
        {value ?? 0}
      </p>
    </div>
  );
}
