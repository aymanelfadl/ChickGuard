import { useCallback, useEffect, useState } from "react";

import Card from "../components/common/Card.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LiveUpdateStatus from "../components/common/LiveUpdateStatus.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import DeviceCard from "../components/devices/DeviceCard.jsx";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh.js";
import { fetchDevice, fetchDevices } from "../services/deviceService.js";

export default function DevicesPage({ realtime }) {
  const [devices, setDevices] = useState([]);
  const [deviceDetails, setDeviceDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const loadDevices = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const registeredDevices = await fetchDevices();
      setDevices(registeredDevices);
      const details = await Promise.all(
        registeredDevices.map((device) =>
          fetchDevice(device.device_id).catch(() => ({
            ...device,
            latest_prediction: null,
            latest_sensor: null,
          })),
        ),
      );
      setDeviceDetails(details);
      setLastUpdatedAt(new Date().toISOString());
      return true;
    } catch (loadError) {
      if (showLoading) {
        setError(loadError.message || "Unable to load devices.");
      }
      return false;
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);
  const { isRefreshing, lastRefreshEventType, liveUpdateReceived, refreshManually } = useRealtimeRefresh(
    realtime,
    loadDevices,
  );

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <section className="space-y-4">
      <LiveUpdateStatus
        realtimeStatus={realtime?.status}
        lastUpdatedAt={lastUpdatedAt}
        liveUpdateReceived={liveUpdateReceived}
        lastEventType={lastRefreshEventType}
        isRefreshing={isRefreshing}
        onRefresh={refreshManually}
      />
      <div>
        <h2 className="text-xl font-bold text-[#102A1C]">Devices / Cameras</h2>
        <p className="text-sm text-[#64748B]">Registered ESP32/ESP32-CAM devices, camera placeholders, and latest droppings analysis.</p>
      </div>
      {!devices.length ? (
        <Card title="No Devices">
          <EmptyState title="No devices registered" message="Register a simulator or ESP32 device to see it here." />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {deviceDetails.map((device) => (
            <DeviceCard
              key={device.device_id}
              device={{
                ...(device.camera || device),
                device_id: device.device_id,
                device_type: device.device_type,
                farm_id: device.farm_id,
                coop_id: device.coop_id,
                status: device.status,
                last_seen_at: device.last_seen_at,
                last_event_type: device.last_event_type,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
