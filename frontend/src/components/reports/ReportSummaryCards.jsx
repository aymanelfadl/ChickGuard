export default function ReportSummaryCards({ items = [] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
      {items.map((item) => (
        <article key={item.label} className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.04em] text-[#64748B]">{item.label}</p>
          <p className={`mt-2 text-3xl font-bold ${item.danger ? "text-[#DC2626]" : "text-[#102A1C]"}`}>
            {item.value ?? 0}
          </p>
          {item.description ? <p className="mt-2 text-sm leading-5 text-[#64748B]">{item.description}</p> : null}
        </article>
      ))}
    </section>
  );
}
