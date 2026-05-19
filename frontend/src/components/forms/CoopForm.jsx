import { useState } from "react";

const INITIAL_FORM = {
  name: "",
  description: "",
  capacity: "",
};

export default function CoopForm({ farmName, onSubmit, onCancel, isSubmitting = false, error }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const capacity = form.capacity === "" ? null : Number(form.capacity);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      capacity,
    };

    if (!payload.name) {
      setValidationError("Coop name is required.");
      return;
    }
    if (capacity !== null && (!Number.isFinite(capacity) || capacity < 0)) {
      setValidationError("Capacity must be a positive number.");
      return;
    }

    setValidationError("");
    await onSubmit(payload);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="rounded-lg bg-[#F8FBF8] p-3 text-sm text-[#475569]">
        This coop will be created under <span className="font-bold text-[#102A1C]">{farmName || "this farm"}</span>.
      </p>
      <FormMessage message={validationError || error} />
      <label className="block text-sm">
        <span className="font-semibold text-[#64748B]">Coop Name</span>
        <input
          className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Coop 01"
          disabled={isSubmitting}
          required
        />
      </label>
      <label className="block text-sm">
        <span className="font-semibold text-[#64748B]">Capacity</span>
        <input
          className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
          value={form.capacity}
          onChange={(event) => setForm({ ...form, capacity: event.target.value })}
          placeholder="Optional bird capacity"
          type="number"
          min="0"
          disabled={isSubmitting}
        />
      </label>
      <label className="block text-sm">
        <span className="font-semibold text-[#64748B]">Description</span>
        <textarea
          className="mt-1 min-h-24 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="Optional coop notes"
          disabled={isSubmitting}
        />
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
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Coop"}
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
