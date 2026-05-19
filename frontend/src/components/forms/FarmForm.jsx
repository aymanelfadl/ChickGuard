import { useState } from "react";

const INITIAL_FORM = {
  name: "",
  location: "",
  description: "",
};

export default function FarmForm({ onSubmit, onCancel, isSubmitting = false, error }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      location: form.location.trim() || null,
      description: form.description.trim() || null,
    };

    if (!payload.name) {
      setValidationError("Farm name is required.");
      return;
    }

    setValidationError("");
    await onSubmit(payload);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormMessage message={validationError || error} />
      <label className="block text-sm">
        <span className="font-semibold text-[#64748B]">Farm Name</span>
        <input
          className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Farm 01"
          disabled={isSubmitting}
          required
        />
      </label>
      <label className="block text-sm">
        <span className="font-semibold text-[#64748B]">Location</span>
        <input
          className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
          value={form.location}
          onChange={(event) => setForm({ ...form, location: event.target.value })}
          placeholder="Region, city, or site"
          disabled={isSubmitting}
        />
      </label>
      <label className="block text-sm">
        <span className="font-semibold text-[#64748B]">Description</span>
        <textarea
          className="mt-1 min-h-24 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-[#102A1C]"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="Optional notes for managers"
          disabled={isSubmitting}
        />
      </label>
      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} submitLabel="Create Farm" />
    </form>
  );
}

function FormMessage({ message }) {
  if (!message) {
    return null;
  }
  return <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>;
}

function FormActions({ onCancel, isSubmitting, submitLabel }) {
  return (
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
        {isSubmitting ? "Creating..." : submitLabel}
      </button>
    </div>
  );
}
