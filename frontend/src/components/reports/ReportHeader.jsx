import StatusBadge from "../dashboard/StatusBadge.jsx";
import { formatDateTime } from "../../utils/formatters.js";

export default function ReportHeader({ reportType, title, subtitle, status, generatedAt, levelLabel }) {
  return (
    <section className="rounded-lg border border-[#CFE8D7] bg-gradient-to-br from-[#F8FBF8] to-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold uppercase text-[#14532D]">
              {levelLabel || `${reportType} Level`}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-[#64748B] ring-1 ring-[#E2E8F0]">
              {reportType}
            </span>
          </div>
          <h2 className="mt-3 truncate text-2xl font-bold text-[#102A1C]">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm leading-6 text-[#64748B]">{subtitle}</p> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-[#64748B]">Current Health Status</span>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm font-semibold text-[#64748B]">Updated {formatDateTime(generatedAt)}</p>
        </div>
      </div>
    </section>
  );
}
