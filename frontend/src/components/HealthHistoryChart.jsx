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

function formatTime(value) {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HealthHistoryChart({ history }) {
  if (!history?.length) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Health History</h2>
        <p className="mt-3 text-sm text-slate-500">No health history data available yet.</p>
      </section>
    );
  }

  const chartData = [...history].reverse();

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-950">Health History</h2>
        <p className="text-sm text-slate-500">Temperature, humidity, and weight over time.</p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="timestamp" tickFormatter={formatTime} minTickGap={24} />
            <YAxis yAxisId="environment" />
            <YAxis yAxisId="weight" orientation="right" />
            <Tooltip labelFormatter={(value) => value || "N/A"} />
            <Legend />
            <Line
              yAxisId="environment"
              type="monotone"
              dataKey="temperature_c"
              name="Temperature C"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="environment"
              type="monotone"
              dataKey="humidity_percent"
              name="Humidity %"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="weight_kg"
              name="Weight kg"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
