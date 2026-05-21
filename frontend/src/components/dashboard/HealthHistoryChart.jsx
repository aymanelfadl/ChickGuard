import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Card from "../common/Card.jsx";
import EmptyState from "../common/EmptyState.jsx";
import { formatDateTime, formatHumidity, formatTemperature, formatWeight } from "../../utils/formatters.js";

function formatChartTime(value) {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const values = Object.fromEntries(payload.map((item) => [item.dataKey, item.value]));

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-apple-sm">
      <p className="mb-3 text-sm font-semibold text-[#1C2B21]">{formatDateTime(label)}</p>
      <div className="space-y-2 text-sm">
        <p className="flex items-center justify-between gap-8 text-[#6B7280]">
          <span>Temperature</span>
          <span className="font-semibold text-[#1C2B21]">{formatTemperature(values.temperatureC)}</span>
        </p>
        <p className="flex items-center justify-between gap-8 text-[#6B7280]">
          <span>Humidity</span>
          <span className="font-semibold text-[#1C2B21]">{formatHumidity(values.humidityPercent)}</span>
        </p>
        <p className="flex items-center justify-between gap-8 text-[#6B7280]">
          <span>Weight</span>
          <span className="font-semibold text-[#1C2B21]">{formatWeight(values.weightKg)}</span>
        </p>
      </div>
    </div>
  );
}

export default function HealthHistoryChart({ history }) {
  if (!history.length) {
    return (
      <Card title="Health History">
        <EmptyState
          title="No health history data"
          message="Sensor trends will appear here after readings are received."
        />
      </Card>
    );
  }

  const chartData = [...history].reverse();

  return (
    <Card
      title="Health History"
      description="Temperature, humidity, and weight trends from the latest device readings."
      className="overflow-hidden"
    >
      <div className="h-[360px] w-full sm:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 16, right: 12, left: -18, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatChartTime}
              minTickGap={28}
              tick={{ fill: "#6B7280", fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: "#F3F4F6" }}
            />
            <YAxis
              yAxisId="environment"
              tick={{ fill: "#6B7280", fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="weight"
              orientation="right"
              tick={{ fill: "#6B7280", fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#15803D", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Legend wrapperStyle={{ paddingTop: 18 }} iconType="circle" />
            <Line
              yAxisId="environment"
              type="monotone"
              dataKey="temperatureC"
              name="Temperature C"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#FFFFFF" }}
            />
            <Line
              yAxisId="environment"
              type="monotone"
              dataKey="humidityPercent"
              name="Humidity %"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#FFFFFF" }}
            />
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="weightKg"
              name="Weight kg"
              stroke="#15803D"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#FFFFFF" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
