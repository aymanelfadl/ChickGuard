import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.config import (
    PHONE_CAMERA_CAPTURE_INTERVAL_SECONDS,
)
from app.database import get_db
from app.schemas import CameraSessionCreate, CameraSessionOut
from app.services.camera_pairing_service import (
    CameraPairingError,
    camera_device_payload,
    consume_pairing_code,
    format_utc,
)


router = APIRouter(tags=["phone-camera"])


@router.post("/camera/session", response_model=CameraSessionOut)
def create_camera_session(
    payload: CameraSessionCreate,
    db: Session = Depends(get_db),
) -> dict:
    try:
        device, session_token, session_expires_at = consume_pairing_code(db, payload.pairing_code)
    except CameraPairingError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return {
        "status": "success",
        "device_id": device.device_id,
        "session_token": session_token,
        "session_expires_at": format_utc(session_expires_at),
        "device": camera_device_payload(device),
    }


def build_camera_page() -> str:
    demo_config = {
        "source": "phone-browser-camera",
        "captureIntervalMs": PHONE_CAMERA_CAPTURE_INTERVAL_SECONDS * 1000,
    }
    config_json = json.dumps(demo_config).replace("</", "<\\/")
    return CAMERA_PAGE_HTML.replace("__DEMO_CONFIG__", config_json)


@router.get("/camera", response_class=HTMLResponse)
def camera_page() -> HTMLResponse:
    return HTMLResponse(
        content=build_camera_page(),
        headers={"Cache-Control": "no-store"},
    )


CAMERA_PAGE_HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Phone Camera Capture</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f6f8fb;
      color: #162033;
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #f6f8fb; }
    main { width: min(980px, 100%); margin: 0 auto; padding: 22px; }
    h1 { margin: 0 0 6px; font-size: clamp(1.45rem, 3vw, 2.1rem); line-height: 1.1; }
    p { margin: 0; color: #526073; line-height: 1.45; }
    .header { margin-bottom: 16px; }
    .layout { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.85fr); gap: 16px; align-items: start; }
    .panel {
      background: #ffffff;
      border: 1px solid #dbe2ea;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    }
    video {
      width: 100%;
      aspect-ratio: 4 / 3;
      display: block;
      border-radius: 8px;
      background: #111827;
      object-fit: cover;
    }
    .status {
      margin-top: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      font-size: 0.94rem;
    }
    .status.ok { border-color: #86efac; background: #f0fdf4; color: #166534; }
    .status.error { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
    .status.info { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
    .device-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      background: #f8fafc;
    }
    .device-title {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
      font-weight: 800;
      color: #0f172a;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 2px 8px;
      border-radius: 999px;
      background: #dbeafe;
      color: #1d4ed8;
      font-size: 0.76rem;
      font-weight: 800;
      white-space: nowrap;
    }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; font-size: 0.9rem; }
    .detail-grid span {
      display: block;
      color: #64748b;
      font-size: 0.76rem;
      font-weight: 800;
      text-transform: uppercase;
    }
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
    button {
      min-height: 42px;
      border: 0;
      border-radius: 8px;
      padding: 9px 12px;
      font: inherit;
      font-weight: 800;
      color: #ffffff;
      background: #1d4ed8;
      cursor: pointer;
    }
    button.secondary { color: #1f2937; background: #e5e7eb; }
    button.danger { background: #b91c1c; }
    button:disabled { cursor: not-allowed; opacity: 0.55; }
    .log {
      margin-top: 12px;
      max-height: 220px;
      overflow: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #f8fafc;
      padding: 10px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.82rem;
      line-height: 1.45;
      white-space: pre-wrap;
    }
    .hint { margin-top: 10px; font-size: 0.86rem; color: #64748b; }
    @media (max-width: 780px) {
      main { padding: 14px; }
      .layout { grid-template-columns: 1fr; }
      .actions { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <section class="header">
      <h1>Phone Camera Capture</h1>
      <p>Open this page by scanning a short-lived pairing QR from the dashboard.</p>
    </section>

    <section class="layout">
      <div class="panel">
        <video id="preview" autoplay muted playsinline></video>
        <canvas id="captureCanvas" hidden></canvas>
        <div id="status" class="status info">Waiting for pairing...</div>
        <div id="log" class="log" aria-live="polite"></div>
      </div>

      <div class="panel">
        <div id="deviceDetails" class="device-card">No paired device yet.</div>
        <div class="actions">
          <button id="captureButton" type="button" class="secondary" disabled>Capture Now</button>
          <button id="stopButton" type="button" class="danger" disabled>Stop</button>
        </div>
        <p class="hint">The phone receives a scoped camera session token from the pairing QR. It never receives or stores the device API key.</p>
      </div>
    </section>
  </main>

  <script>
    const demoConfig = __DEMO_CONFIG__;
    const intervalLabel = Math.round(demoConfig.captureIntervalMs / 1000);
    const sessionStorageKey = "phoneCamera.session";
    let stream = null;
    let intervalId = null;
    let uploadCounter = 0;
    let uploading = false;
    let cameraSession = null;

    const preview = document.getElementById("preview");
    const canvas = document.getElementById("captureCanvas");
    const statusBox = document.getElementById("status");
    const logBox = document.getElementById("log");
    const deviceDetails = document.getElementById("deviceDetails");
    const captureButton = document.getElementById("captureButton");
    const stopButton = document.getElementById("stopButton");

    function setStatus(message, type = "info") {
      statusBox.textContent = message;
      statusBox.className = `status ${type}`;
    }

    function addLog(message) {
      const now = new Date().toLocaleTimeString();
      logBox.textContent = `[${now}] ${message}\\n` + logBox.textContent;
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[char]));
    }

    function renderDeviceDetails(device, expiresAt) {
      if (!device) {
        deviceDetails.textContent = "No paired device yet.";
        return;
      }
      deviceDetails.innerHTML = `
        <div class="device-title">
          <div>${escapeHtml(device.name || device.device_id)}</div>
          <div class="badge">${escapeHtml(device.status || "paired")}</div>
        </div>
        <div class="detail-grid">
          <div><span>Device ID</span>${escapeHtml(device.device_id)}</div>
          <div><span>Session</span>Scoped token</div>
          <div><span>Type</span>${escapeHtml(device.device_type || "N/A")}</div>
          <div><span>Role</span>${escapeHtml(device.camera_type || "N/A")}</div>
          <div><span>Farm</span>${escapeHtml(device.farm_id)}</div>
          <div><span>Coop</span>${escapeHtml(device.coop_id)}</div>
          <div><span>Location</span>${escapeHtml(device.location_label || "N/A")}</div>
          <div><span>Expires</span>${escapeHtml(expiresAt || "N/A")}</div>
        </div>
      `;
    }

    function saveSession(session) {
      cameraSession = session;
      sessionStorage.setItem(sessionStorageKey, JSON.stringify(session));
      renderDeviceDetails(session.device, session.session_expires_at);
    }

    function loadSavedSession() {
      const rawSession = sessionStorage.getItem(sessionStorageKey);
      if (!rawSession) {
        return null;
      }
      try {
        const parsed = JSON.parse(rawSession);
        if (!parsed.session_token || !parsed.device) {
          return null;
        }
        if (parsed.session_expires_at && new Date(parsed.session_expires_at).getTime() <= Date.now()) {
          sessionStorage.removeItem(sessionStorageKey);
          return null;
        }
        return parsed;
      } catch {
        sessionStorage.removeItem(sessionStorageKey);
        return null;
      }
    }

    async function exchangePairingCode(pairingCode) {
      const response = await fetch("/camera/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairing_code: pairingCode }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.detail || `Pairing failed with ${response.status}.`);
      }
      window.history.replaceState({}, document.title, "/camera");
      saveSession(body);
      addLog(`Paired ${body.device?.device_id || "device"}.`);
      return body;
    }

    async function initializePairing() {
      try {
        const params = new URLSearchParams(window.location.search);
        const pairingCode = params.get("pairing_code");
        if (pairingCode) {
          setStatus("Pairing phone camera...", "info");
          await exchangePairingCode(pairingCode);
          await startCamera();
          return;
        }

        const savedSession = loadSavedSession();
        if (savedSession) {
          saveSession(savedSession);
          setStatus("Using existing scoped camera session.", "info");
          await startCamera();
          return;
        }

        setStatus("Scan a fresh pairing QR from the dashboard to start.", "info");
      } catch (error) {
        setStatus(error.message || "Pairing failed.", "error");
        addLog(error.message || "Pairing failed.");
      }
    }

    function currentValues() {
      if (!cameraSession?.session_token || !cameraSession?.device) {
        throw new Error("Camera session is missing. Scan a fresh pairing QR.");
      }
      const device = cameraSession.device;
      return {
        deviceId: device.device_id,
        sessionToken: cameraSession.session_token,
        farmId: device.farm_id,
        coopId: device.coop_id,
        deviceType: device.device_type || "phone-browser-camera",
        source: demoConfig.source || "phone-browser-camera",
      };
    }

    async function startCamera() {
      try {
        currentValues();
        if (stream) {
          return;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API is unavailable. Open this page on localhost or through HTTPS/ngrok.");
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        preview.srcObject = stream;
        await preview.play();

        captureButton.disabled = false;
        stopButton.disabled = false;
        setStatus(`Automatic capture is running every ${intervalLabel} seconds.`, "ok");
        addLog("Camera permission granted.");

        await captureAndUpload();
        intervalId = window.setInterval(captureAndUpload, demoConfig.captureIntervalMs);
      } catch (error) {
        handleCameraError(error);
      }
    }

    function stopCamera(options = {}) {
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      preview.srcObject = null;
      captureButton.disabled = true;
      stopButton.disabled = true;
      if (!options.preserveStatus) {
        setStatus("Camera is stopped.", "info");
      }
      if (!options.silent) {
        addLog("Camera stopped.");
      }
    }

    function handleCameraError(error) {
      const permissionDenied = error && (error.name === "NotAllowedError" || error.name === "SecurityError");
      const message = permissionDenied
        ? "Camera permission denied. Allow camera access and reload the page."
        : error.message || "Unable to start the camera.";
      stopCamera({ preserveStatus: true, silent: true });
      setStatus(message, "error");
      addLog(message);
    }

    function canvasToJpegBlob() {
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Image capture failed: the browser returned an empty JPEG."));
            return;
          }
          resolve(blob);
        }, "image/jpeg", 0.86);
      });
    }

    async function captureAndUpload() {
      if (uploading) {
        addLog("Skipped capture because the previous upload is still running.");
        return;
      }

      try {
        if (!stream || !preview.videoWidth || !preview.videoHeight) {
          throw new Error("Image capture failed: camera preview is not ready.");
        }

        uploading = true;
        const values = currentValues();
        canvas.width = preview.videoWidth;
        canvas.height = preview.videoHeight;
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Image capture failed: canvas is not available.");
        }
        context.drawImage(preview, 0, 0, canvas.width, canvas.height);
        const blob = await canvasToJpegBlob();
        await uploadImage(blob, values);
      } catch (error) {
        const message = error.message || "Image capture or upload failed.";
        setStatus(message, "error");
        addLog(message);
      } finally {
        uploading = false;
      }
    }

    async function uploadImage(blob, values) {
      const timestamp = new Date();
      const messageId = `${values.deviceId}-${timestamp.getTime()}-${uploadCounter++}`;
      const metadata = {
        device_id: values.deviceId,
        farm_id: values.farmId,
        coop_id: values.coopId,
        source: values.source,
        message_id: messageId,
        timestamp: timestamp.toISOString(),
        device_type: values.deviceType,
        firmware_version: "browser-pairing-demo",
        data: {},
      };

      const formData = new FormData();
      formData.append("image", blob, `${messageId}.jpg`);
      formData.append("metadata", JSON.stringify(metadata));

      let response;
      try {
        response = await fetch("/api/iot/image-reading", {
          method: "POST",
          headers: {
            "X-Device-Id": values.deviceId,
            "X-Camera-Session-Token": values.sessionToken,
          },
          body: formData,
        });
      } catch (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      const bodyText = await response.text();
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}: ${bodyText.slice(0, 400)}`);
      }

      let body = null;
      try {
        body = JSON.parse(bodyText);
      } catch {
        body = { message: bodyText };
      }

      const prediction = body.prediction
        ? `${body.prediction.prediction_status || "unknown"} ${body.prediction.disease_type || ""}`.trim()
        : "no prediction";
      setStatus(`Uploaded ${messageId}. Prediction: ${prediction}.`, "ok");
      addLog(`Uploaded ${messageId}; prediction=${prediction}`);
    }

    captureButton.addEventListener("click", captureAndUpload);
    stopButton.addEventListener("click", stopCamera);
    window.addEventListener("pagehide", () => stopCamera({ silent: true }));
    initializePairing();
  </script>
</body>
</html>
"""
