import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../components/common/Card.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import Modal from "../components/common/Modal.jsx";
import FarmCard from "../components/farm/FarmCard.jsx";
import FarmForm from "../components/forms/FarmForm.jsx";
import Breadcrumbs from "../components/navigation/Breadcrumbs.jsx";
import { createFarm, fetchFarms } from "../services/farmService.js";

export default function FarmsPage({ user }) {
  const navigate = useNavigate();
  const [farms, setFarms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isAdmin = user?.role === "admin";

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

  async function handleCreateFarm(payload) {
    setIsSubmitting(true);
    setSubmitError("");
    setSuccessMessage("");
    try {
      const createdFarm = await createFarm(payload);
      await loadFarms();
      setIsCreateOpen(false);
      if (createdFarm?.id) {
        navigate(`/farms/${createdFarm.id}`, {
          state: { successMessage: `${createdFarm.name || "Farm"} created.` },
        });
      } else {
        setSuccessMessage(`${payload.name} created.`);
      }
    } catch (createError) {
      setSubmitError(createError.message || "Unable to create farm.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Farms", to: "/farms" },
          ]}
          levelLabel="Farm List"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold uppercase text-[#14532D]">
              Farm Level
            </span>
            <h1 className="mt-2 text-2xl font-bold text-[#102A1C]">Farms</h1>
            <p className="text-sm text-[#64748B]">Farm-level health status, coops, devices, and active alerts.</p>
          </div>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => {
                setSubmitError("");
                setIsCreateOpen(true);
              }}
              className="rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white"
            >
              Add Farm
            </button>
          ) : null}
        </div>
      </div>

      {successMessage ? (
        <p className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-sm font-semibold text-[#14532D]">
          {successMessage}
        </p>
      ) : null}

      <section className="space-y-4">
        {!farms.length ? (
          <Card title="No Farms">
            <div className="space-y-4">
              <EmptyState title="No farms created yet" message="Add your first farm to start monitoring poultry health." />
              {isAdmin ? (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitError("");
                      setIsCreateOpen(true);
                    }}
                    className="rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Add Farm
                  </button>
                </div>
              ) : null}
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {farms.map((farm) => (
              <FarmCard key={farm.id} farm={farm} />
            ))}
          </div>
        )}
      </section>

      <Modal
        title="Add Farm"
        description="Create a farm before adding coops and camera/device monitoring."
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      >
        <FarmForm
          onSubmit={handleCreateFarm}
          onCancel={() => setIsCreateOpen(false)}
          isSubmitting={isSubmitting}
          error={submitError}
        />
      </Modal>
    </div>
  );
}
