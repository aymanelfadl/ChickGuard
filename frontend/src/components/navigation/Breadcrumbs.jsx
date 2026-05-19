import { ArrowLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Breadcrumbs({ items = [], levelLabel }) {
  if (!items.length) {
    return null;
  }

  const current = items[items.length - 1];
  const previous = [...items].reverse().find((item, index) => index > 0 && item.to);
  const parent = items.length > 1 ? items[items.length - 2] : null;

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="hidden min-w-0 flex-wrap items-center gap-1 text-sm font-semibold text-[#64748B] sm:flex">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 ? <ChevronRight className="h-4 w-4 shrink-0 text-[#94A3B8]" aria-hidden="true" /> : null}
              {item.to && !isCurrent ? (
                <Link className="truncate rounded-md px-1.5 py-1 text-[#14532D] hover:bg-[#DCFCE7]" to={item.to}>
                  {item.label}
                </Link>
              ) : (
                <span className={`${isCurrent ? "text-[#102A1C]" : ""} truncate px-1.5 py-1`}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="min-w-0 sm:hidden">
        {previous?.to ? (
          <Link className="inline-flex max-w-full items-center gap-2 text-sm font-bold text-[#14532D]" to={previous.to}>
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{current.label}</span>
          </Link>
        ) : (
          <p className="truncate text-sm font-bold text-[#102A1C]">{current.label}</p>
        )}
        <p className="mt-1 truncate text-xs font-semibold text-[#64748B]">
          {[parent?.label, levelLabel].filter(Boolean).join(" / ")}
        </p>
      </div>
    </nav>
  );
}
