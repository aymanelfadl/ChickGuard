export default function Card({ title, description, action, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-apple-sm ${className}`}
    >
      {(title || description || action) && (
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && <h2 className="text-xl font-semibold tracking-tight text-[#1C2B21]">{title}</h2>}
            {description && <div className="mt-1 text-sm font-medium text-[#6B7280]">{description}</div>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
