import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ErrorState from "../components/common/ErrorState.jsx";
import LiveUpdateStatus from "../components/common/LiveUpdateStatus.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import ImageAnalysisCard from "../components/gallery/ImageAnalysisCard.jsx";
import { useImageGallery } from "../hooks/useImageGallery.js";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh.js";
import Breadcrumbs from "../components/navigation/Breadcrumbs.jsx";

const DEFAULT_FILTERS = {
  farm_id: "",
  coop_id: "",
  device_id: "",
  prediction_status: "",
  disease_type: "",
  camera_type: "",
  date_from: "",
  date_to: "",
  search: "",
  limit: 20,
  offset: 0,
};

export default function ImageGalleryPage({ realtime }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = useMemo(() => ({
    ...DEFAULT_FILTERS,
    farm_id: searchParams.get("farm_id") || "",
    coop_id: searchParams.get("coop_id") || "",
    device_id: searchParams.get("device_id") || "",
    prediction_status: searchParams.get("prediction_status") || "",
    disease_type: searchParams.get("disease_type") || "",
    camera_type: searchParams.get("camera_type") || "",
    date_from: searchParams.get("date_from") || "",
    date_to: searchParams.get("date_to") || "",
    search: searchParams.get("search") || "",
    offset: Number(searchParams.get("offset") || 0),
  }), [searchParams]);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const gallery = useImageGallery(initialFilters);
  const { isRefreshing, lastRefreshEventType, liveUpdateReceived, refreshManually } = useRealtimeRefresh(
    realtime,
    gallery.refreshGallery,
  );

  function updateDraft(key, value) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function applyFilters(event) {
    event.preventDefault();
    const nextParams = new URLSearchParams();
    Object.entries({ ...draftFilters, offset: 0 }).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "" && value !== 0) {
        nextParams.set(key, value);
      }
    });
    setSearchParams(nextParams);
  }

  function goToOffset(nextOffset) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextOffset > 0) {
      nextParams.set("offset", nextOffset);
    } else {
      nextParams.delete("offset");
    }
    setSearchParams(nextParams);
  }

  if (gallery.isLoading) {
    return <LoadingState />;
  }

  if (gallery.error) {
    return <ErrorState error={gallery.error} />;
  }

  const canGoPrevious = gallery.offset > 0;
  const canGoNext = gallery.offset + gallery.limit < gallery.totalCount;

  return (
    <section className="space-y-8 pb-12">
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Image Gallery", to: "/gallery" }]} levelLabel="System Image Gallery" />
        <LiveUpdateStatus
          realtimeStatus={realtime?.status}
          lastUpdatedAt={gallery.lastUpdatedAt}
          liveUpdateReceived={liveUpdateReceived}
          liveUpdateLabel="New image analysis received"
          lastEventType={lastRefreshEventType}
          isRefreshing={isRefreshing}
          onRefresh={refreshManually}
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1C2B21]">Image Gallery</h1>
            <p className="mt-1 text-sm text-[#6B7280]">Browse poultry droppings image evidence across farms, coops, and cameras.</p>
          </div>
          <p className="text-sm font-medium text-[#6B7280]">{gallery.totalCount} images found</p>
        </div>
      </div>

      <details className="rounded-xl border border-gray-100 bg-white p-4 shadow-apple-sm md:hidden">
        <summary className="cursor-pointer text-sm font-semibold text-[#1C2B21]">Filters</summary>
        <form onSubmit={applyFilters} className="mt-4 grid gap-4">
          <FilterFields
            draftFilters={draftFilters}
            updateDraft={updateDraft}
            clearFilters={() => {
              setDraftFilters(DEFAULT_FILTERS);
              setSearchParams(new URLSearchParams());
            }}
          />
        </form>
      </details>

      <form
        onSubmit={applyFilters}
        className="hidden gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-apple-sm md:grid md:grid-cols-4 xl:grid-cols-8"
      >
        <FilterFields
          draftFilters={draftFilters}
          updateDraft={updateDraft}
          clearFilters={() => {
            setDraftFilters(DEFAULT_FILTERS);
            setSearchParams(new URLSearchParams());
          }}
        />
      </form>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {gallery.items.map((item) => (
          <ImageAnalysisCard key={item.id} item={item} />
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm shadow-apple-sm">
        <span className="font-medium text-[#6B7280]">
          Showing {gallery.totalCount ? gallery.offset + 1 : 0}-
          {Math.min(gallery.offset + gallery.limit, gallery.totalCount)} of {gallery.totalCount}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canGoPrevious}
            onClick={() => goToOffset(Math.max(0, gallery.offset - gallery.limit))}
            className="rounded-xl border border-gray-200 px-3 py-2 font-semibold text-[#1C2B21] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => goToOffset(gallery.offset + gallery.limit)}
            className="rounded-xl border border-gray-200 px-3 py-2 font-semibold text-[#1C2B21] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

function FilterInput({ label, value, onChange, type = "text" }) {
  return (
    <label className="text-sm">
      <span className="font-medium text-[#6B7280]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-[#1C2B21] focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] focus:outline-none transition-colors"
      />
    </label>
  );
}

function FilterFields({ draftFilters, updateDraft, clearFilters }) {
  return (
    <>
      <FilterInput label="Farm" value={draftFilters.farm_id} onChange={(value) => updateDraft("farm_id", value)} />
      <FilterInput label="Coop" value={draftFilters.coop_id} onChange={(value) => updateDraft("coop_id", value)} />
      <FilterInput label="Camera" value={draftFilters.device_id} onChange={(value) => updateDraft("device_id", value)} />
      <label className="text-sm">
        <span className="font-medium text-[#6B7280]">Status</span>
        <select
          value={draftFilters.prediction_status}
          onChange={(event) => updateDraft("prediction_status", event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-[#1C2B21] focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] focus:outline-none transition-colors"
        >
          <option value="">Any</option>
          <option value="healthy">Healthy</option>
          <option value="sick">Sick</option>
        </select>
      </label>
      <FilterInput label="Disease" value={draftFilters.disease_type} onChange={(value) => updateDraft("disease_type", value)} />
      <label className="text-sm">
        <span className="font-medium text-[#6B7280]">Camera Type</span>
        <select
          value={draftFilters.camera_type}
          onChange={(event) => updateDraft("camera_type", event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-[#1C2B21] focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] focus:outline-none transition-colors"
        >
          <option value="">Any</option>
          <option value="droppings-camera">Droppings Camera</option>
          <option value="overview-camera">Overview Camera</option>
          <option value="environmental-camera">Environmental Camera</option>
          <option value="security-camera">Security Camera</option>
        </select>
      </label>
      <FilterInput label="From" type="date" value={draftFilters.date_from} onChange={(value) => updateDraft("date_from", value)} />
      <FilterInput label="To" type="date" value={draftFilters.date_to} onChange={(value) => updateDraft("date_to", value)} />
      <FilterInput label="Search" value={draftFilters.search} onChange={(value) => updateDraft("search", value)} />
      <div className="flex gap-2 md:col-span-4 xl:col-span-8 items-end">
        <button type="submit" className="rounded-xl bg-[#15803D] px-4 py-2 text-sm font-semibold text-white shadow-apple-sm transition-colors hover:bg-green-800">
          Apply Filters
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-[#1C2B21] shadow-apple-sm transition-colors hover:bg-gray-50"
        >
          Clear
        </button>
      </div>
    </>
  );
}
