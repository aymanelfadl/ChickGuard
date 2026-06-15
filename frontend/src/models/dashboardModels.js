function numberOrNull(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function numberOrZero(value) {
  return numberOrNull(value) ?? 0;
}

function stringOrNull(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function normalizeOverview(raw = {}) {
  return {
    totalDevices: numberOrZero(raw.total_devices),
    activeDevices: numberOrZero(raw.active_devices),
    totalSensorReadings: numberOrZero(raw.total_sensor_readings),
    totalImageReadings: numberOrZero(raw.total_image_readings),
    healthyDetections: numberOrZero(raw.healthy_detections),
    sickDetections: numberOrZero(raw.sick_detections),
    latestReadingAt: stringOrNull(raw.latest_reading_at),
  };
}

export function normalizeLatestStatus(raw = {}) {
  const latestSensor = raw.latest_sensor;
  const latestPrediction = raw.latest_prediction;

  return {
    deviceId: stringOrNull(raw.device_id),
    farmId: stringOrNull(raw.farm_id),
    coopId: stringOrNull(raw.coop_id),
    latestSensor: latestSensor
      ? {
          temperatureC: numberOrNull(latestSensor.temperature_c),
          humidityPercent: numberOrNull(latestSensor.humidity_percent),
          motion: numberOrNull(latestSensor.motion),
          weightKg: numberOrNull(latestSensor.weight_kg),
          timestamp: stringOrNull(latestSensor.timestamp),
        }
      : null,
    latestPrediction: latestPrediction
      ? {
          predictionStatus: stringOrNull(latestPrediction.prediction_status),
          diseaseType: stringOrNull(latestPrediction.disease_type),
          confidence: numberOrNull(latestPrediction.confidence),
          imagePath: stringOrNull(latestPrediction.image_path),
          timestamp: stringOrNull(latestPrediction.timestamp),
        }
      : null,
    decisions: normalizeDecisions(raw.decisions),
  };
}

export function normalizeHealthHistory(raw = []) {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => ({
    timestamp: stringOrNull(item.timestamp),
    deviceId: stringOrNull(item.device_id),
    farmId: stringOrNull(item.farm_id),
    coopId: stringOrNull(item.coop_id),
    temperatureC: numberOrNull(item.temperature_c),
    humidityPercent: numberOrNull(item.humidity_percent),
    motion: numberOrNull(item.motion),
    weightKg: numberOrNull(item.weight_kg),
    predictionStatus: stringOrNull(item.prediction_status),
    diseaseType: stringOrNull(item.disease_type),
    confidence: numberOrNull(item.confidence),
  }));
}

export function normalizeDecisions(raw = []) {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item, index) => ({
    id: stringOrNull(item.id) || `decision-${index}`,
    severity: stringOrNull(item.severity) || "normal",
    title: stringOrNull(item.title) || "Decision",
    description: stringOrNull(item.description),
    action: stringOrNull(item.action),
    source: stringOrNull(item.source),
    deviceId: stringOrNull(item.device_id),
    farmId: stringOrNull(item.farm_id),
    coopId: stringOrNull(item.coop_id),
  }));
}

export function normalizeAlerts(raw = []) {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => ({
    id: item.id ?? `${item.device_id ?? "unknown"}-${item.timestamp ?? "unknown"}`,
    deviceId: stringOrNull(item.device_id),
    farmId: stringOrNull(item.farm_id),
    coopId: stringOrNull(item.coop_id),
    diseaseType: stringOrNull(item.disease_type),
    confidence: numberOrNull(item.confidence),
    imagePath: stringOrNull(item.image_path),
    timestamp: stringOrNull(item.timestamp),
    createdAt: stringOrNull(item.created_at),
  }));
}
