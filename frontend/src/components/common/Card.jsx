export default function Card({ title, description, action, children, className = "" }) {
  return (
    <section
      className={`rounded-lg border border-gray-200 bg-white p-5 shadow-sm ${className}`}
    >
      {(title || description || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && <h2 className="text-lg font-semibold tracking-tight text-[#1C2B21]">{title}</h2>}
            {description && <div className="mt-1 text-sm leading-6 text-[#6B7280]">{description}</div>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
