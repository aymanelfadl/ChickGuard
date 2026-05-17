export default function EmptyState({ title, message, icon }) {
  return (
    <div className="rounded-lg border border-dashed border-[#CFE8D7] bg-[#F8FBF8] p-6 text-center">
      {icon && (
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#DCFCE7] text-[#15803D]">
          {icon}
        </div>
      )}
      {title && <p className="font-semibold text-[#102A1C]">{title}</p>}
      {message && <p className="mt-1 text-sm leading-6 text-[#64748B]">{message}</p>}
    </div>
  );
}
