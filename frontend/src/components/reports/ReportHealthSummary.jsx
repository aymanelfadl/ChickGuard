import Card from "../common/Card.jsx";

export default function ReportHealthSummary({ reportType, name, sickDetections = 0, activeAlerts = 0 }) {
  const hasProblem = sickDetections > 0 || activeAlerts > 0;
  const levelName = reportType === "Coop Report" ? "coop" : "farm";

  return (
    <Card
      title="Health Summary"
      description="Plain-language interpretation of droppings analysis and active alerts."
      className={hasProblem ? "border-[#FECACA] bg-red-50/70" : ""}
    >
      <p className={`text-base leading-7 ${hasProblem ? "text-[#7F1D1D]" : "text-[#14532D]"}`}>
        {hasProblem
          ? `${reportType} ${name} needs attention because ${sickDetections} sick detection${sickDetections === 1 ? "" : "s"} and ${activeAlerts} active alert${activeAlerts === 1 ? "" : "s"} were found from recent droppings analyses.`
          : `This ${levelName} currently has no sick detections from droppings analysis.`}
      </p>
    </Card>
  );
}
