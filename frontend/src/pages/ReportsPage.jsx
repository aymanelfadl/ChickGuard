import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Card from "../components/common/Card.jsx";
import DecisionRules from "../components/common/DecisionRules.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LiveUpdateStatus from "../components/common/LiveUpdateStatus.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import StatusBadge from "../components/dashboard/StatusBadge.jsx";
import Breadcrumbs from "../components/navigation/Breadcrumbs.jsx";
import HierarchyContext from "../components/navigation/HierarchyContext.jsx";
import ReportAlerts from "../components/reports/ReportAlerts.jsx";
import ReportDeviceStatus from "../components/reports/ReportDeviceStatus.jsx";
import ReportHeader from "../components/reports/ReportHeader.jsx";
import ReportLatestSensor from "../components/reports/ReportLatestSensor.jsx";
import ReportSummaryCards from "../components/reports/ReportSummaryCards.jsx";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh.js";
import { fetchCoopReport, fetchFarmReport, fetchReportOptions } from "../services/reportService.js";
import {
  formatDateTime,
  formatHumidity,
  formatNumber,
  formatPercent,
  formatTemperature,
} from "../utils/formatters.js";

export default function ReportsPage({ realtime }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const querySeed = searchParams.toString();
  const [farms, setFarms] = useState([]);
  const [coops, setCoops] = useState([]);
  const [report, setReport] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState("");
  const [selectedCoop, setSelectedCoop] = useState("");
  const [reportDate, setReportDate] = useState(searchParams.get("date") || localDateInputValue());
  const [reportType, setReportType] = useState(searchParams.get("type") === "coop" ? "coop" : "farm");
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [loadedReportKey, setLoadedReportKey] = useState("");

  const selectedFarmOption = useMemo(
    () => farms.find((item) => String(item.id) === String(selectedFarm)),
    [farms, selectedFarm],
  );
  const selectedCoopOption = useMemo(
    () => coops.find((item) => String(item.id) === String(selectedCoop)),
    [coops, selectedCoop],
  );

  const reportKey = useMemo(() => {
    if (!selectedFarm || (reportType === "coop" && !selectedCoop)) {
      return "";
    }
    return `${reportType}:${selectedFarm}:${selectedCoop || ""}:${reportDate}`;
  }, [reportDate, reportType, selectedCoop, selectedFarm]);

  const loadReport = useCallback(async ({ showLoading = true, updateUrl = false } = {}) => {
    if (!selectedFarm || (reportType === "coop" && !selectedCoop)) {
      return false;
    }

    if (showLoading) {
      setIsReportLoading(true);
    }
    setError(null);

    try {
      const nextReport =
        reportType === "coop"
          ? await fetchCoopReport(selectedCoop, { date: reportDate })
          : await fetchFarmReport(selectedFarm, { date: reportDate });

      const nextKey = `${reportType}:${selectedFarm}:${reportType === "coop" ? selectedCoop : ""}:${reportDate}`;
      setReport(nextReport);
      setLoadedReportKey(nextKey);
      setLastUpdatedAt(new Date().toISOString());

      if (updateUrl) {
        const params =
          reportType === "coop"
            ? { type: "coop", farm_id: String(selectedFarm), coop_id: String(selectedCoop), date: reportDate }
            : { type: "farm", farm_id: String(selectedFarm), date: reportDate };
        setSearchParams(params);
      }
      return true;
    } catch (loadError) {
      setError(loadError.message || "Unable to load report.");
      return false;
    } finally {
      if (showLoading) {
        setIsReportLoading(false);
      }
    }
  }, [reportDate, reportType, selectedCoop, selectedFarm, setSearchParams]);

  useEffect(() => {
    async function loadOptions() {
      setIsLoadingOptions(true);
      setError(null);
      try {
        const reportOptions = await fetchReportOptions();
        const params = new URLSearchParams(querySeed);
        const requestedType = params.get("type") === "coop" ? "coop" : "farm";
        const requestedFarm = params.get("farm_id");
        const requestedCoop = params.get("coop_id");
        const requestedDate = params.get("date") || localDateInputValue();
        const nextFarm =
          (requestedFarm ? reportOptions.find((farm) => String(farm.id) === String(requestedFarm)) : null) ||
          reportOptions[0];
        const nextCoops = nextFarm?.coops || [];
        const nextCoop = requestedCoop
          ? nextCoops.find((coop) => String(coop.id) === String(requestedCoop))
          : nextCoops[0];

        setFarms(reportOptions);
        setReportType(requestedType);
        setSelectedFarm(nextFarm ? String(nextFarm.id) : "");
        setCoops(nextCoops);
        setSelectedCoop(requestedType === "coop" && nextCoop ? String(nextCoop.id) : "");
        setReportDate(requestedDate);
      } catch (loadError) {
        setError(loadError.message || "Unable to load report options.");
      } finally {
        setIsLoadingOptions(false);
      }
    }

    loadOptions();
  }, [querySeed]);

  useEffect(() => {
    if (isLoadingOptions || !reportKey || loadedReportKey === reportKey) {
      return;
    }
    loadReport({ showLoading: true, updateUrl: false });
  }, [isLoadingOptions, loadReport, loadedReportKey, reportKey]);

  const { isRefreshing, lastRefreshEventType, liveUpdateReceived, refreshManually } = useRealtimeRefresh(
    realtime,
    loadReport,
  );

  function handleFarmChange(farmId) {
    const farm = farms.find((item) => String(item.id) === String(farmId));
    setSelectedFarm(farmId);
    setCoops(farm?.coops || []);
    setSelectedCoop(reportType === "coop" && farm?.coops?.[0] ? String(farm.coops[0].id) : "");
    setReport(null);
    setLoadedReportKey("");
  }

  function handleReportTypeChange(type) {
    setReportType(type);
    setReport(null);
    setLoadedReportKey("");
    if (type === "coop" && !selectedCoop && coops[0]) {
      setSelectedCoop(String(coops[0].id));
    }
  }

  if (isLoadingOptions) {
    return <LoadingState />;
  }

  if (error && !report) {
    return <ErrorState error={error} />;
  }

  const reportMeta = buildReportMeta(report, reportType, selectedFarmOption, selectedCoopOption);
  const summaryCards = report ? buildSummaryCards(report, reportType) : [];
  const latestSensor = report?.latest_sensor_readings?.[0] || null;
  const latestAnalysis = report ? getLatestAnalysis(report, reportType) : null;
  const traceability = report?.daily_traceability || null;
  const reportTypeLabel = reportType === "coop" ? "Coop Report" : "Farm Report";
  const fieldClassName =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#1C2B21] shadow-sm outline-none transition-colors focus:border-[#14532D] focus:ring-2 focus:ring-[#BBF7D0] disabled:bg-gray-100 disabled:text-[#94A3B8]";

  return (
    <div className="w-full space-y-8 pb-12">
      <div className="space-y-4">
        <Breadcrumbs
          items={buildBreadcrumbItems(reportType, selectedFarm, selectedCoop, selectedFarmOption, selectedCoopOption)}
          levelLabel={reportTypeLabel}
        />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-[#1C2B21]">Reports</h1>
            <p className="mt-1 text-sm leading-6 text-[#64748B]">
              Daily business view for droppings image alerts, combined rule actions, and sensor/image traceability.
            </p>
          </div>
          {report ? (
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#1C2B21] shadow-sm hover:bg-gray-50"
            >
              Print Report
            </button>
          ) : null}
        </div>
        <HierarchyContext
          farm={selectedFarm ? { label: selectedFarmOption?.name || selectedFarm, to: `/farms/${selectedFarm}` } : null}
          coop={
            reportType === "coop" && selectedCoop
              ? { label: selectedCoopOption?.name || selectedCoop, to: `/coops/${selectedCoop}` }
              : null
          }
          status={reportMeta.status}
        />
      </div>

      <LiveUpdateStatus
        realtimeStatus={realtime?.status}
        lastUpdatedAt={lastUpdatedAt}
        liveUpdateReceived={liveUpdateReceived}
        liveUpdateLabel="New report data available"
        lastEventType={lastRefreshEventType}
        isRefreshing={isRefreshing || isReportLoading}
        onRefresh={refreshManually}
      />

      <Card title="Report Scope" description="Choose the business level and day to review. Reports auto-refresh after selection changes.">
        {!farms.length ? (
          <EmptyState title="No farms available" message="Create farms and register devices before running reports." />
        ) : (
          <form
            className="grid gap-4 lg:grid-cols-[190px_minmax(180px,1fr)_minmax(180px,1fr)_170px_auto] lg:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              loadReport({ showLoading: true, updateUrl: true });
            }}
          >
            <Field label="Level">
              <select
                className={fieldClassName}
                value={reportType}
                onChange={(event) => handleReportTypeChange(event.target.value)}
              >
                <option value="farm">Farm Report</option>
                <option value="coop">Coop Report</option>
              </select>
            </Field>
            <Field label="Farm">
              <select className={fieldClassName} value={selectedFarm} onChange={(event) => handleFarmChange(event.target.value)}>
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Coop">
              <select
                className={fieldClassName}
                value={selectedCoop}
                onChange={(event) => {
                  setSelectedCoop(event.target.value);
                  setReport(null);
                  setLoadedReportKey("");
                }}
                disabled={reportType !== "coop"}
              >
                <option value="">Select coop</option>
                {coops.map((coop) => (
                  <option key={coop.id} value={coop.id}>
                    {coop.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Day">
              <input
                className={fieldClassName}
                type="date"
                value={reportDate}
                onChange={(event) => {
                  setReportDate(event.target.value);
                  setReport(null);
                  setLoadedReportKey("");
                }}
              />
            </Field>
            <button
              className="rounded-lg bg-[#14532D] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#166534] disabled:cursor-not-allowed disabled:bg-gray-300"
              type="submit"
              disabled={!reportKey || isReportLoading}
            >
              {isReportLoading ? "Loading..." : "Update"}
            </button>
          </form>
        )}
      </Card>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>
      ) : null}

      {!report ? (
        <EmptyState title="No report loaded" message="Select a farm or coop to generate the business report." />
      ) : (
        <div className="space-y-6">
          <ReportHeader
            reportType={reportTypeLabel}
            title={reportMeta.title}
            subtitle={reportMeta.subtitle}
            status={reportMeta.status}
            generatedAt={lastUpdatedAt}
            levelLabel={reportTypeLabel}
          />

          <ReportSummaryCards items={summaryCards} />

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <BusinessDecisionCard report={report} reportMeta={reportMeta} latestAnalysis={latestAnalysis} />
            <ReportLatestSensor sensor={latestSensor} />
          </section>

          <DecisionRules
            decisions={report.decisions || traceability?.decisions || []}
            title="Rule Actions"
            description="Combined sensor and image decisions from the rule engine."
            limit={5}
            compact
          />

          <TraceabilitySection traceability={traceability} />

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <LatestAnalysisCard analysis={latestAnalysis} />
            <ReportAlerts alerts={(report.recent_alerts || []).slice(0, 5)} />
          </section>

          <ReportDeviceStatus devices={report.devices || []} />
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="text-sm">
      <span className="font-semibold text-[#475569]">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function BusinessDecisionCard({ report, reportMeta, latestAnalysis }) {
  const activeAlerts = reportMeta.activeAlerts || 0;
  const topDecision = (report.decisions || []).find((decision) => decision.severity !== "normal") || report.decisions?.[0];
  const healthText = activeAlerts
    ? `${activeAlerts} droppings image alert${activeAlerts === 1 ? "" : "s"}`
    : "No droppings image alerts";

  return (
    <Card
      title="Admin Decision Brief"
      description="The useful business summary for the selected level and day."
      action={<StatusBadge status={reportMeta.status} />}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <BriefMetric label="Image Alerts" value={healthText} danger={activeAlerts > 0} />
        <BriefMetric label="Latest Analysis" value={latestAnalysis?.disease_type || latestAnalysis?.prediction_status || "No analysis"} />
        <BriefMetric label="Devices" value={`${reportMeta.onlineDevices} online / ${reportMeta.offlineDevices} offline`} danger={reportMeta.offlineDevices > 0} />
      </div>
      <div className="mt-5 rounded-lg border border-gray-200 bg-[#F8FAFC] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">Next Action</p>
        <p className="mt-2 text-sm font-semibold text-[#1C2B21]">
          {topDecision?.action || topDecision?.description || "Continue routine monitoring."}
        </p>
      </div>
    </Card>
  );
}

function TraceabilitySection({ traceability }) {
  if (!traceability) {
    return (
      <Card title="Daily Traceability">
        <EmptyState title="No daily traceability" message="Daily sensor, image, and rule history appears after data is received for the selected day." />
      </Card>
    );
  }

  const sensorSummary = traceability.sensor_summary || {};
  const motion = sensorSummary.motion || {};
  const periods = traceability.periods || [];

  return (
    <Card
      title="Daily Traceability"
      description={`Daily history of sensor readings, image analyses, and rule findings. Local date ${traceability.date || "N/A"} · ${traceability.timezone || "timezone not set"} · daylight ${traceability.daylight_window?.start_hour ?? "?"}:00-${traceability.daylight_window?.end_hour ?? "?"}:00`}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TraceMetric label="Sensor Readings" value={traceability.sensor_readings_count} />
        <TraceMetric label="Droppings Analyses" value={traceability.droppings_analyses_count} />
        <TraceMetric label="Sick Detections" value={traceability.sick_detections} danger={traceability.sick_detections > 0} />
        <TraceMetric label="Motion Detected" value={formatMotionPercent(motion)} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <DailySensorSummary sensorSummary={sensorSummary} />
        <PeriodSummary periods={periods} />
      </div>

      {traceability.decisions?.length ? (
        <TraceDecisionList decisions={traceability.decisions.slice(0, 4)} />
      ) : null}
    </Card>
  );
}

function DailySensorSummary({ sensorSummary }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-[#F8FAFC] p-4">
      <p className="font-semibold text-[#1C2B21]">Sensor Summary</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <RangeMetric label="Temperature" summary={sensorSummary.temperature_c} formatter={formatTemperature} />
        <RangeMetric label="Humidity" summary={sensorSummary.humidity_percent} formatter={formatHumidity} />
      </div>
    </div>
  );
}

function PeriodSummary({ periods }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-[#F8FAFC] p-4">
      <p className="font-semibold text-[#1C2B21]">Day/Night Split</p>
      <div className="mt-4 space-y-3">
        {periods.map((period) => (
          <div key={period.period} className="rounded-lg bg-white p-3 ring-1 ring-gray-200">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold capitalize text-[#1C2B21]">{period.period}</p>
              <p className="text-sm font-semibold text-[#64748B]">{period.sensor_readings || 0} readings</p>
            </div>
            <p className="mt-2 text-sm text-[#64748B]">
              Avg temp {formatTemperature(period.temperature_c?.avg)} · Avg humidity {formatHumidity(period.humidity_percent?.avg)} · {formatMotionPercent(period.motion)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TraceDecisionList({ decisions }) {
  return (
    <div className="mt-5 rounded-lg border border-gray-200 bg-[#F8FAFC] p-4">
      <p className="font-semibold text-[#1C2B21]">Repeated Rule Findings</p>
      <div className="mt-4 space-y-3">
        {decisions.map((decision) => (
          <div key={`${decision.id}-${decision.period}-${decision.device_id}`} className="rounded-lg bg-white p-3 ring-1 ring-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-[#1C2B21]">{decision.title || "Decision"}</p>
              <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-bold uppercase text-[#475569]">
                {decision.severity || "info"} · {decision.occurrences || 1} times
              </span>
            </div>
            <p className="mt-2 text-sm text-[#64748B]">{decision.action || decision.description || "Review this finding."}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LatestAnalysisCard({ analysis }) {
  return (
    <Card title="Latest Droppings Analysis" description="Most recent fecal image classification linked to this report.">
      {!analysis ? (
        <EmptyState title="No droppings analysis" message="Image classification results will appear after upload." />
      ) : (
        <div className="space-y-3 text-sm">
          <InfoRow label="Status" value={analysis.prediction_status || "N/A"} />
          <InfoRow label="Disease" value={analysis.disease_type || "No disease detected"} />
          <InfoRow label="Confidence" value={formatPercent(analysis.confidence)} />
          <InfoRow label="Captured" value={formatDateTime(analysis.timestamp)} />
          <InfoRow label="Device" value={analysis.device_id} to={analysis.device_id ? `/devices/${analysis.device_id}` : null} />
        </div>
      )}
    </Card>
  );
}

function BriefMetric({ label, value, danger = false }) {
  return (
    <div className={`rounded-lg border p-4 ${danger ? "border-red-200 bg-red-50" : "border-gray-200 bg-[#F8FAFC]"}`}>
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
      <p className={`mt-2 text-lg font-bold ${danger ? "text-red-700" : "text-[#1C2B21]"}`}>{value}</p>
    </div>
  );
}

function TraceMetric({ label, value, danger = false }) {
  return (
    <div className={`rounded-lg border p-4 ${danger ? "border-red-200 bg-red-50" : "border-gray-200 bg-[#F8FAFC]"}`}>
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${danger ? "text-red-700" : "text-[#1C2B21]"}`}>{value ?? 0}</p>
    </div>
  );
}

function RangeMetric({ label, summary = {}, formatter }) {
  return (
    <div className="rounded-lg bg-white p-3 ring-1 ring-gray-200">
      <p className="text-sm font-semibold text-[#1C2B21]">{label}</p>
      <p className="mt-2 text-sm text-[#64748B]">Avg {formatter(summary?.avg)}</p>
      <p className="mt-1 text-xs text-[#64748B]">
        Min {formatter(summary?.min)} · Max {formatter(summary?.max)}
      </p>
    </div>
  );
}

function InfoRow({ label, value, to }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-3 last:border-0">
      <dt className="text-[#64748B]">{label}</dt>
      <dd className="max-w-[65%] truncate text-right font-semibold text-[#1C2B21]" title={value || undefined}>
        {to && value ? (
          <Link className="text-[#14532D] hover:underline" to={to}>
            {value}
          </Link>
        ) : (
          value || "N/A"
        )}
      </dd>
    </div>
  );
}

function buildBreadcrumbItems(reportType, selectedFarm, selectedCoop, selectedFarmOption, selectedCoopOption) {
  const items = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Reports", to: "/reports" },
  ];
  if (selectedFarm) {
    items.push({ label: selectedFarmOption?.name || selectedFarm, to: `/farms/${selectedFarm}` });
  }
  if (reportType === "coop" && selectedCoop) {
    items.push({ label: selectedCoopOption?.name || selectedCoop, to: `/coops/${selectedCoop}` });
  }
  items.push({ label: reportType === "coop" ? "Coop Report" : "Farm Report" });
  return items;
}

function buildReportMeta(report, reportType, selectedFarmOption, selectedCoopOption) {
  if (!report) {
    return {
      title: reportType === "coop" ? selectedCoopOption?.name || "Coop Report" : selectedFarmOption?.name || "Farm Report",
      subtitle: "Report not loaded yet.",
      status: "unknown",
      activeAlerts: 0,
      onlineDevices: 0,
      offlineDevices: 0,
    };
  }

  const devices = report.devices || [];
  const onlineDevices = report.online_devices ?? devices.filter((device) => device.status === "online").length;
  const offlineDevices = report.offline_devices ?? devices.filter((device) => device.status === "offline").length;

  if (reportType === "coop") {
    return {
      title: report.coop?.name || selectedCoopOption?.name || "Coop Report",
      subtitle: `Parent farm ${selectedFarmOption?.name || report.coop?.farm_id || "N/A"}`,
      status: report.coop?.latest_health_status,
      activeAlerts: report.coop?.active_alerts ?? report.recent_alerts?.length ?? 0,
      onlineDevices,
      offlineDevices,
    };
  }

  return {
    title: report.farm?.name || selectedFarmOption?.name || "Farm Report",
    subtitle: report.farm?.location ? `Location: ${report.farm.location}` : "Farm monitoring report",
    status: report.farm?.latest_health_status,
    activeAlerts: report.farm?.active_alerts ?? report.recent_alerts?.length ?? 0,
    onlineDevices,
    offlineDevices,
  };
}

function buildSummaryCards(report, reportType) {
  const trace = report.daily_traceability || {};
  const devices = report.devices || [];
  const sickDetections =
    trace.sick_detections ??
    report.sick_detections ??
    countDetections(report.disease_history, "sick");
  const healthyDetections =
    trace.healthy_detections ??
    report.healthy_detections ??
    countDetections(report.disease_history, "healthy");
  const onlineDevices = report.online_devices ?? devices.filter((device) => device.status === "online").length;
  const offlineDevices = report.offline_devices ?? devices.filter((device) => device.status === "offline").length;

  return [
    {
      label: reportType === "coop" ? "Devices" : "Coops",
      value: reportType === "coop" ? report.coop?.number_of_devices ?? devices.length : report.number_of_coops ?? 0,
      description: reportType === "coop" ? "Registered in this coop" : "Managed under this farm",
    },
    { label: "Online Devices", value: onlineDevices, description: "Available for ingestion" },
    { label: "Offline Devices", value: offlineDevices, description: "Need admin review", danger: offlineDevices > 0 },
    { label: "Sensor Readings", value: trace.sensor_readings_count ?? report.total_readings ?? 0, description: "For selected day" },
    { label: "Droppings Analyses", value: trace.droppings_analyses_count ?? report.total_droppings_analyses ?? 0, description: "For selected day" },
    { label: "Sick Detections", value: sickDetections, description: `${healthyDetections} healthy detections`, danger: sickDetections > 0 },
  ];
}

function getLatestAnalysis(report, reportType) {
  if (reportType === "coop" && report.latest_droppings_analysis) {
    return report.latest_droppings_analysis;
  }

  const candidates = [];
  (report.devices || []).forEach((device) => {
    if (device.latest_prediction) {
      candidates.push({ ...device.latest_prediction, device_id: device.device_id });
    }
  });
  (report.recent_alerts || []).forEach((alert) => {
    candidates.push({
      id: alert.id,
      prediction_status: "sick",
      disease_type: alert.disease_type,
      confidence: alert.confidence,
      image_path: alert.image_path,
      timestamp: alert.timestamp,
      device_id: alert.device_id,
    });
  });

  return candidates
    .filter((item) => item?.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] || null;
}

function countDetections(items = [], status) {
  return items.filter((item) => item?.prediction_status === status).length;
}

function formatMotionPercent(motion = {}) {
  if (motion.detected_percent === null || motion.detected_percent === undefined) {
    return "No motion data";
  }
  return `${formatNumber(motion.detected_percent, 1)}% detected`;
}

function localDateInputValue() {
  const value = new Date();
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 10);
}
