export default function ReportJsonViewer({ report }) {
  if (!report) {
    return null;
  }

  return (
    <details className="rounded-xl border border-gray-100 bg-white p-4 shadow-apple-sm">
      <summary className="cursor-pointer text-sm font-semibold text-[#1C2B21]">Developer JSON</summary>
      <pre className="mt-4 max-h-[420px] max-w-full overflow-auto rounded-xl bg-[#1C2B21] p-4 text-xs leading-6 text-[#DCFCE7] shadow-inner">
        {JSON.stringify(report, null, 2)}
      </pre>
    </details>
  );
}
