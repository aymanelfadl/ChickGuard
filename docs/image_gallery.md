# Image Gallery And Analysis Details

The image gallery is a droppings analysis library built from existing `ImageReading` database records. The backend does not duplicate image records; SQLite remains the source of truth for image metadata, prediction output, farm/coop/device context, and upload paths.

## Uploaded Image Storage

The existing IoT upload endpoint remains unchanged:

```http
POST /api/iot/image-reading
```

Uploaded poultry droppings images are stored under the configured uploads directory. In Docker Compose this is mounted at:

```text
/app/uploads
```

The database stores a relative image path such as:

```text
uploads/esp32-sim-01/2026-05-19/example.png
```

## Secure Image Serving

Images are served through a protected endpoint:

```http
GET /api/image-gallery/{reading_id}/image
```

The endpoint validates JWT authentication, looks up the `ImageReading` row, normalizes the stored path, verifies that the final resolved file is inside the uploads directory, and returns the file with `FileResponse`.

The backend rejects invalid paths and `../` traversal attempts. It returns `404` if the database row or image file does not exist.

For browser image tags, the frontend appends the dashboard JWT as a `token` query parameter to the protected image URL. Normal API calls continue to use the `Authorization: Bearer` header.

## Gallery API

```http
GET /api/image-gallery
```

Supported filters:

- `farm_id`
- `coop_id`
- `device_id`
- `prediction_status`: `healthy` or `sick`
- `disease_type`
- `camera_type`
- `date_from`
- `date_to`
- `search`
- `limit`
- `offset`

The response includes `items`, `total_count`, `limit`, and `offset`.

Each item includes image URL, filename, farm/coop/device/camera context, camera type, location label when available, prediction status, disease type, raw label, confidence, captured timestamp, and created timestamp.

The `camera_type` filter uses dashboard camera metadata when available. This lets farm managers browse only droppings cameras, overview cameras, environmental cameras, or security cameras without changing the IoT upload endpoint.

## Analysis Detail API

```http
GET /api/image-gallery/{reading_id}
```

The detail response includes:

- Image metadata
- Prediction result
- Disease display name
- Farm and coop context
- Device/camera context
- Camera type and location label when available
- Confidence and raw label
- Nearest related sensor snapshot
- Related health alerts

## Device Metadata Relationship

Image records continue to come from `POST /api/iot/image-reading`. The gallery enriches those records with the matching camera/device metadata:

- Device name
- Device type
- Camera type
- Farm and coop names
- Location label

The image upload request still authenticates with `X-Device-Id` and `X-Device-Api-Key`. Dashboard users view gallery images with JWT authentication.

## Frontend Routes

```text
/gallery
/gallery/:imageReadingId
```

Farm, coop, and device pages show recent droppings images and link into the filtered gallery:

- Farm details: latest images for the farm
- Coop details: latest images for the coop
- Device details: latest images from the camera/device

## Realtime Behavior

The dashboard already receives SSE events. When `droppings_analysis_created` arrives, pages that show image data refresh their REST-backed data and show a small “New image analysis received” indicator.

REST APIs remain the source of truth. SSE only tells the frontend that newer data is available.
