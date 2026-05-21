export default function ReportSummaryCards({ items = [] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
      {items.map((item) => (
        <article key={item.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-apple-sm">
          <p className="text-xs font-semibold text-[#6B7280]">{item.label}</p>
          <p className={`mt-2 text-3xl font-bold tracking-tight ${item.danger ? "text-red-600" : "text-[#1C2B21]"}`}>
            {item.value ?? 0}
          </p>
          {item.description ? <p className="mt-2 text-sm leading-5 text-[#6B7280]">{item.description}</p> : null}
        </article>
      ))}
    </section>
  );
}
