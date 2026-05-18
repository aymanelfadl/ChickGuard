import { useEffect, useState } from "react";

import Card from "../components/common/Card.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import JsonReportViewer from "../components/reports/JsonReportViewer.jsx";
import { fetchCoopReport, fetchFarmReport, fetchReportOptions } from "../services/reportService.js";

export default function ReportsPage() {
  const [farms, setFarms] = useState([]);
  const [coops, setCoops] = useState([]);
  const [report, setReport] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState("");
  const [selectedCoop, setSelectedCoop] = useState("");
  const [reportTitle, setReportTitle] = useState("Report");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadFarms() {
      setIsLoading(true);
      setError(null);
      try {
        const reportOptions = await fetchReportOptions();
        setFarms(reportOptions);
        if (reportOptions[0]) {
          setSelectedFarm(String(reportOptions[0].id));
          setCoops(reportOptions[0].coops || []);
        }
      } catch (loadError) {
        setError(loadError.message || "Unable to load reports.");
      } finally {
        setIsLoading(false);
      }
    }

    loadFarms();
  }, []);

  async function handleFarmChange(farmId) {
    setSelectedFarm(farmId);
    setSelectedCoop("");
    const farm = farms.find((item) => String(item.id) === String(farmId));
    setCoops(farm?.coops || []);
  }

  async function loadFarmReport() {
    if (!selectedFarm) {
      return;
    }
    const data = await fetchFarmReport(selectedFarm);
    setReport(data);
    setReportTitle(`Farm Report: ${data.farm?.name || selectedFarm}`);
  }

  async function loadCoopReport() {
    if (!selectedCoop) {
      return;
    }
    const data = await fetchCoopReport(selectedCoop);
    setReport(data);
    setReportTitle(`Coop Report: ${data.coop?.name || selectedCoop}`);
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="space-y-6">
      <Card title="Reports" description="JSON farm and coop reports. PDF export is planned later.">
        {!farms.length ? (
          <EmptyState title="No farms available" message="Register devices or create farms before running reports." />
        ) : (
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <select
              className="rounded-lg border border-[#E2E8F0] px-3 py-2"
              value={selectedFarm}
              onChange={(event) => handleFarmChange(event.target.value)}
            >
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-[#E2E8F0] px-3 py-2"
              value={selectedCoop}
              onChange={(event) => setSelectedCoop(event.target.value)}
            >
              <option value="">Select coop</option>
              {coops.map((coop) => (
                <option key={coop.id} value={coop.id}>
                  {coop.name}
                </option>
              ))}
            </select>
            <button className="rounded-lg bg-[#14532D] px-4 py-2 font-semibold text-white" onClick={loadFarmReport}>
              Farm Report
            </button>
            <button
              className="rounded-lg border border-[#14532D] px-4 py-2 font-semibold text-[#14532D]"
              onClick={loadCoopReport}
              disabled={!selectedCoop}
            >
              Coop Report
            </button>
          </div>
        )}
      </Card>

      {report ? <JsonReportViewer title={reportTitle} report={report} /> : null}
    </div>
  );
}
