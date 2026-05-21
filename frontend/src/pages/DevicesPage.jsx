import { useCallback, useEffect, useState } from "react";

import Card from "../components/common/Card.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LiveUpdateStatus from "../components/common/LiveUpdateStatus.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import Modal from "../components/common/Modal.jsx";
import DeviceCard from "../components/devices/DeviceCard.jsx";
import DeviceForm from "../components/forms/DeviceForm.jsx";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh.js";
import { fetchFarmCoops, fetchFarms } from "../services/farmService.js";
import { fetchDevice, fetchDevices, registerDevice, updateDevice } from "../services/deviceService.js";
import Breadcrumbs from "../components/navigation/Breadcrumbs.jsx";

export default function DevicesPage({ realtime, user }) {
  const [devices, setDevices] = useState([]);
  const [deviceDetails, setDeviceDetails] = useState([]);
  const [farms, setFarms] = useState([]);
  const [coops, setCoops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCoops, setIsLoadingCoops] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [isSubmittingDevice, setIsSubmittingDevice] = useState(false);
  const [deviceSubmitError, setDeviceSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [generatedApiKey, setGeneratedApiKey] = useState("");
  const isAdmin = user?.role === "admin";

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

  const handleRegistrationFarmChange = useCallback(async (farmId) => {
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

  const loadFarmsForRegistration = useCallback(async () => {
    try {
      const farmItems = await fetchFarms();
      setFarms(farmItems);
      if (farmItems[0]) {
        await handleRegistrationFarmChange(String(farmItems[0].id));
      }
    } catch (loadError) {
      setDeviceSubmitError(loadError.message || "Unable to load farms for device registration.");
    }
  }, [handleRegistrationFarmChange]);

  async function openRegisterModal() {
    setDeviceSubmitError("");
    setSuccessMessage("");
    setGeneratedApiKey("");
    setIsRegisterOpen(true);
    if (!farms.length) {
      await loadFarmsForRegistration();
    }
  }

  async function openEditModal(device) {
    setDeviceSubmitError("");
    setSuccessMessage("");
    setGeneratedApiKey("");
    setEditingDevice(device);
    if (!farms.length) {
      await loadFarmsForRegistration();
    }
  }

  async function handleRegisterDevice(payload) {
    setIsSubmittingDevice(true);
    setDeviceSubmitError("");
    setSuccessMessage("");
    try {
      const response = await registerDevice(payload);
      setIsRegisterOpen(false);
      if (response?.api_key) {
        setGeneratedApiKey(response.api_key);
      }
      setSuccessMessage(
        response?.api_key
          ? `${response?.device_id || payload.device_id} registered. Copy the generated API key before leaving this page.`
          : `${response?.device_id || payload.device_id} registered. Configure the same API key on the physical device or simulator.`,
      );
      await loadDevices({ showLoading: false });
    } catch (registerError) {
      setDeviceSubmitError(registerError.message || "Unable to register device.");
    } finally {
      setIsSubmittingDevice(false);
    }
  }

  async function handleUpdateDevice(payload) {
    if (!editingDevice?.device_id) {
      return;
    }

    setIsSubmittingDevice(true);
    setDeviceSubmitError("");
    setSuccessMessage("");
    setGeneratedApiKey("");
    try {
      const updatedDevice = await updateDevice(editingDevice.device_id, payload);
      setEditingDevice(null);
      setSuccessMessage(`${updatedDevice?.name || updatedDevice?.device_id || editingDevice.device_id} updated.`);
      await loadDevices({ showLoading: false });
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

  return (
    <section className="space-y-4">
      <Breadcrumbs items={[{ label: "Devices", to: "/devices" }]} levelLabel="System Devices" />
      <LiveUpdateStatus
        realtimeStatus={realtime?.status}
        lastUpdatedAt={lastUpdatedAt}
        liveUpdateReceived={liveUpdateReceived}
        lastEventType={lastRefreshEventType}
        isRefreshing={isRefreshing}
        onRefresh={refreshManually}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1C2B21]">Devices / Cameras</h2>
          <p className="mt-1 text-sm text-[#6B7280]">Registered ESP32/ESP32-CAM devices, camera placeholders, and latest droppings analysis.</p>
        </div>
        {isAdmin ? (
          <button
            type="button"
            onClick={openRegisterModal}
            className="rounded-xl bg-[#15803D] px-5 py-2.5 text-sm font-semibold text-white shadow-apple-sm transition-colors hover:bg-green-800"
          >
            Register Device / Camera
          </button>
        ) : null}
      </div>
      {successMessage ? (
        <p className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800 shadow-apple-sm">
          {successMessage}
        </p>
      ) : null}
      {generatedApiKey ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-apple-sm">
          <p className="font-bold">Copy this API key now. It will not be shown again.</p>
          <code className="mt-3 block overflow-x-auto rounded-lg bg-white p-3 font-mono text-xs text-[#1C2B21] shadow-inner">
            {generatedApiKey}
          </code>
        </div>
      ) : null}
      {!devices.length ? (
        <Card title="No Devices">
          <div className="space-y-4">
            <EmptyState title="No devices registered" message="Register a simulator or ESP32 device to see it here." />
            {isAdmin ? (
              <div className="text-center">
                <button
                  type="button"
                  onClick={openRegisterModal}
                  className="rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white"
                >
                  Register Device / Camera
                </button>
              </div>
            ) : null}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {deviceDetails.map((device) => (
            <DeviceCard
              key={device.device_id}
              device={{
                ...(device.camera || device),
                device_id: device.device_id,
                name: device.name || device.camera?.name,
                device_type: device.device_type,
                camera_type: device.camera_type || device.camera?.camera_type,
                farm_id: device.farm_id,
                coop_id: device.coop_id,
                stream_url: device.stream_url || device.camera?.stream_url,
                location_label: device.location_label || device.camera?.location_label,
                description: device.description || device.camera?.description,
                status: device.status,
                last_seen_at: device.last_seen_at,
                last_event_type: device.last_event_type,
              }}
              canEdit={isAdmin}
              onEdit={() => openEditModal(device)}
            />
          ))}
        </div>
      )}

      <Modal
        title="Register Device / Camera"
        description="Register a device for API-key authenticated IoT ingestion."
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      >
        <DeviceForm
          farms={farms}
          coops={coops}
          onFarmChange={handleRegistrationFarmChange}
          onSubmit={handleRegisterDevice}
          onCancel={() => setIsRegisterOpen(false)}
          isSubmitting={isSubmittingDevice}
          isLoadingCoops={isLoadingCoops}
          error={deviceSubmitError}
        />
      </Modal>

      <Modal
        title="Edit Device / Camera"
        description="Update dashboard camera metadata and device registry placement."
        isOpen={Boolean(editingDevice)}
        onClose={() => setEditingDevice(null)}
      >
        <DeviceForm
          key={editingDevice?.device_id || "edit-device"}
          mode="edit"
          initialValues={editingDevice}
          farms={farms}
          coops={coops}
          onFarmChange={handleRegistrationFarmChange}
          onSubmit={handleUpdateDevice}
          onCancel={() => setEditingDevice(null)}
          isSubmitting={isSubmittingDevice}
          isLoadingCoops={isLoadingCoops}
          error={deviceSubmitError}
        />
      </Modal>
    </section>
  );
}
