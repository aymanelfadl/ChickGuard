export default function ReportSummaryCards({ items = [] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article key={item.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">{item.label}</p>
          <p className={`mt-2 text-2xl font-bold tracking-tight ${item.danger ? "text-red-600" : "text-[#1C2B21]"}`}>
            {item.value ?? 0}
          </p>
          {item.description ? <p className="mt-2 text-sm leading-5 text-[#6B7280]">{item.description}</p> : null}
        </article>
      ))}
    </section>
  );
}
