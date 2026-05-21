import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Card from "../components/common/Card.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LiveUpdateStatus from "../components/common/LiveUpdateStatus.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import Breadcrumbs from "../components/navigation/Breadcrumbs.jsx";
import HierarchyContext from "../components/navigation/HierarchyContext.jsx";
import ReportAlerts from "../components/reports/ReportAlerts.jsx";
import ReportDetectionSummary from "../components/reports/ReportDetectionSummary.jsx";
import ReportDeviceStatus from "../components/reports/ReportDeviceStatus.jsx";
import ReportHeader from "../components/reports/ReportHeader.jsx";
import ReportHealthSummary from "../components/reports/ReportHealthSummary.jsx";
import ReportImages from "../components/reports/ReportImages.jsx";
import ReportJsonViewer from "../components/reports/ReportJsonViewer.jsx";
import ReportLatestSensor from "../components/reports/ReportLatestSensor.jsx";
import ReportSummaryCards from "../components/reports/ReportSummaryCards.jsx";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh.js";
import { fetchCoopReport, fetchFarmReport, fetchReportOptions } from "../services/reportService.js";

export default function ReportsPage({ realtime }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [farms, setFarms] = useState([]);
  const [coops, setCoops] = useState([]);
  const [report, setReport] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState("");
  const [selectedCoop, setSelectedCoop] = useState("");
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
  const reportTypeLabel = reportType === "coop" ? "Coop Report" : "Farm Report";
  const reportLevelLabel = reportType === "coop" ? "Coop Report Level" : "Farm Report Level";
  const queryReportKey = useMemo(() => {
    const type = searchParams.get("type");
    const farmId = searchParams.get("farm_id");
    const coopId = searchParams.get("coop_id");
    if (!type || !farmId || (type === "coop" && !coopId)) {
      return "";
    }
    return `${type}:${farmId}:${coopId || ""}`;
  }, [searchParams]);

  useEffect(() => {
    async function loadOptions() {
      setIsLoadingOptions(true);
      setError(null);
      try {
        const reportOptions = await fetchReportOptions();
        setFarms(reportOptions);
      } catch (loadError) {
        setError(loadError.message || "Unable to load report options.");
      } finally {
        setIsLoadingOptions(false);
      }
    }

    loadOptions();
  }, []);

  useEffect(() => {
    if (!farms.length) {
      return;
    }

    const requestedType = searchParams.get("type") === "coop" ? "coop" : "farm";
    const requestedFarm = searchParams.get("farm_id");
    const requestedCoop = searchParams.get("coop_id");
    const nextFarm =
      (requestedFarm ? farms.find((farm) => String(farm.id) === String(requestedFarm)) : null) || farms[0];
    const nextCoops = nextFarm?.coops || [];
    const nextCoop = nextCoops.find((coop) => String(coop.id) === String(requestedCoop));

    setReportType(requestedType);
    setSelectedFarm(String(nextFarm.id));
    setCoops(nextCoops);
    if (requestedType === "coop") {
      setSelectedCoop(nextCoop ? String(nextCoop.id) : "");
    }
  }, [farms, searchParams]);

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
          ? await fetchCoopReport(selectedCoop)
          : await fetchFarmReport(selectedFarm);
      const nextKey = `${reportType}:${selectedFarm}:${reportType === "coop" ? selectedCoop : ""}`;

      setReport(nextReport);
      setLoadedReportKey(nextKey);
      setLastUpdatedAt(new Date().toISOString());
      if (updateUrl) {
        const params =
          reportType === "coop"
            ? { type: "coop", farm_id: String(selectedFarm), coop_id: String(selectedCoop) }
            : { type: "farm", farm_id: String(selectedFarm) };
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
  }, [reportType, selectedCoop, selectedFarm, setSearchParams]);

  useEffect(() => {
    if (isLoadingOptions || !queryReportKey || loadedReportKey === queryReportKey) {
      return;
    }

    loadReport({ showLoading: true, updateUrl: false });
  }, [isLoadingOptions, loadReport, loadedReportKey, queryReportKey]);

  const { isRefreshing, lastRefreshEventType, liveUpdateReceived, refreshManually } = useRealtimeRefresh(
    realtime,
    loadReport,
  );

  function handleFarmChange(farmId) {
    const farm = farms.find((item) => String(item.id) === String(farmId));
    setSelectedFarm(farmId);
    setCoops(farm?.coops || []);
    setSelectedCoop("");
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

  const reportMeta = buildReportMeta(report, reportType, selectedFarmOption, selectedCoopOption, lastUpdatedAt);
  const summaryCards = report ? buildSummaryCards(report, reportType) : [];
  const latestAnalysis = report ? getLatestAnalysis(report, reportType) : null;
  const reportImages = report ? buildReportImages(report, reportType) : [];
  const reportTargetLabel =
    reportType === "coop"
      ? selectedCoopOption?.name || selectedCoop || "Select coop"
      : selectedFarmOption?.name || selectedFarm || "Select farm";

  return (
    <div className="w-full space-y-8 pb-12">
      <div className="space-y-4">
        <Breadcrumbs
          items={buildBreadcrumbItems(reportType, selectedFarm, selectedCoop, selectedFarmOption, selectedCoopOption)}
          levelLabel={reportLevelLabel}
        />
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-[#1C2B21]">Reports</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Reports summarize health, devices, detections, and alerts for the selected level.
          </p>
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
        liveUpdateLabel="New live data available"
        lastEventType={lastRefreshEventType}
        isRefreshing={isRefreshing || isReportLoading}
        onRefresh={refreshManually}
      />

      <Card title="Report Selector" description="Choose the monitoring level and scope, then view the report.">
        {!farms.length ? (
          <EmptyState title="No farms available" message="Register devices or create farms before running reports." />
        ) : (
          <form
            className="grid gap-4 lg:grid-cols-[220px_minmax(180px,1fr)_minmax(180px,1fr)_auto] items-end"
            onSubmit={(event) => {
              event.preventDefault();
              loadReport({ showLoading: true, updateUrl: true });
            }}
          >
            <label className="text-sm">
              <span className="font-medium text-[#6B7280]">Report Type</span>
              <select
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-[#1C2B21] focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] focus:outline-none transition-colors"
                value={reportType}
                onChange={(event) => handleReportTypeChange(event.target.value)}
              >
                <option value="farm">Farm Report</option>
                <option value="coop">Coop Report</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="font-medium text-[#6B7280]">Farm</span>
              <select
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-[#1C2B21] focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] focus:outline-none transition-colors"
                value={selectedFarm}
                onChange={(event) => handleFarmChange(event.target.value)}
              >
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={`text-sm ${reportType === "coop" ? "" : "opacity-60"}`}>
              <span className="font-medium text-[#6B7280]">Coop</span>
              <select
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-[#1C2B21] focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] focus:outline-none transition-colors"
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
            </label>
            <button
              className="rounded-xl bg-[#15803D] px-5 py-2.5 text-sm font-semibold text-white shadow-apple-sm transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none"
              type="submit"
              disabled={!selectedFarm || (reportType === "coop" && !selectedCoop) || isReportLoading}
            >
              {isReportLoading ? "Loading..." : "View Report"}
            </button>
          </form>
        )}
      </Card>

      {!selectedFarm ? (
        <EmptyState title="Select a farm to view its report." message="Choose a farm in the report selector above." />
      ) : reportType === "coop" && !selectedCoop ? (
        <EmptyState title="Select a coop to view its report." message="Choose a coop after selecting Coop Report." />
      ) : !report ? (
        <EmptyState title={`View ${reportTargetLabel} report`} message="Use the View Report button to generate a readable report." />
      ) : (
        <div className="space-y-6">
          <ReportHeader
            reportType={reportTypeLabel}
            title={reportMeta.title}
            subtitle={reportMeta.subtitle}
            status={reportMeta.status}
            generatedAt={lastUpdatedAt}
            levelLabel={reportLevelLabel}
          />
          <ReportHealthSummary
            reportType={reportTypeLabel}
            name={reportMeta.title}
            sickDetections={reportMeta.sickDetections}
            activeAlerts={reportMeta.activeAlerts}
          />
          <ReportSummaryCards items={summaryCards} />
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.65fr)]">
            <ReportDetectionSummary
              healthyDetections={reportMeta.healthyDetections}
              sickDetections={reportMeta.sickDetections}
              latestAnalysis={latestAnalysis}
            />
            {reportType === "coop" ? <ReportLatestSensor sensor={report.latest_sensor_readings?.[0]} /> : null}
          </div>
          <ReportDeviceStatus devices={report.devices || []} />
          <ReportAlerts alerts={report.recent_alerts || []} />
          <ReportImages images={reportImages} />
          <ReportJsonViewer report={report} />
        </div>
      )}
    </div>
  );
}

function buildBreadcrumbItems(reportType, selectedFarm, selectedCoop, selectedFarmOption, selectedCoopOption) {
  const items = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Reports", to: "/reports" },
    { label: reportType === "coop" ? "Coop Report" : "Farm Report" },
  ];

  if (selectedFarm) {
    items.push({ label: selectedFarmOption?.name || selectedFarm, to: `/farms/${selectedFarm}` });
  }
  if (reportType === "coop" && selectedCoop) {
    items.push({ label: selectedCoopOption?.name || selectedCoop, to: `/coops/${selectedCoop}` });
  }

  return items;
}

function buildReportMeta(report, reportType, selectedFarmOption, selectedCoopOption, updatedAt) {
  if (!report) {
    return {
      title: reportType === "coop" ? selectedCoopOption?.name || "Coop Report" : selectedFarmOption?.name || "Farm Report",
      subtitle: "No report loaded yet.",
      status: "unknown",
      activeAlerts: 0,
      healthyDetections: 0,
      sickDetections: 0,
      generatedAt: updatedAt,
    };
  }

  if (reportType === "coop") {
    const healthyDetections = countDetections(report.disease_history, "healthy");
    const sickDetections = countDetections(report.disease_history, "sick");
    return {
      title: report.coop?.name || selectedCoopOption?.name || "Coop Report",
      subtitle: `Parent farm ${selectedFarmOption?.name || report.coop?.farm_id || "N/A"}`,
      status: report.coop?.latest_health_status,
      activeAlerts: report.coop?.active_alerts ?? report.recent_alerts?.length ?? 0,
      healthyDetections,
      sickDetections,
    };
  }

  return {
    title: report.farm?.name || selectedFarmOption?.name || "Farm Report",
    subtitle: report.farm?.location ? `Location: ${report.farm.location}` : "Farm monitoring report",
    status: report.farm?.latest_health_status,
    activeAlerts: report.farm?.active_alerts ?? report.recent_alerts?.length ?? 0,
    healthyDetections: report.healthy_detections ?? 0,
    sickDetections: report.sick_detections ?? 0,
  };
}

function buildSummaryCards(report, reportType) {
  if (reportType === "coop") {
    const devices = report.devices || [];
    const healthyDetections = countDetections(report.disease_history, "healthy");
    const sickDetections = countDetections(report.disease_history, "sick");
    return [
      { label: "Devices in Coop", value: report.coop?.number_of_devices ?? devices.length },
      { label: "Online Devices", value: devices.filter((device) => device.status === "online").length },
      { label: "Offline Devices", value: devices.filter((device) => device.status === "offline").length, danger: true },
      { label: "Sensor Readings", value: report.total_readings ?? report.latest_sensor_readings?.length ?? 0 },
      { label: "Droppings Analyses", value: report.total_droppings_analyses ?? report.disease_history?.length ?? 0 },
      { label: "Healthy Detections", value: healthyDetections },
      { label: "Sick Detections", value: sickDetections, danger: sickDetections > 0 },
      { label: "Active Alerts", value: report.coop?.active_alerts ?? report.recent_alerts?.length ?? 0, danger: (report.recent_alerts?.length ?? 0) > 0 },
    ];
  }

  return [
    { label: "Number of Coops", value: report.number_of_coops ?? report.farm?.number_of_coops ?? 0 },
    { label: "Number of Devices", value: report.number_of_devices ?? report.devices?.length ?? 0 },
    { label: "Online Devices", value: report.online_devices ?? 0 },
    { label: "Offline Devices", value: report.offline_devices ?? 0, danger: (report.offline_devices ?? 0) > 0 },
    { label: "Sensor Readings", value: report.total_readings ?? 0 },
    { label: "Droppings Analyses", value: report.total_droppings_analyses ?? 0 },
    { label: "Healthy Detections", value: report.healthy_detections ?? 0 },
    { label: "Sick Detections", value: report.sick_detections ?? 0, danger: (report.sick_detections ?? 0) > 0 },
    { label: "Active Alerts", value: report.farm?.active_alerts ?? report.recent_alerts?.length ?? 0, danger: (report.recent_alerts?.length ?? 0) > 0 },
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

function buildReportImages(report, reportType) {
  const items = [];
  const seen = new Set();

  function addImage(image) {
    if (!image?.imagePath) {
      return;
    }
    const key = `${image.id || ""}:${image.imagePath}:${image.timestamp || ""}:${image.deviceId || ""}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    items.push({ key, ...image });
  }

  (report.recent_alerts || []).forEach((alert) => {
    addImage({
      id: alert.id,
      imagePath: alert.image_path,
      diseaseType: alert.disease_type,
      confidence: alert.confidence,
      timestamp: alert.timestamp,
      deviceId: alert.device_id,
      healthResult: "Sick",
    });
  });

  if (reportType === "coop") {
    (report.disease_history || []).forEach((item) => {
      addImage({
        imagePath: item.image_path,
        diseaseType: item.disease_type,
        confidence: item.confidence,
        timestamp: item.timestamp,
        deviceId: item.device_id,
        healthResult: item.prediction_status,
      });
    });
  }

  (report.devices || []).forEach((device) => {
    const prediction = device.latest_prediction;
    if (prediction) {
      addImage({
        imagePath: prediction.image_path,
        diseaseType: prediction.disease_type,
        confidence: prediction.confidence,
        timestamp: prediction.timestamp,
        deviceId: device.device_id,
        healthResult: prediction.prediction_status,
      });
    }
  });

  return items
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
    .slice(0, 9);
}

function countDetections(items = [], status) {
  return items.filter((item) => item?.prediction_status === status).length;
}
