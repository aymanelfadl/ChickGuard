import Card from "../common/Card.jsx";

export default function ReportHealthSummary({ reportType, name, sickDetections = 0, activeAlerts = 0 }) {
  const hasProblem = sickDetections > 0 || activeAlerts > 0;
  const levelName = reportType === "Coop Report" ? "coop" : "farm";

  return (
    <Card
      title="Image Alert Summary"
      description="Plain-language interpretation of droppings image alerts."
      className={hasProblem ? "border-red-100 bg-[#FEF2F2]" : ""}
    >
      <p className={`text-base leading-7 ${hasProblem ? "text-red-800" : "text-[#1C2B21]"}`}>
        {hasProblem
          ? `${reportType} ${name} needs attention because ${sickDetections} sick detection${sickDetections === 1 ? "" : "s"} and ${activeAlerts} image alert${activeAlerts === 1 ? "" : "s"} were found from recent droppings analyses.`
          : `This ${levelName} currently has no sick detections from droppings analysis.`}
      </p>
    </Card>
  );
}
