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
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => (
            <article key={image.key} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-apple-sm group transition-shadow hover:shadow-apple-md">
              {image.id ? (
                <div className="aspect-[4/3] overflow-hidden bg-gray-50">
                  <img
                    src={authenticatedImageUrl(`/api/image-gallery/${image.id}/image`)}
                    alt={`Droppings image from ${image.deviceId || "device"}`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center bg-gray-50 px-4 text-center text-sm font-medium text-[#6B7280]">
                  Image preview unavailable
                </div>
              )}
              <div className="space-y-4 p-5">
                <div>
                  <p className="truncate text-sm font-bold text-[#1C2B21]" title={image.imagePath || undefined}>
                    {image.diseaseType || image.healthResult || "Droppings Analysis"}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1">{formatDateTime(image.timestamp)}</p>
                </div>
                <div className="grid gap-2 text-sm">
                  <Info label="Camera / Device" value={image.deviceId} />
                  <Info label="Confidence" value={formatPercent(image.confidence)} />
                  <Info label="Image" value={image.imagePath} />
                </div>
                {image.id ? (
                  <Link className="inline-flex rounded-xl bg-[#15803D] px-4 py-2 text-sm font-semibold text-white shadow-apple-sm transition-colors hover:bg-green-800 w-full justify-center" to={`/gallery/${image.id}`}>
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
    <div className="flex justify-between min-w-0">
      <span className="text-xs font-semibold text-[#6B7280]">{label}</span>
      <span className="truncate font-medium text-[#1C2B21]" title={value || undefined}>{value || "N/A"}</span>
    </div>
  );
}
