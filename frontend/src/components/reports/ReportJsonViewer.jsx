export default function ReportJsonViewer({ report }) {
  if (!report) {
    return null;
  }

  return (
    <details className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-bold text-[#14532D]">Developer JSON</summary>
      <pre className="mt-4 max-h-[420px] max-w-full overflow-auto rounded-lg bg-[#102A1C] p-4 text-xs leading-6 text-[#DCFCE7]">
        {JSON.stringify(report, null, 2)}
      </pre>
    </details>
  );
}
