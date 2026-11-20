# API Reference

DevDrop exposes a REST API and a Socket.IO real-time channel, both served by the Node.js server on port `4545`.

## Base URL

```
http://<LAN-IP>:4545/api/v1
```

During local development the PC can also use `http://localhost:4545/api/v1`.

---

## Response Envelopes

All REST responses are wrapped in a consistent JSON envelope.

### Success

```json
{
  "success": true,
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "TRANSFER_NOT_FOUND",
    "message": "Transfer with the given ID does not exist.",
    "details": {}
  }
}
```

| Field | Type | Description |
|---|---|---|
| `error.code` | string | Machine-readable error code (SCREAMING_SNAKE_CASE) |
| `error.message` | string | Human-readable description |
| `error.details` | object | Optional structured context (e.g. validation errors) |

---

## Authentication

> [!IMPORTANT]
> Most endpoints require a device API key. This key is issued once during the pairing flow and must be sent on every subsequent request.

Include the API key in the `Authorization` header:

```
Authorization: Bearer <api-key>
```

The `/health`, `GET /server/info`, `GET /server/status`, and the pairing endpoints are **unauthenticated** (they must be reachable before a device is paired).

---

## Endpoints

### Health

#### `GET /health`

Returns `200 OK` immediately. Used by the Chrome extension to check whether the server is running.

**Auth:** None

**Response**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 3721.4
  }
}
```

---

### Server Info

#### `GET /server/info`

Returns static metadata about this DevDrop server instance.

**Auth:** None

**Response**

```json
{
  "success": true,
  "data": {
    "name": "My PC",
    "version": "1.0.0",
    "platform": "win32",
    "lanIp": "192.168.1.42",
    "port": 4545
  }
}
```

#### `GET /server/status`

Returns live status including connected devices and active transfers.

**Auth:** None

**Response**

```json
{
  "success": true,
  "data": {
    "connectedDevices": 1,
    "activeTransfers": 0,
    "storageUsedBytes": 104857600
  }
}
```

---

### Pairing

#### `POST /pairing/sessions`

Creates a new pairing session and returns a QR code payload. Display the returned `qrPayload` as a QR code for the Android device to scan.

**Auth:** None

**Request body:** _(empty)_

**Response**

```json
{
  "success": true,
  "data": {
    "sessionId": "a1b2c3d4-...",
    "pairingToken": "tok_xxxxxxxxxxxx",
    "expiresAt": 1700000300000,
    "qrPayload": {
      "version": 1,
      "url": "http://192.168.1.42:4545",
      "pairingToken": "tok_xxxxxxxxxxxx"
    }
  }
}
```

> [!NOTE]
> `pairingToken` is a one-time-use secret. The QR code encodes the full `qrPayload` object as JSON. Tokens expire after `PAIRING_EXPIRY_SECONDS` (default: 300 seconds).

#### `POST /pair`

Completes the pairing flow. Called by the Android PWA after it scans the QR code.

**Auth:** None (authenticated by the pairing token itself)

**Request body**

```json
{
  "pairingToken": "tok_xxxxxxxxxxxx",
  "deviceName": "Pixel 8 Pro",
  "platform": "android"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `pairingToken` | string | Yes | Token from the QR payload |
| `deviceName` | string | Yes | Human-readable name for the device |
| `platform` | string | Yes | Must be `"android"` |

**Response**

```json
{
  "success": true,
  "data": {
    "deviceId": "e5f6g7h8-...",
    "apiKey": "key_yyyyyyyyyyyyyyyy",
    "serverName": "My PC"
  }
}
```

> [!WARNING]
> The `apiKey` in this response is the **only time it is returned in plaintext**. The Android device must store it securely (e.g., encrypted SharedPreferences or the browser's origin-scoped localStorage). It cannot be recovered if lost — the device must be re-paired.

---

### Devices

#### `GET /devices`

Lists all paired devices.

**Auth:** Required

**Response**

```json
{
  "success": true,
  "data": [
    {
      "id": "e5f6g7h8-...",
      "name": "Pixel 8 Pro",
      "platform": "android",
      "pairedAt": 1700000000000,
      "lastSeenAt": 1700000290000,
      "status": "online"
    }
  ]
}
```

#### `GET /devices/:id`

Returns a single device.

**Auth:** Required

**Path params:** `id` — device UUID

**Response:** Same shape as a single item from `GET /devices`.

**Error codes:** `DEVICE_NOT_FOUND` (404)

#### `PATCH /devices/:id`

Updates a device's display name.

**Auth:** Required

**Request body**

```json
{
  "name": "My Android Phone"
}
```

**Response:** Updated device object.

#### `DELETE /devices/:id`

Unpairs (removes) a device. All transfers associated with this device are cancelled if pending, and their stored files are deleted.

**Auth:** Required

**Response**

```json
{
  "success": true,
  "data": { "deleted": true }
}
```

---

### Transfers

#### `GET /transfers`

Lists all transfers. Supports optional query parameters.

**Auth:** Required

**Query params**

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by TransferStatus |
| `direction` | string | `pc-to-mobile` or `mobile-to-pc` |
| `deviceId` | string | Filter by source or destination device |
| `limit` | number | Max results (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

**Response**

```json
{
  "success": true,
  "data": {
    "transfers": [ { ... } ],
    "total": 42,
    "limit": 50,
    "offset": 0
  }
}
```

#### `GET /transfers/:id`

Returns a single transfer record.

**Auth:** Required

**Response**

```json
{
  "success": true,
  "data": {
    "id": "t1t2t3t4-...",
    "fileName": "photo.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 2097152,
    "direction": "pc-to-mobile",
    "sourceDeviceId": null,
    "destinationDeviceId": "e5f6g7h8-...",
    "status": "available",
    "bytesTransferred": 2097152,
    "createdAt": 1700000100000,
    "completedAt": null
  }
}
```

#### `POST /transfers`

Creates a new transfer and uploads the file in one multipart request.

**Auth:** Required

**Content-Type:** `multipart/form-data`

**Form fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | Yes | The file to transfer |
| `direction` | string | Yes | `"pc-to-mobile"` or `"mobile-to-pc"` |
| `destinationDeviceId` | string | Conditional | Required for `pc-to-mobile` |

**Response** (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "t1t2t3t4-...",
    "fileName": "photo.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 2097152,
    "direction": "pc-to-mobile",
    "destinationDeviceId": "e5f6g7h8-...",
    "status": "available",
    "createdAt": 1700000100000
  }
}
```

**Error codes:** `FILE_TOO_LARGE` (413), `INVALID_MIME_TYPE` (415), `DEVICE_NOT_FOUND` (404)

#### `GET /transfers/:id/download`

Downloads the file associated with a transfer. The server streams the file with appropriate `Content-Type` and `Content-Disposition` headers.

**Auth:** Required

**Response:** Binary file stream (`200 OK`)

> [!NOTE]
> The server validates that the authenticated device is the intended recipient before streaming. A device cannot download files addressed to a different device.

**Error codes:** `TRANSFER_NOT_FOUND` (404), `TRANSFER_NOT_AVAILABLE` (409), `FORBIDDEN` (403)

#### `PATCH /transfers/:id`

Updates the status of a transfer (e.g., to cancel it).

**Auth:** Required

**Request body**

```json
{
  "status": "cancelled"
}
```

Only the `cancelled` status transition is permitted via this endpoint. The server enforces `TRANSFER_STATE_MACHINE` rules and rejects invalid transitions.

**Response:** Updated transfer object.

**Error codes:** `INVALID_TRANSITION` (409)

#### `DELETE /transfers/:id`

Deletes a transfer record and removes the associated stored file from disk.

**Auth:** Required

> [!WARNING]
> This operation is irreversible. The file is permanently deleted from the server's storage.

**Response**

```json
{
  "success": true,
  "data": { "deleted": true }
}
```

---

## Socket.IO Events

The Socket.IO server runs on the same port as the HTTP server (`4545`).

> [!NOTE]
> The Android PWA connects to `http://<LAN-IP>:4545`. The desktop dashboard connects to `http://localhost:4545`. Authentication for Socket.IO uses the same `Bearer` token passed in the `auth` handshake object: `{ auth: { token: "<api-key>" } }`.

### Server → Client Events

| Event | Description |
|---|---|
| `server:status` | Broadcast on connect; current server status |
| `device:connected` | A device has come online |
| `device:disconnected` | A device has gone offline |
| `device:paired` | A new device completed pairing |
| `transfer:created` | A new transfer record was created |
| `transfer:available` | A file is ready for download |
| `transfer:progress` | Periodic download progress update |
| `transfer:completed` | Transfer finished successfully |
| `transfer:failed` | Transfer encountered an error |
| `transfer:cancelled` | Transfer was cancelled |

#### `server:status` payload

```json
{
  "connectedDevices": 1,
  "activeTransfers": 0,
  "storageUsedBytes": 104857600
}
```

#### `device:connected` / `device:disconnected` payload

```json
{
  "deviceId": "e5f6g7h8-...",
  "name": "Pixel 8 Pro",
  "platform": "android"
}
```

#### `device:paired` payload

```json
{
  "deviceId": "e5f6g7h8-...",
  "name": "Pixel 8 Pro",
  "platform": "android",
  "pairedAt": 1700000000000
}
```

#### `transfer:created` / `transfer:available` payload

```json
{
  "transferId": "t1t2t3t4-...",
  "fileName": "photo.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 2097152,
  "direction": "pc-to-mobile",
  "destinationDeviceId": "e5f6g7h8-..."
}
```

#### `transfer:progress` payload

```json
{
  "transferId": "t1t2t3t4-...",
  "bytesTransferred": 1048576,
  "fileSize": 2097152,
  "percent": 50
}
```

#### `transfer:completed` payload

```json
{
  "transferId": "t1t2t3t4-...",
  "completedAt": 1700000200000
}
```

#### `transfer:failed` payload

```json
{
  "transferId": "t1t2t3t4-...",
  "error": "Destination device disconnected during transfer."
}
```

### Client → Server Events

| Event | Description |
|---|---|
| `device:heartbeat` | Client signals it is still alive |
| `transfer:subscribe` | Subscribe to progress events for a specific transfer |
| `transfer:cancel` | Request cancellation of a transfer |

#### `device:heartbeat` payload

```json
{
  "deviceId": "e5f6g7h8-..."
}
```

#### `transfer:subscribe` payload

```json
{
  "transferId": "t1t2t3t4-..."
}
```

#### `transfer:cancel` payload

```json
{
  "transferId": "t1t2t3t4-..."
}
```

---

## Direct Text & Clipboard Sharing

### Send Text / Clipboard
`POST /api/text`

Sends text or a clipboard snippet directly to another device. Creates a persistent text transfer record and broadcasts real-time socket events.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "https://github.com/devdrop/devdrop",
  "destinationDeviceId": "d3f4g5h6-..."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "t1t2t3t4-...",
    "text": "https://github.com/devdrop/devdrop",
    "senderName": "Host PC",
    "transfer": { ... }
  }
}
```

### List Recent Shared Text
`GET /api/text`

Fetches recently shared text snippets and their contents.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "t1t2t3t4-...",
      "text": "Verification code: 849201",
      "fileName": "Text-1795199800.txt",
      "senderId": "pc-host",
      "senderName": "Host PC",
      "direction": "pc-to-mobile",
      "createdAt": 1795199800000
    }
  ]
}
```

---

## Server Management Endpoints

### Update Dedicated Storage Directory
`PATCH /api/server/storage`

Changes the active folder on the host computer where received files and staged downloads are stored.

**Request Body:**
```json
{
  "storageDir": "D:\\DevDrop\\Files"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "storageDir": "D:\\DevDrop\\Files"
  }
}
```

### Shut Down Server Process
`POST /api/server/shutdown`

Gracefully terminates the background server process to release all RAM and CPU resources.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "DevDrop server is shutting down to conserve resources."
  }
}
```

---

## Real-Time Text & Clipboard Events

| Event | Direction | Description |
|---|---|---|
| `text:send` | Client → Server | Client sends text snippet to target device |
| `text:received` | Server → Client | Server broadcasts text snippet with sender metadata |

#### `text:send` Payload
```json
{
  "text": "Meeting link: https://meet.google.com/xyz",
  "destinationDeviceId": "phone-device-id"
}
```

#### `text:received` Payload
```json
{
  "id": "uuid-v4",
  "text": "Meeting link: https://meet.google.com/xyz",
  "senderId": "pc-host",
  "senderName": "Host PC",
  "destinationDeviceId": "phone-device-id",
  "timestamp": 1795199850000
}
```

