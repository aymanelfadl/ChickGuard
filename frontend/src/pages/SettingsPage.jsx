import Card from "../components/common/Card.jsx";

export default function SettingsPage() {
  return (
    <Card
      title="Settings"
      description="Platform settings placeholder for roles, notification rules, and deployment configuration."
    >
      <p className="text-sm text-[#64748B]">
        Settings are planned for a later sprint. Current authentication, device registry, and farm hierarchy are managed through backend APIs.
      </p>
    </Card>
  );
}
