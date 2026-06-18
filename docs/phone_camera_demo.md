# Phone Camera Demo

Use this when a phone is not on the same local network as the backend. The phone
browser opens its camera, captures one JPEG frame every 30 seconds, and uploads
that image to the existing fecal image classification endpoint.

Architecture:

```text
Phone browser camera
-> captures JPEG frame every 30 seconds
-> sends multipart image to FastAPI backend
-> backend runs image model
-> stores prediction
-> dashboard shows result
```

## 1. Register A Device

Create a camera-capable device before generating a pairing QR. The phone flow
does not need the raw device API key; it uses a short-lived pairing code and a
scoped camera session token.

Suggested demo metadata:

```text
device_id=phone-camera-01
device_type=phone-browser-camera
camera_type=droppings-camera
farm_id=farm-01
coop_id=coop-01
source=phone-browser-camera
```

## 2. Run The Backend

From `backend/`:

```bash
uvicorn app.main:app --reload
```

Or from the project root with Docker:

```bash
docker compose up -d --build backend
```

## 3. Expose The Backend With Ngrok

```bash
ngrok http 8000
```

Use this HTTPS URL as the public backend URL when generating the dashboard QR:

```text
https://YOUR_NGROK_URL
```

Use HTTPS. Browser camera access works on `localhost` and secure origins; a
plain HTTP LAN URL will usually be blocked by the phone browser.

## 4. Generate The Pairing QR

In the dashboard:

1. Open the camera device details page.
2. Find `Phone Camera Pairing`.
3. Enter the ngrok HTTPS backend URL.
4. Tap `Generate Pairing QR`.
5. Scan the QR with the phone.
6. Allow camera permission.

The QR opens:

```text
https://YOUR_NGROK_URL/camera?pairing_code=...
```

The phone exchanges the one-time pairing code for a scoped camera session token.
The phone does not receive or store the device API key.

The page calls the backend using a relative URL:

```javascript
fetch("/api/iot/image-reading", ...)
```

That relative URL works both locally and through ngrok.

The `metadata` multipart field uses the simple phone-camera shape:

```json
{
  "device_id": "phone-camera-01",
  "farm_id": "farm-01",
  "coop_id": "coop-01",
  "source": "phone-browser-camera"
}
```

The backend also still accepts the existing full IoT reading schema for
ESP32-CAM and simulator uploads.

Pairing codes are one-time use and expire quickly. Camera session tokens are
scoped to image upload for the selected device and expire separately.

## 5. Verify Results

Check that uploads are accepted by `POST /api/iot/image-reading`. Then check the
dashboard latest prediction or image gallery for the stored droppings analysis.

## Assumptions

- `/api/iot/image-reading` receives multipart form data with `image` and
  `metadata`.
- ESP32-CAM uploads can still authenticate with `X-Device-Id` and
  `X-Device-Api-Key`.
- Phone-browser uploads authenticate with `X-Device-Id` and
  `X-Camera-Session-Token`.
- The phone metadata includes `device_id`, `farm_id`, `coop_id`, and `source`.
  The API normalizes that lightweight shape into the backend's stored IoT
  reading schema.
- The dashboard pairing endpoint never returns raw API keys.
