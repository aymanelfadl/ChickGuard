const cards = [
  ["Total Devices", "total_devices"],
  ["Active Devices", "active_devices"],
  ["Sensor Readings", "total_sensor_readings"],
  ["Image Readings", "total_image_readings"],
  ["Healthy Detections", "healthy_detections"],
  ["Sick Detections", "sick_detections"],
];

export default function OverviewCards({ overview }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map(([label, key]) => (
        <article key={key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{overview?.[key] ?? 0}</p>
        </article>
      ))}
    </section>
  );
}
