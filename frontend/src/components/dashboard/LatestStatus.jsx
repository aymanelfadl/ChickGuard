import { Camera, Droplets, MapPin, Scale, ShieldCheck, Thermometer } from "lucide-react";

import Card from "../common/Card.jsx";
import EmptyState from "../common/EmptyState.jsx";
import {
  formatDateTime,
  formatHumidity,
  formatPercent,
  formatTemperature,
  formatWeight,
} from "../../utils/formatters.js";
import StatusBadge from "./StatusBadge.jsx";

function ValueRow({ label, value, title }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#EEF2F7] py-3 last:border-0">
      <dt className="text-sm font-medium text-[#64748B]">{label}</dt>
      <dd
        className="min-w-0 max-w-[62%] truncate text-right text-sm font-semibold text-[#102A1C]"
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-medium text-[#475569]">
        <MapPin className="h-3.5 w-3.5 text-[#16A34A]" aria-hidden="true" />
        Device {status.deviceId || "N/A"}
      </span>
      <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-medium text-[#475569]">
        Farm {status.farmId || "N/A"}
      </span>
      <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-medium text-[#475569]">
        Coop {status.coopId || "N/A"}
      </span>
    </div>
  );
}

function SensorMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FBF8] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-[#64748B]">
        <Icon className="h-4 w-4 text-[#16A34A]" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-bold text-[#102A1C]">{value}</p>
    </div>
  );
}

export default function LatestStatus({ status }) {
  const sensor = status.latestSensor;
  const prediction = status.latestPrediction;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card
        title="Latest Sensor Status"
        description={<LocationSummary status={status} />}
        className="min-h-[300px]"
      >
        {sensor ? (
          <div className="space-y-5">
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
              <SensorMetric icon={Scale} label="Weight" value={formatWeight(sensor.weightKg)} />
            </div>
            <dl className="rounded-lg border border-[#E2E8F0] px-4">
              <ValueRow label="Last Reading" value={formatDateTime(sensor.timestamp)} />
            </dl>
          </div>
        ) : (
          <EmptyState
            title="No sensor reading yet"
            message="Temperature, humidity, and weight data will appear after the first device reading."
          />
        )}
      </Card>

      <Card
        title="Latest Image Prediction"
        description="Most recent mock AI classification result."
        action={<StatusBadge status={prediction?.predictionStatus} />}
        className="min-h-[300px]"
      >
        {prediction ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-[#BBF7D0] bg-gradient-to-br from-[#F0FDF4] to-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#64748B]">AI Classification</p>
                  <p className="mt-2 text-2xl font-bold text-[#102A1C]">
                    {prediction.diseaseType || "No disease detected"}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#14532D] ring-1 ring-[#BBF7D0]">
                  {prediction.diseaseType ? (
                    <Camera className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
              </div>
            </div>
            <dl className="rounded-lg border border-[#E2E8F0] px-4">
              <ValueRow label="Confidence" value={formatPercent(prediction.confidence)} />
              <ValueRow
                label="Image Path"
                value={prediction.imagePath}
                title={prediction.imagePath}
              />
              <ValueRow label="Captured At" value={formatDateTime(prediction.timestamp)} />
            </dl>
          </div>
        ) : (
          <EmptyState
            title="No image prediction yet"
            message="Camera classifications will appear after an image reading is uploaded."
          />
        )}
      </Card>
    </section>
  );
}
