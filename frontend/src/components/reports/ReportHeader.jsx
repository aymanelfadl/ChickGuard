import StatusBadge from "../dashboard/StatusBadge.jsx";
import { formatDateTime } from "../../utils/formatters.js";

export default function ReportHeader({ reportType, title, subtitle, status, generatedAt, levelLabel }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#14532D]">
              {levelLabel || `${reportType} Level`}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#6B7280] ring-1 ring-gray-200">
              {reportType}
            </span>
          </div>
          <h2 className="mt-3 truncate text-2xl font-bold tracking-tight text-[#1C2B21]">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm leading-6 text-[#6B7280]">{subtitle}</p> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#6B7280]">Current Health Status</span>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm font-medium text-[#6B7280]">Updated {formatDateTime(generatedAt)}</p>
        </div>
      </div>
    </section>
  );
}
