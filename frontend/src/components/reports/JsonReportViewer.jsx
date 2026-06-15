import Card from "../common/Card.jsx";

export default function JsonReportViewer({ title = "Raw JSON", report }) {
  return (
    <Card title={title} description="JSON report output. PDF export is planned later.">
      <pre className="max-h-[540px] overflow-auto rounded-lg bg-[#102A1C] p-4 text-xs leading-6 text-[#DCFCE7]">
        {JSON.stringify(report, null, 2)}
      </pre>
    </Card>
  );
}
