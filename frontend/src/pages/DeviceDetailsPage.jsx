import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Card from "../components/common/Card.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LiveUpdateStatus from "../components/common/LiveUpdateStatus.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import Modal from "../components/common/Modal.jsx";
import DeviceCard from "../components/devices/DeviceCard.jsx";
import DeviceForm from "../components/forms/DeviceForm.jsx";
import RecentImageGrid from "../components/gallery/RecentImageGrid.jsx";
import Breadcrumbs from "../components/navigation/Breadcrumbs.jsx";
import HierarchyContext from "../components/navigation/HierarchyContext.jsx";
import { useImageGallery } from "../hooks/useImageGallery.js";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh.js";
import { fetchDevice, updateDevice } from "../services/deviceService.js";
import { fetchFarmCoops, fetchFarms } from "../services/farmService.js";
import { formatDateTime, formatHumidity, formatTemperature, formatWeight } from "../utils/formatters.js";

export default function DeviceDetailsPage({ realtime, user }) {
  const { deviceId } = useParams();
  const [device, setDevice] = useState(null);
  const [farms, setFarms] = useState([]);
  const [coops, setCoops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCoops, setIsLoadingCoops] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmittingDevice, setIsSubmittingDevice] = useState(false);
  const [deviceSubmitError, setDeviceSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const recentImages = useImageGallery({ device_id: deviceId, limit: 6, offset: 0 });
  const isAdmin = user?.role === "admin";

  const loadDevice = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const [deviceData] = await Promise.all([
        fetchDevice(deviceId),
        recentImages.refreshGallery({ showLoading: false }),
      ]);
      setDevice(deviceData);
      setLastUpdatedAt(new Date().toISOString());
      return true;
    } catch (loadError) {
      if (showLoading) {
        setError(loadError.message || "Unable to load device.");
      }
      return false;
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [deviceId, recentImages.refreshGallery]);
  const { isRefreshing, lastRefreshEventType, liveUpdateReceived, refreshManually } = useRealtimeRefresh(
    realtime,
    loadDevice,
  );

  useEffect(() => {
    loadDevice();
  }, [loadDevice]);

  const handleEditFarmChange = useCallback(async (farmId) => {
    if (!farmId) {
      setCoops([]);
      return;
    }
    setIsLoadingCoops(true);
    try {
      setCoops(await fetchFarmCoops(farmId));
    } catch (loadError) {
      setCoops([]);
      setDeviceSubmitError(loadError.message || "Unable to load coops for this farm.");
    } finally {
      setIsLoadingCoops(false);
    }
  }, []);

  async function openEditModal() {
    setDeviceSubmitError("");
    setSuccessMessage("");
    setIsEditOpen(true);
    if (!farms.length) {
      try {
        const farmItems = await fetchFarms();
        setFarms(farmItems);
      } catch (loadError) {
        setDeviceSubmitError(loadError.message || "Unable to load farms.");
      }
    }
  }

  async function handleUpdateDevice(payload) {
    setIsSubmittingDevice(true);
    setDeviceSubmitError("");
    setSuccessMessage("");
    try {
      const updatedDevice = await updateDevice(deviceId, payload);
      setDevice(updatedDevice);
      setIsEditOpen(false);
      setSuccessMessage(`${updatedDevice?.name || updatedDevice?.device_id || deviceId} updated.`);
      await loadDevice({ showLoading: false });
    } catch (updateError) {
      setDeviceSubmitError(updateError.message || "Unable to update device.");
    } finally {
      setIsSubmittingDevice(false);
    }
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  const latestSensor = device?.latest_sensor;
  const deviceLabel = device?.name || device?.device_id || deviceId;
  const farmId = device?.farm_id || device?.camera?.farm_id;
  const coopId = device?.coop_id || device?.camera?.coop_id;
  const farmName = device?.farm_name || farmId || "Farm";
  const coopName = device?.coop_name || coopId || "Coop";
  const deviceStatus = device?.status || device?.camera?.status;
  const metadata = {
    ...(device?.camera || {}),
    ...device,
    name: device?.name || device?.camera?.name,
    camera_type: device?.camera_type || device?.camera?.camera_type,
    stream_url: device?.stream_url || device?.camera?.stream_url,
    location_label: device?.location_label || device?.camera?.location_label,
    description: device?.description || device?.camera?.description,
  };

  return (
    <section className="space-y-8 pb-12">
      <div className="space-y-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Farms", to: "/farms" },
            { label: farmName, to: farmId ? `/farms/${farmId}` : "/farms" },
            { label: coopName, to: coopId ? `/coops/${coopId}` : undefined },
            { label: `Camera ${deviceLabel}`, to: `/devices/${deviceId}` },
          ]}
          levelLabel="Device Level"
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-[#1C2B21] truncate">{deviceLabel}</h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              Part of {farmName} · {coopName} · {device?.device_type || device?.camera?.device_type || "Camera / Device"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin ? (
              <button
                type="button"
                onClick={openEditModal}
                className="rounded-xl bg-[#15803D] px-4 py-2 text-sm font-semibold text-white shadow-apple-sm hover:bg-green-800 transition-colors"
              >
                Edit Device
              </button>
            ) : null}
            <Link
              to={`/gallery?device_id=${encodeURIComponent(deviceId)}`}
              className="rounded-xl bg-[#15803D] px-4 py-2 text-sm font-semibold text-white shadow-apple-sm hover:bg-green-800 transition-colors"
            >
              View Latest Images
            </Link>
            <a href="#device-events" className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#1C2B21] shadow-apple-sm hover:bg-gray-50 transition-colors">
              View Device Events
            </a>
            <Link to={`/alerts?device_id=${encodeURIComponent(deviceId)}`} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#1C2B21] shadow-apple-sm hover:bg-gray-50 transition-colors">
              Open Related Alerts
            </Link>
          </div>
        </div>
        <HierarchyContext
          farm={{ label: farmName, to: farmId ? `/farms/${farmId}` : "/farms" }}
          coop={{ label: coopName, to: coopId ? `/coops/${coopId}` : undefined }}
          device={{ label: deviceLabel, to: `/devices/${deviceId}` }}
          status={deviceStatus}
        />
      </div>

      <LiveUpdateStatus
        realtimeStatus={realtime?.status}
        lastUpdatedAt={lastUpdatedAt}
        liveUpdateReceived={liveUpdateReceived}
        liveUpdateLabel="New image analysis received"
        lastEventType={lastRefreshEventType}
        isRefreshing={isRefreshing}
        onRefresh={refreshManually}
      />
      {successMessage ? (
        <p className="rounded-xl border border-green-200 bg-[#F0FDF4] p-4 text-sm font-semibold text-[#15803D]">
          {successMessage}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <DeviceCard
          device={{
            ...(device?.camera || device),
            device_id: device?.device_id,
            name: metadata.name,
            device_type: device?.device_type,
            camera_type: metadata.camera_type,
            farm_id: device?.farm_id,
            coop_id: device?.coop_id,
            stream_url: metadata.stream_url,
            location_label: metadata.location_label,
            description: metadata.description,
            status: device?.status,
            last_seen_at: device?.last_seen_at,
            last_event_type: device?.last_event_type,
          }}
          canEdit={isAdmin}
          onEdit={openEditModal}
        />

        <div id="device-events" className="scroll-mt-6">
          <Card title="Latest Sensor Reading" description="Nearest recent telemetry from this device.">
            {latestSensor ? (
              <dl className="space-y-3 text-sm">
                <Row label="Temperature" value={formatTemperature(latestSensor.temperature_c)} />
                <Row label="Humidity" value={formatHumidity(latestSensor.humidity_percent)} />
                <Row label="Weight" value={formatWeight(latestSensor.weight_kg)} />
                <Row label="Captured" value={formatDateTime(latestSensor.timestamp)} />
                <Row label="Last Event" value={device?.last_event_type || device?.camera?.last_event_type} />
              </dl>
            ) : (
              <p className="text-sm text-[#6B7280]">No sensor reading recorded yet.</p>
            )}
          </Card>
        </div>
      </div>

      <Card title="Camera / Device Metadata" description="Administrative metadata used for monitoring and future live camera integration.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetadataRow label="Device Name" value={metadata.name} />
          <MetadataRow label="Device ID" value={device?.device_id} />
          <MetadataRow label="Device Type" value={metadata.device_type || device?.device_type} />
          <MetadataRow label="Camera Type" value={metadata.camera_type} />
          <MetadataRow label="Farm" value={farmName} to={farmId ? `/farms/${farmId}` : null} />
          <MetadataRow label="Coop" value={coopName} to={coopId ? `/coops/${coopId}` : null} />
          <MetadataRow label="Location Label" value={metadata.location_label} />
          <MetadataRow label="Stream URL" value={metadata.stream_url ? "Configured" : "Not set"} />
          <MetadataRow label="Active" value={metadata.is_active ? "Yes" : "No"} />
          <MetadataRow label="Last Seen" value={formatDateTime(metadata.last_seen_at || device?.last_seen_at)} />
          <MetadataRow label="Last Event" value={metadata.last_event_type || device?.last_event_type} />
          <MetadataRow label="Description" value={metadata.description} wide />
        </div>
        {metadata.stream_url ? (
          <a
            className="mt-4 inline-flex justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#1C2B21] transition-colors hover:bg-gray-50 shadow-apple-sm"
            href={metadata.stream_url}
            target="_blank"
            rel="noreferrer"
          >
            Open Stream URL
          </a>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-gray-200 bg-[#F9FAF9] p-4 text-sm text-[#6B7280]">
            Live stream placeholder. Add a stream URL when this camera exposes one.
          </p>
        )}
      </Card>

      <Card title="Latest Images From This Camera" description="Most recent uploaded droppings images for this device.">
        <RecentImageGrid
          images={recentImages.items}
          emptyTitle="No camera images yet"
          emptyMessage="Uploaded images from this camera will appear here."
        />
      </Card>

      <Modal
        title="Edit Device / Camera"
        description="Update camera metadata, farm/coop placement, stream URL, and active status."
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      >
        <DeviceForm
          key={device?.device_id || "edit-device-detail"}
          mode="edit"
          initialValues={device}
          farms={farms}
          coops={coops}
          onFarmChange={handleEditFarmChange}
          onSubmit={handleUpdateDevice}
          onCancel={() => setIsEditOpen(false)}
          isSubmitting={isSubmittingDevice}
          isLoadingCoops={isLoadingCoops}
          error={deviceSubmitError}
        />
      </Modal>
    </section>
  );
}

function MetadataRow({ label, value, to, wide = false }) {
  return (
    <div className={`rounded-xl border border-gray-100 bg-[#F9FAF9] p-3 ${wide ? "sm:col-span-2 xl:col-span-4" : ""}`}>
      <p className="text-xs font-semibold text-[#6B7280]">{label}</p>
      {to && value ? (
        <p className="mt-1 truncate font-medium text-[#15803D]">
          <Link to={to} className="hover:underline">{value}</Link>
        </p>
      ) : (
        <p className="mt-1 truncate font-medium text-[#1C2B21]" title={value || undefined}>{value || "N/A"}</p>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2 last:border-0">
      <dt className="text-[#6B7280]">{label}</dt>
      <dd className="max-w-[65%] truncate text-right font-medium text-[#1C2B21]" title={value || undefined}>
        {value || "N/A"}
      </dd>
    </div>
  );
}
