import { useEffect, useState } from "react";

import Card from "../components/common/Card.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import FarmCard from "../components/farm/FarmCard.jsx";
import { createFarm, fetchFarms } from "../services/farmService.js";

export default function FarmsPage({ user }) {
  const [farms, setFarms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", location: "", description: "" });

  async function loadFarms() {
    setIsLoading(true);
    setError(null);
    try {
      setFarms(await fetchFarms());
    } catch (loadError) {
      setError(loadError.message || "Unable to load farms.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFarms();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    await createFarm(form);
    setForm({ name: "", location: "", description: "" });
    loadFarms();
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#102A1C]">Farms</h2>
          <p className="text-sm text-[#64748B]">Farm-level health status, coops, devices, and active alerts.</p>
        </div>
        {!farms.length ? (
          <Card title="No Farms">
            <EmptyState title="No farms yet" message="Registered devices or admin-created farms will appear here." />
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {farms.map((farm) => (
              <FarmCard key={farm.id} farm={farm} />
            ))}
          </div>
        )}
      </section>

      {user?.role === "admin" ? (
        <Card title="Create Farm" description="Admins can add farms before devices are installed.">
          <form className="grid gap-3 md:grid-cols-3" onSubmit={handleSubmit}>
            <input
              className="rounded-lg border border-[#E2E8F0] px-3 py-2"
              placeholder="Farm name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
            <input
              className="rounded-lg border border-[#E2E8F0] px-3 py-2"
              placeholder="Location"
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
            />
            <button className="rounded-lg bg-[#14532D] px-4 py-2 font-semibold text-white" type="submit">
              Add Farm
            </button>
            <textarea
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 md:col-span-3"
              placeholder="Description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </form>
        </Card>
      ) : null}
    </div>
  );
}
