import Card from "../common/Card.jsx";
import EmptyState from "../common/EmptyState.jsx";
import { formatDateTime, formatHumidity, formatMotion, formatTemperature } from "../../utils/formatters.js";

export default function ReportLatestSensor({ sensor }) {
  return (
    <Card title="Latest Sensor Reading" description="Most recent temperature, humidity, and PIR motion sample.">
      {!sensor ? (
        <EmptyState title="No sensor reading" message="Sensor readings for this coop will appear here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <SensorValue label="Temperature" value={formatTemperature(sensor.temperature_c)} interpretation={temperatureLabel(sensor.temperature_c)} />
          <SensorValue label="Humidity" value={formatHumidity(sensor.humidity_percent)} interpretation={humidityLabel(sensor.humidity_percent)} />
          <SensorValue label="Motion" value={formatMotion(sensor.motion)} interpretation={motionLabel(sensor.motion)} />
          <SensorValue label="Captured At" value={formatDateTime(sensor.timestamp)} interpretation="Latest" />
        </div>
      )}
    </Card>
  );
}

function SensorValue({ label, value, interpretation }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-[#F8FAFC] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
      <p className="mt-2 text-lg font-bold text-[#1C2B21]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#14532D]">{interpretation}</p>
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

function motionLabel(value) {
  if (value === null || value === undefined) return "Unknown";
  return Number(value) === 1 ? "Activity detected" : "Check activity";
}
