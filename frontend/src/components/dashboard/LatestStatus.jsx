import { Activity, Camera, Droplets, MapPin, ShieldCheck, Thermometer } from "lucide-react";

import Card from "../common/Card.jsx";
import EmptyState from "../common/EmptyState.jsx";
import {
  formatDateTime,
  formatHumidity,
  formatMotion,
  formatPercent,
  formatTemperature,
} from "../../utils/formatters.js";
import StatusBadge from "./StatusBadge.jsx";

function ValueRow({ label, value, title }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-0">
      <dt className="text-sm font-medium text-[#6B7280]">{label}</dt>
      <dd
        className="min-w-0 max-w-[62%] truncate text-right text-sm font-semibold text-[#1C2B21]"
        title={title || value || undefined}
      >
        {value || "N/A"}
      </dd>
    </div>
  );
}

function LocationSummary({ status }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-100 px-3 py-1 text-xs font-medium text-[#6B7280]">
        <MapPin className="h-3.5 w-3.5 text-[#15803D]" aria-hidden="true" />
        Device {status.deviceId || "N/A"}
      </span>
      <span className="rounded-full bg-gray-50 border border-gray-100 px-3 py-1 text-xs font-medium text-[#6B7280]">
        Farm {status.farmId || "N/A"}
      </span>
      <span className="rounded-full bg-gray-50 border border-gray-100 px-3 py-1 text-xs font-medium text-[#6B7280]">
        Coop {status.coopId || "N/A"}
      </span>
    </div>
  );
}

function SensorMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-[#F9FAF9] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-[#6B7280]">
        <Icon className="h-4 w-4 text-[#15803D]" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-[#1C2B21]">{value}</p>
    </div>
  );
}

export default function LatestStatus({ status }) {
  const sensor = status.latestSensor;
  const prediction = status.latestPrediction;

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Card
        title="Latest Sensor Status"
        description={<LocationSummary status={status} />}
        className="min-h-[300px]"
      >
        {sensor ? (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <SensorMetric
                icon={Thermometer}
                label="Temperature"
                value={formatTemperature(sensor.temperatureC)}
              />
              <SensorMetric
                icon={Droplets}
                label="Humidity"
                value={formatHumidity(sensor.humidityPercent)}
              />
              <SensorMetric icon={Activity} label="Motion" value={formatMotion(sensor.motion)} />
            </div>
            <dl className="rounded-xl border border-gray-100 px-4">
              <ValueRow label="Last Reading" value={formatDateTime(sensor.timestamp)} />
            </dl>
          </div>
        ) : (
          <EmptyState
            title="No sensor reading yet"
            message="Temperature, humidity, and motion data will appear after the first device reading."
          />
        )}
      </Card>

      <Card
        title="Latest Droppings Analysis"
        description="AI analysis based on poultry droppings images."
        action={<StatusBadge status={prediction?.predictionStatus} />}
        className="min-h-[300px]"
      >
        {prediction ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-green-100 bg-[#F5FAF6] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#6B7280]">Droppings Analysis</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-[#1C2B21]">
                    {prediction.diseaseType || "No disease detected"}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#15803D] ring-1 ring-green-100 shadow-sm">
                  {prediction.diseaseType ? (
                    <Camera className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
              </div>
            </div>
            <dl className="rounded-xl border border-gray-100 px-4">
              <ValueRow label="Confidence" value={formatPercent(prediction.confidence)} />
              <ValueRow
                label="Droppings Image"
                value={prediction.imagePath}
                title={prediction.imagePath}
              />
              <ValueRow label="Captured At" value={formatDateTime(prediction.timestamp)} />
            </dl>
          </div>
        ) : (
          <EmptyState
            title="No droppings analysis yet"
            message="Fecal image classification will appear after a droppings image is uploaded."
          />
        )}
      </Card>
    </section>
  );
}
