import { Link } from "react-router-dom";

import Breadcrumbs from "../components/navigation/Breadcrumbs.jsx";
import Card from "../components/common/Card.jsx";

export default function SettingsPage({ user }) {
  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Settings", to: "/settings" }]} levelLabel="System Settings" />
        <Card title="Settings" description="Platform management permissions.">
          <p className="text-sm leading-6 text-[#6B7280]">
            You do not have permission to manage platform settings.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Settings", to: "/settings" }]} levelLabel="System Settings" />
        <Card title="Settings" description="Admin tools for farm hierarchy and device registry management.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <AdminShortcut
            title="Add Farm"
            description="Create a farm, then add coops and cameras/devices."
            to="/farms"
          />
          <AdminShortcut
            title="Register Device"
            description="Register an ESP32/ESP32-CAM device with an API key."
            to="/devices"
          />
          <AdminShortcut
            title="Manage Coops"
            description="Open a farm to add coops under it."
            to="/farms"
          />
          <AdminShortcut
            title="Device API Keys"
            description="Device keys are entered once during registration and stored as hashes."
            to="/devices"
          />
        </div>
      </Card>
      </div>
    </div>
  );
}

function AdminShortcut({ title, description, to }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-gray-100 bg-[#F9FAF9] p-5 shadow-apple-sm transition hover:shadow-apple-md hover:bg-white"
    >
      <p className="font-semibold text-[#1C2B21]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#6B7280]">{description}</p>
    </Link>
  );
}
