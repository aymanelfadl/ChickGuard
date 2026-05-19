import { Link } from "react-router-dom";

import Card from "../components/common/Card.jsx";

export default function SettingsPage({ user }) {
  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <Card title="Settings" description="Platform management permissions.">
        <p className="text-sm leading-6 text-[#64748B]">
          You do not have permission to manage platform settings.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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
  );
}

function AdminShortcut({ title, description, to }) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-[#E2E8F0] bg-[#F8FBF8] p-4 transition hover:border-[#86EFAC] hover:bg-white"
    >
      <p className="font-bold text-[#102A1C]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
    </Link>
  );
}
