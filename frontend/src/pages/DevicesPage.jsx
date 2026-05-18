import { useEffect, useState } from "react";

import Card from "../components/common/Card.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import DeviceCard from "../components/devices/DeviceCard.jsx";
import { fetchDevice, fetchDevices } from "../services/deviceService.js";

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [deviceDetails, setDeviceDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDevices() {
      setIsLoading(true);
      setError(null);
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
      } catch (loadError) {
        setError(loadError.message || "Unable to load devices.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDevices();
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <section className="space-y-4">
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
            <DeviceCard key={device.device_id} device={device.camera || device} />
          ))}
        </div>
      )}
    </section>
  );
}
