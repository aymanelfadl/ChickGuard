export default function Card({ title, description, action, children, className = "" }) {
  return (
    <section
      className={`rounded-lg border border-[#E2E8F0] bg-white/95 p-5 shadow-[0_18px_50px_rgba(20,83,45,0.07)] backdrop-blur-sm ${className}`}
    >
      {(title || description || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && <h2 className="text-lg font-semibold text-[#102A1C]">{title}</h2>}
            {description && <div className="mt-1 text-sm leading-6 text-[#64748B]">{description}</div>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
