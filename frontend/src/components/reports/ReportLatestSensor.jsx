import Card from "../common/Card.jsx";
import EmptyState from "../common/EmptyState.jsx";
import { formatDateTime, formatHumidity, formatTemperature, formatWeight } from "../../utils/formatters.js";

export default function ReportLatestSensor({ sensor }) {
  return (
    <Card title="Latest Sensor Reading" description="Latest environmental reading for this coop.">
      {!sensor ? (
        <EmptyState title="No sensor reading" message="Sensor readings for this coop will appear here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SensorValue label="Temperature" value={formatTemperature(sensor.temperature_c)} interpretation={temperatureLabel(sensor.temperature_c)} />
          <SensorValue label="Humidity" value={formatHumidity(sensor.humidity_percent)} interpretation={humidityLabel(sensor.humidity_percent)} />
          <SensorValue label="Weight" value={formatWeight(sensor.weight_kg)} interpretation={sensor.weight_kg == null ? "Unknown" : "Normal"} />
          <SensorValue label="Captured At" value={formatDateTime(sensor.timestamp)} interpretation="Latest" />
        </div>
      )}
    </Card>
  );
}

function SensorValue({ label, value, interpretation }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FBF8] p-4">
      <p className="text-xs font-bold uppercase text-[#64748B]">{label}</p>
      <p className="mt-2 text-xl font-bold text-[#102A1C]">{value}</p>
      <p className="mt-2 text-sm font-semibold text-[#14532D]">{interpretation}</p>
    </div>
  );
}

function temperatureLabel(value) {
  if (value === null || value === undefined) return "Unknown";
  if (value < 18) return "Low";
  if (value > 32) return "High";
  return "Normal";
}

function humidityLabel(value) {
  if (value === null || value === undefined) return "Unknown";
  if (value < 40) return "Low";
  if (value > 75) return "High";
  return "Normal";
}
