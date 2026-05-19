import { X } from "lucide-react";

export default function Modal({ title, description, isOpen, onClose, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#102A1C]/45 px-4 py-4 sm:items-center">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-[#102A1C]">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-6 text-[#64748B]">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FBF8]"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
