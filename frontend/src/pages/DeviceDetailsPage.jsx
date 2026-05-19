import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Card from "../components/common/Card.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LiveUpdateStatus from "../components/common/LiveUpdateStatus.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import DeviceCard from "../components/devices/DeviceCard.jsx";
import RecentImageGrid from "../components/gallery/RecentImageGrid.jsx";
import { useImageGallery } from "../hooks/useImageGallery.js";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh.js";
import { fetchDevice } from "../services/deviceService.js";
import { formatDateTime, formatHumidity, formatTemperature, formatWeight } from "../utils/formatters.js";

export default function DeviceDetailsPage({ realtime }) {
  const { deviceId } = useParams();
  const [device, setDevice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const recentImages = useImageGallery({ device_id: deviceId, limit: 6, offset: 0 });

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

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  const latestSensor = device?.latest_sensor;

  return (
    <section className="space-y-5">
      <LiveUpdateStatus
        realtimeStatus={realtime?.status}
        lastUpdatedAt={lastUpdatedAt}
        liveUpdateReceived={liveUpdateReceived}
        liveUpdateLabel="New image analysis received"
        lastEventType={lastRefreshEventType}
        isRefreshing={isRefreshing}
        onRefresh={refreshManually}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#102A1C]">{device?.device_id || "Device"}</h2>
          <p className="text-sm text-[#64748B]">Camera status, latest sensor context, and recent poultry droppings images.</p>
        </div>
        <Link
          to={`/gallery?device_id=${encodeURIComponent(deviceId)}`}
          className="rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white"
        >
          View camera gallery
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DeviceCard
          device={{
            ...(device?.camera || device),
            device_id: device?.device_id,
            device_type: device?.device_type,
            farm_id: device?.farm_id,
            coop_id: device?.coop_id,
            status: device?.status,
            last_seen_at: device?.last_seen_at,
            last_event_type: device?.last_event_type,
          }}
        />

        <Card title="Latest Sensor Reading" description="Nearest recent telemetry from this device.">
          {latestSensor ? (
            <dl className="space-y-3 text-sm">
              <Row label="Temperature" value={formatTemperature(latestSensor.temperature_c)} />
              <Row label="Humidity" value={formatHumidity(latestSensor.humidity_percent)} />
              <Row label="Weight" value={formatWeight(latestSensor.weight_kg)} />
              <Row label="Captured" value={formatDateTime(latestSensor.timestamp)} />
            </dl>
          ) : (
            <p className="text-sm text-[#64748B]">No sensor reading recorded yet.</p>
          )}
        </Card>
      </div>

      <Card title="Latest Images From This Camera" description="Most recent uploaded droppings images for this device.">
        <RecentImageGrid
          images={recentImages.items}
          emptyTitle="No camera images yet"
          emptyMessage="Uploaded images from this camera will appear here."
        />
      </Card>
    </section>
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

