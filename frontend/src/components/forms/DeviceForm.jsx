import { useEffect, useMemo, useState } from "react";

const INITIAL_FORM = {
  device_id: "",
  device_type: "esp32-cam",
  farm_id: "",
  coop_id: "",
  api_key: "",
};

export default function DeviceForm({
  farms = [],
  coops = [],
  onFarmChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isLoadingCoops = false,
  error,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [validationError, setValidationError] = useState("");
  const selectedFarm = useMemo(
    () => farms.find((farm) => String(farm.id) === String(form.farm_id)),
    [farms, form.farm_id],
  );
  const selectedCoop = useMemo(
    () => coops.find((coop) => String(coop.id) === String(form.coop_id)),
    [coops, form.coop_id],
  );

  useEffect(() => {
    if (!form.farm_id && farms[0]) {
      const nextFarmId = String(farms[0].id);
      setForm((current) => ({ ...current, farm_id: nextFarmId }));
      onFarmChange(nextFarmId);
    }
  }, [farms, form.farm_id, onFarmChange]);

  useEffect(() => {
    if (!coops.some((coop) => String(coop.id) === String(form.coop_id))) {
      setForm((current) => ({ ...current, coop_id: coops[0] ? String(coops[0].id) : "" }));
    }
  }, [coops, form.coop_id]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.device_id.trim()) {
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
    if (form.api_key.length < 8) {
      setValidationError("Device API key must be at least 8 characters.");
      return;
    }

    setValidationError("");
    await onSubmit({
      device_id: form.device_id.trim(),
      device_type: form.device_type.trim(),
      farm_id: selectedFarm.name,
      coop_id: selectedCoop.name,
      api_key: form.api_key,
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="rounded-lg bg-[#F8FBF8] p-3 text-sm leading-6 text-[#475569]">
        Device registration is handled through the device registry API. The dashboard camera card is synced from that registry.
        Camera display name, camera type, and stream URL are not editable in the current backend API.
      </p>
      <FormMessage message={validationError || error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="font-semibold text-[#64748B]">Device ID</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
            value={form.device_id}
            onChange={(event) => setForm({ ...form, device_id: event.target.value })}
            placeholder="esp32-sim-01"
            disabled={isSubmitting}
            required
          />
        </label>
        <label className="text-sm">
          <span className="font-semibold text-[#64748B]">Device Type</span>
          <select
            className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
            value={form.device_type}
            onChange={(event) => setForm({ ...form, device_type: event.target.value })}
            disabled={isSubmitting}
          >
            <option value="esp32-cam">ESP32-CAM</option>
            <option value="esp32">ESP32</option>
            <option value="ip-camera">IP Camera</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="font-semibold text-[#64748B]">Farm</span>
          <select
            className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
            value={form.farm_id}
            onChange={(event) => {
              const nextFarmId = event.target.value;
              setForm({ ...form, farm_id: nextFarmId, coop_id: "" });
              onFarmChange(nextFarmId);
            }}
            disabled={isSubmitting || !farms.length}
          >
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
      </div>
      <label className="block text-sm">
        <span className="font-semibold text-[#64748B]">Device API Key</span>
        <input
          className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
          value={form.api_key}
          onChange={(event) => setForm({ ...form, api_key: event.target.value })}
          placeholder="Minimum 8 characters"
          disabled={isSubmitting}
          required
        />
        <span className="mt-1 block text-xs leading-5 text-[#64748B]">
          Configure this key on the device now. The backend stores only a hash and will not show it again.
        </span>
      </label>
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
          {isSubmitting ? "Registering..." : "Register Device / Camera"}
        </button>
      </div>
    </form>
  );
}

function FormMessage({ message }) {
  if (!message) {
    return null;
  }
  return <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>;
}
