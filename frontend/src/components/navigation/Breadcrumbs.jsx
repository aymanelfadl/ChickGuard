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
    <nav aria-label="Breadcrumb" className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <ol className="hidden min-w-0 flex-wrap items-center gap-2 text-sm font-medium text-[#6B7280] sm:flex">
          {items.map((item, index) => {
            const isCurrent = index === items.length - 1;

            return (
              <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
                {index > 0 ? <ChevronRight className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden="true" /> : null}
                {item.to && !isCurrent ? (
                 <Link className="truncate transition-colors hover:text-[#1C2B21]" to={item.to}>
                    {item.label}
                  </Link>
                ) : (
                  <span className={`${isCurrent ? "text-[#1C2B21] font-semibold" : ""} truncate`}>
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {levelLabel && (
          <span className="hidden sm:inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-[#6B7280]">
            {levelLabel}
          </span>
        )}
      </div>

      <div className="min-w-0 sm:hidden">
        {previous?.to ? (
          <Link className="inline-flex max-w-full items-center gap-2 text-sm font-semibold text-[#15803D]" to={previous.to}>
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{current.label}</span>
          </Link>
        ) : (
          <p className="truncate text-sm font-semibold text-[#1C2B21]">{current.label}</p>
        )}
        {levelLabel && (
           <p className="mt-1 truncate text-xs font-medium text-[#6B7280]">
             {levelLabel}
           </p>
        )}
      </div>
    </nav>
  );
}
