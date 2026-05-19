import { Link } from "react-router-dom";

import StatusBadge from "../dashboard/StatusBadge.jsx";
import { authenticatedImageUrl } from "../../services/imageGalleryService.js";
import { formatDateTime, formatPercent } from "../../utils/formatters.js";

export default function ImageAnalysisCard({ item }) {
  return (
    <Link
      to={`/gallery/${item.id}`}
      className="group overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#86EFAC] hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-[#F1F5F9]">
        <img
          src={authenticatedImageUrl(item.image_url)}
          alt={`Poultry droppings image from ${item.device_id}`}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#102A1C]" title={item.image_filename}>
              {item.image_filename}
            </p>
            <p className="mt-1 text-xs text-[#64748B]">
              {item.farm_name || item.farm_id} / {item.coop_name || item.coop_id}
            </p>
          </div>
          <StatusBadge status={item.prediction_status} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <Field label="Disease" value={item.disease_type || "No disease"} />
          <Field label="Confidence" value={formatPercent(item.confidence)} />
          <Field label="Camera" value={item.device_name || item.device_id} />
          <Field label="Captured" value={formatDateTime(item.captured_at)} />
        </div>
      </div>
    </Link>
  );
}

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="font-semibold uppercase text-[#64748B]">{label}</p>
      <p className="mt-1 truncate font-semibold text-[#102A1C]" title={value || undefined}>
        {value || "N/A"}
      </p>
    </div>
  );
}

