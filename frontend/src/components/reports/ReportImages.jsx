import { Link } from "react-router-dom";

import Card from "../common/Card.jsx";
import EmptyState from "../common/EmptyState.jsx";
import { authenticatedImageUrl } from "../../services/imageGalleryService.js";
import { formatDateTime, formatPercent } from "../../utils/formatters.js";

export default function ReportImages({ images = [] }) {
  return (
    <Card title="Recent Droppings Images" description="Image evidence referenced by this report.">
      {!images.length ? (
        <EmptyState title="No droppings images" message="No droppings images are available for this report yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => (
            <article key={image.key} className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
              {image.id ? (
                <img
                  src={authenticatedImageUrl(`/api/image-gallery/${image.id}/image`)}
                  alt={`Droppings image from ${image.deviceId || "device"}`}
                  className="h-44 w-full bg-[#F8FAFC] object-cover"
                />
              ) : (
                <div className="flex h-24 items-center justify-center bg-[#F8FAFC] px-4 text-center text-sm font-semibold text-[#64748B]">
                  Image preview unavailable
                </div>
              )}
              <div className="space-y-3 p-4">
                <div>
                  <p className="truncate text-sm font-bold text-[#102A1C]" title={image.imagePath || undefined}>
                    {image.diseaseType || image.healthResult || "Droppings Analysis"}
                  </p>
                  <p className="text-xs text-[#64748B]">{formatDateTime(image.timestamp)}</p>
                </div>
                <dl className="grid gap-2 text-sm">
                  <Info label="Camera / Device" value={image.deviceId} />
                  <Info label="Confidence" value={formatPercent(image.confidence)} />
                  <Info label="Image" value={image.imagePath} />
                </dl>
                {image.id ? (
                  <Link className="inline-flex rounded-lg bg-[#14532D] px-3 py-2 text-sm font-semibold text-white" to={`/gallery/${image.id}`}>
                    Open Analysis
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold uppercase text-[#64748B]">{label}</dt>
      <dd className="truncate font-semibold text-[#102A1C]" title={value || undefined}>{value || "N/A"}</dd>
    </div>
  );
}
