import { useEffect, useMemo, useState } from "react";

const INITIAL_FORM = {
  device_id: "",
  name: "",
  device_type: "esp32-cam",
  camera_type: "droppings-camera",
  farm_id: "",
  coop_id: "",
  stream_url: "",
  location_label: "",
  description: "",
  api_key: "",
  is_active: true,
};

const SENSOR_DEVICE_TYPES = new Set(["esp32"]);

export default function DeviceForm({
  farms = [],
  coops = [],
  initialValues = null,
  mode = "create",
  onFarmChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isLoadingCoops = false,
  error,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [validationError, setValidationError] = useState("");
  const isEdit = mode === "edit";
  const selectedFarm = useMemo(
    () => farms.find((farm) => String(farm.id) === String(form.farm_id)),
    [farms, form.farm_id],
  );
  const selectedCoop = useMemo(
    () => coops.find((coop) => String(coop.id) === String(form.coop_id)),
    [coops, form.coop_id],
  );
  const isSensorDevice = SENSOR_DEVICE_TYPES.has(form.device_type);

  useEffect(() => {
    if (!initialValues) {
      return;
    }

    const nextDeviceType = initialValues.device_type || initialValues.camera?.device_type || "esp32-cam";
    const nextIsSensorDevice = SENSOR_DEVICE_TYPES.has(nextDeviceType);
    const farmValue = optionValueForIdentifier(farms, initialValues.farm_id || initialValues.camera?.farm_id);
    setForm((current) => ({
      ...current,
      device_id: initialValues.device_id || "",
      name: initialValues.name || initialValues.camera?.name || "",
      device_type: nextDeviceType,
      camera_type: nextIsSensorDevice ? "" : initialValues.camera_type || initialValues.camera?.camera_type || "droppings-camera",
      farm_id: farmValue || "",
      coop_id: "",
      stream_url: nextIsSensorDevice ? "" : initialValues.stream_url || initialValues.camera?.stream_url || "",
      location_label: initialValues.location_label || initialValues.camera?.location_label || "",
      description: initialValues.description || initialValues.camera?.description || "",
      api_key: "",
      is_active: initialValues.is_active ?? initialValues.camera?.is_active ?? true,
    }));
    if (farmValue) {
      onFarmChange?.(farmValue);
    }
  }, [farms, initialValues, onFarmChange]);

  useEffect(() => {
    if (initialValues && coops.length) {
      const coopValue = optionValueForIdentifier(coops, initialValues.coop_id || initialValues.camera?.coop_id);
      if (coopValue) {
        setForm((current) => ({ ...current, coop_id: coopValue }));
      }
      return;
    }

    if (!initialValues && !form.farm_id && farms[0]) {
      const nextFarmId = String(farms[0].id);
      setForm((current) => ({ ...current, farm_id: nextFarmId }));
      onFarmChange?.(nextFarmId);
    }
  }, [coops, farms, form.farm_id, initialValues, onFarmChange]);

  useEffect(() => {
    if (!coops.length) {
      setForm((current) => ({ ...current, coop_id: "" }));
      return;
    }
    if (!coops.some((coop) => String(coop.id) === String(form.coop_id))) {
      setForm((current) => ({ ...current, coop_id: String(coops[0].id) }));
    }
  }, [coops, form.coop_id]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isEdit && !form.device_id.trim()) {
      setValidationError("Device ID is required.");
      return;
    }
    if (!selectedFarm) {
      setValidationError("Select a farm.");
      return;
    }
    if (!selectedCoop) {
      setValidationError("Select a coop.");
      return;
    }
    if (!isEdit && form.api_key && form.api_key.length < 8) {
      setValidationError("Device API key must be at least 8 characters.");
      return;
    }

    const payload = {
      name: clean(form.name) || form.device_id.trim(),
      device_type: form.device_type.trim(),
      camera_type: isSensorDevice ? null : clean(form.camera_type),
      farm_id: selectedFarm.name,
      coop_id: selectedCoop.name,
      stream_url: isSensorDevice ? null : clean(form.stream_url),
      location_label: clean(form.location_label),
      description: clean(form.description),
    };
    if (!isEdit) {
      payload.device_id = form.device_id.trim();
      if (form.api_key) {
        payload.api_key = form.api_key;
      }
    } else {
      payload.is_active = form.is_active;
    }

    setValidationError("");
    await onSubmit(payload);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="rounded-lg bg-[#F8FBF8] p-3 text-sm leading-6 text-[#475569]">
        Register ESP32 sensors for MQTT telemetry or ESP32-CAM devices for poultry droppings image capture.
      </p>
      <FormMessage message={validationError || error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Device ID"
          value={form.device_id}
          onChange={(value) => setForm({ ...form, device_id: value })}
          placeholder={isSensorDevice ? "esp32-wokwi-01" : "esp32-cam-01"}
          disabled={isSubmitting || isEdit}
          required={!isEdit}
        />
        <InputField
          label="Device Name"
          value={form.name}
          onChange={(value) => setForm({ ...form, name: value })}
          placeholder="Coop 01 Camera"
          disabled={isSubmitting}
        />
        <label className="text-sm">
          <span className="font-semibold text-[#64748B]">Farm</span>
          <select
            className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
            value={form.farm_id}
            onChange={(event) => {
              const nextFarmId = event.target.value;
              setForm({ ...form, farm_id: nextFarmId, coop_id: "" });
              onFarmChange?.(nextFarmId);
            }}
            disabled={isSubmitting || !farms.length}
          >
            <option value="">Select farm</option>
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-semibold text-[#64748B]">Coop</span>
          <select
            className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
            value={form.coop_id}
            onChange={(event) => setForm({ ...form, coop_id: event.target.value })}
            disabled={isSubmitting || isLoadingCoops || !coops.length}
          >
            <option value="">{isLoadingCoops ? "Loading coops..." : "Select coop"}</option>
            {coops.map((coop) => (
              <option key={coop.id} value={coop.id}>
                {coop.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-semibold text-[#64748B]">Device Type</span>
          <select
            className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
            value={form.device_type}
            onChange={(event) => {
              const nextDeviceType = event.target.value;
              const nextIsSensorDevice = SENSOR_DEVICE_TYPES.has(nextDeviceType);
              setForm({
                ...form,
                device_type: nextDeviceType,
                camera_type: nextIsSensorDevice ? "" : form.camera_type || "droppings-camera",
                stream_url: nextIsSensorDevice ? "" : form.stream_url,
              });
            }}
            disabled={isSubmitting}
          >
            <option value="esp32-cam">ESP32-CAM Image Device</option>
            <option value="esp32">ESP32 Sensor Device</option>
            <option value="ip-camera">IP Camera</option>
          </select>
        </label>
        {!isSensorDevice ? (
          <>
            <label className="text-sm">
              <span className="font-semibold text-[#64748B]">Camera Type</span>
              <select
                className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
                value={form.camera_type}
                onChange={(event) => setForm({ ...form, camera_type: event.target.value })}
                disabled={isSubmitting}
              >
                <option value="droppings-camera">Droppings Camera</option>
                <option value="overview-camera">Overview Camera</option>
                <option value="environmental-camera">Environmental Camera</option>
                <option value="security-camera">Security Camera</option>
              </select>
            </label>
            <InputField
              label="Stream URL"
              value={form.stream_url}
              onChange={(value) => setForm({ ...form, stream_url: value })}
              placeholder="http://example.local/stream"
              disabled={isSubmitting}
            />
          </>
        ) : (
          <div className="rounded-lg border border-[#D1FAE5] bg-[#F0FDF4] p-3 text-sm leading-6 text-[#166534] sm:col-span-2">
            This device will be registered for sensor telemetry such as temperature, humidity, and motion readings.
          </div>
        )}
        <InputField
          label="Location Label"
          value={form.location_label}
          onChange={(value) => setForm({ ...form, location_label: value })}
          placeholder="Coop 01 - East side"
          disabled={isSubmitting}
        />
      </div>
      <label className="block text-sm">
        <span className="font-semibold text-[#64748B]">Description</span>
        <textarea
          className="mt-1 min-h-24 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder={isSensorDevice ? "DHT/PIR sensor node for coop telemetry" : "Camera focused on droppings collection area"}
          disabled={isSubmitting}
        />
      </label>
      {!isEdit ? (
        <label className="block text-sm">
          <span className="font-semibold text-[#64748B]">Device API Key</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
            value={form.api_key}
            onChange={(event) => setForm({ ...form, api_key: event.target.value })}
            placeholder="Leave blank to generate a key"
            disabled={isSubmitting}
          />
          <span className="mt-1 block text-xs leading-5 text-[#64748B]">
            If left blank, the backend generates an API key and shows it once. Configure the same key in the device firmware.
          </span>
        </label>
      ) : (
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#475569]">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
            disabled={isSubmitting}
          />
          Active device
        </label>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[#CBD5E1] px-4 py-2 text-sm font-semibold text-[#475569]"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
          disabled={isSubmitting || !farms.length || !coops.length}
        >
          {isSubmitting ? (isEdit ? "Saving..." : "Registering...") : isEdit ? "Save Device" : "Register Device"}
        </button>
      </div>
    </form>
  );
}

function InputField({ label, value, onChange, placeholder, disabled, required = false }) {
  return (
    <label className="text-sm">
      <span className="font-semibold text-[#64748B]">{label}</span>
      <input
        className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
    </label>
  );
}

function FormMessage({ message }) {
  if (!message) {
    return null;
  }
  return <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>;
}

function clean(value) {
  const trimmed = value?.trim?.() || "";
  return trimmed || null;
}

function optionValueForIdentifier(options, identifier) {
  if (identifier === null || identifier === undefined || identifier === "") {
    return "";
  }
  const match = options.find(
    (option) => String(option.id) === String(identifier) || String(option.name) === String(identifier),
  );
  return match ? String(match.id) : "";
}
