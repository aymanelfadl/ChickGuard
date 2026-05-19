import { ArrowLeft, Building2, Camera, Home } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import Card from "../components/common/Card.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import StatusBadge from "../components/dashboard/StatusBadge.jsx";
import Breadcrumbs from "../components/navigation/Breadcrumbs.jsx";
import HierarchyContext from "../components/navigation/HierarchyContext.jsx";
import { useImageAnalysisDetails } from "../hooks/useImageGallery.js";
import { authenticatedImageUrl } from "../services/imageGalleryService.js";
import { formatDateTime, formatHumidity, formatPercent, formatTemperature, formatWeight } from "../utils/formatters.js";

export default function ImageAnalysisDetailsPage() {
  const { imageReadingId } = useParams();
  const { analysis, isLoading, error } = useImageAnalysisDetails(imageReadingId);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  const sensor = analysis?.sensor_snapshot;
  const farmLabel = analysis.farm_name || analysis.farm_id || "Farm";
  const coopLabel = analysis.coop_name || analysis.coop_id || "Coop";
  const deviceLabel = analysis.device_name || analysis.device_id || "Camera";
  const resultLabel = analysis.disease_type || (analysis.prediction_status === "healthy" ? "Healthy" : "Droppings Analysis");

  return (
    <section className="space-y-5">
      <div className="space-y-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Farms", to: "/farms" },
            { label: farmLabel, to: analysis.farm_id ? `/farms/${analysis.farm_id}` : "/farms" },
            { label: coopLabel, to: analysis.coop_id ? `/coops/${analysis.coop_id}` : undefined },
            { label: `Camera ${deviceLabel}`, to: analysis.device_id ? `/devices/${analysis.device_id}` : undefined },
            { label: "Image Analysis", to: `/gallery/${imageReadingId}` },
          ]}
          levelLabel="Image Analysis Level"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold uppercase text-[#14532D]">
              Image Analysis Level
            </span>
            <h1 className="mt-2 truncate text-2xl font-bold text-[#102A1C]">{resultLabel}</h1>
            <p className="text-sm text-[#64748B]">
              {farmLabel} · {coopLabel} · Camera {deviceLabel} · Captured {formatDateTime(analysis.captured_at)}
            </p>
          </div>
        </div>
        <HierarchyContext
          farm={{ label: farmLabel, to: analysis.farm_id ? `/farms/${analysis.farm_id}` : "/farms" }}
          coop={{ label: coopLabel, to: analysis.coop_id ? `/coops/${analysis.coop_id}` : undefined }}
          device={{ label: deviceLabel, to: analysis.device_id ? `/devices/${analysis.device_id}` : undefined }}
          status={analysis.prediction_status}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/gallery" className="inline-flex items-center gap-2 text-sm font-semibold text-[#14532D]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to gallery
        </Link>
        <div className="flex flex-wrap gap-2">
          <LinkButton to={`/farms/${analysis.farm_id}`} icon={Building2} label="Open Farm" />
          <LinkButton to={`/coops/${analysis.coop_id}`} icon={Home} label="Open Coop" />
          <LinkButton to={`/devices/${analysis.device_id}`} icon={Camera} label="Open Device" />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-sm">
          <img
            src={authenticatedImageUrl(analysis.image_url)}
            alt={`Poultry droppings image ${analysis.image_filename}`}
            className="max-h-[70vh] w-full object-contain bg-[#F8FAFC]"
          />
        </div>

        <div className="space-y-4">
          <Card
            title={analysis.disease_type || "Droppings Analysis"}
            description={analysis.image_filename}
            action={<StatusBadge status={analysis.prediction_status} />}
          >
            <dl className="space-y-3 text-sm">
              <Row label="Prediction" value={analysis.prediction_status} />
              <Row label="Disease" value={analysis.disease_type || "No disease detected"} />
              <Row label="Display Name" value={analysis.prediction?.disease_display_name} />
              <Row label="Confidence" value={formatPercent(analysis.confidence)} />
              <Row label="Raw Label" value={analysis.raw_label} />
              <Row label="Captured" value={formatDateTime(analysis.captured_at)} />
              <Row label="Stored" value={formatDateTime(analysis.created_at)} />
            </dl>
          </Card>

          <Card title="Source" description="Farm, coop, and camera context.">
            <dl className="space-y-3 text-sm">
              <Row label="Farm" value={analysis.farm_name || analysis.farm_id} />
              <Row label="Coop" value={analysis.coop_name || analysis.coop_id} />
              <Row label="Device" value={analysis.device_name || analysis.device_id} />
              <Row label="Device ID" value={analysis.device_id} />
              <Row label="Device Type" value={analysis.device_type} />
              <Row label="Camera Type" value={analysis.camera_type} />
              <Row label="Location Label" value={analysis.location_label} />
            </dl>
          </Card>

          <Card title="Related Sensor Snapshot" description="Nearest sensor reading for this device timeline.">
            {sensor ? (
              <dl className="space-y-3 text-sm">
                <Row label="Temperature" value={formatTemperature(sensor.temperature_c)} />
                <Row label="Humidity" value={formatHumidity(sensor.humidity_percent)} />
                <Row label="Weight" value={formatWeight(sensor.weight_kg)} />
                <Row label="Captured" value={formatDateTime(sensor.timestamp)} />
              </dl>
            ) : (
              <p className="text-sm text-[#64748B]">No nearby sensor reading was found.</p>
            )}
          </Card>
        </div>
      </div>

      <Card title="Related Alerts" description="Recent sick detections for this farm, coop, and camera.">
        {analysis.related_alerts?.length ? (
          <div className="space-y-3">
            {analysis.related_alerts.map((alert) => (
              <p key={alert.id} className="rounded-lg border border-[#FECACA] bg-red-50 p-3 text-sm text-[#7F1D1D]">
                {alert.disease_type || "Sick detection"} on {alert.device_id} at {formatDateTime(alert.timestamp)}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#64748B]">No related health alerts.</p>
        )}
      </Card>
    </section>
  );
}

function LinkButton({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-lg border border-[#CFE8D7] bg-white px-3 py-2 text-sm font-semibold text-[#14532D] shadow-sm"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
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
