# Architecture

DevDrop is a zero-cloud local-network file-sharing and clipboard synchronization system that connects a Windows PC to Android devices over Wi-Fi or Ethernet — private, local, and without internet dependency.

## High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                       Windows PC                                       │
│                                                                                        │
│  ┌───────────────────────┐                      ┌────────────────────────────────────┐ │
│  │ Chrome MV3 Extension  │                      │ DevDrop Server                     │ │
│  │ (Popup + Service Wkr) │                      │ apps/server (port 4545)            │ │
│  └───────────┬───────────┘                      │                                    │ │
│              │ (Native Messaging: 1-click start)│ ┌────────────────────────────────┐ │ │
│              ▼                                  │ │ Express HTTP API               │ │ │
│  ┌───────────────────────┐                      │ │ /api/transfers, /api/text, ... │ │ │
│  │ Native Messaging Host │── Launches / Stops ─►│ ├────────────────────────────────┤ │ │
│  │ tools/native-host.cjs │                      │ │ Socket.IO Server               │ │ │
│  └───────────────────────┘                      │ │ real-time push & text events   │ │ │
│                                                 │ ├────────────────────────────────┤ │ │
│  ┌───────────────────────┐     Local HTTP/WS    │ │ Multer Multipart Streams       │ │ │
│  │ Web Dashboard & Show  │◄────────────────────►│ │ Static File Hosting            │ │ │
│  │ case (React 18 SPA)   │                      │ ├────────────────────────────────┤ │ │
│  │ apps/web              │                      │ │ SQLite DB (devices, transfers) │ │ │
│  └───────────────────────┘                      │ │ Dynamic Storage Directory      │ │ │
│                                                 │ └────────────────────────────────┘ │ │
│                                                 └──────────────────┬─────────────────┘ │
└────────────────────────────────────────────────────────────────────┼───────────────────┘
                                                                     │
                                                       Local Area Network (LAN)
                                                       Wi-Fi / Ethernet (port 4545)
                                                                     │
┌────────────────────────────────────────────────────────────────────┼───────────────────┐
│                                   Android Device(s)                │                   │
│                                                                    ▼                   │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Native Android Client (apps/android)                                              │  │
│  │ React Native 0.76.7 / Expo SDK 52 (Expo Router)                                  │  │
│  │ - Camera QR Scanner (expo-camera) for instant pairing                           │  │
│  │ - Foreground Service (expo-notifications / keep-awake) for resilient transfers  │  │
│  │ - Native Document Picker (expo-document-picker) multi-file selector              │  │
│  │ - Real-time Socket.IO client (file progress + real-time text sync)               │  │
│  │ - Native Clipboard & Share Sheet (Share.share / expo-clipboard)                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Alternative: Responsive Web PWA (Any Mobile Browser)                             │  │
│  │ Served directly from http://<PC-LAN-IP>:4545 without requiring app installation │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

## Components

### `apps/server` — DevDrop Server (Host Backend)
The core coordinator running on the PC. An Express.js + Socket.IO daemon that:
- Serves the REST API on port `4545` (`/api/transfers`, `/api/text`, `/api/devices`, `/api/server/storage`, `/api/server/shutdown`).
- Manages real-time bidirectional Socket.IO events (`transfer:start`, `transfer:progress`, `transfer:completed`, `text:send`, `text:received`).
- Handles multi-file multipart uploads via Multer directly into safe storage directories.
- Manages dynamic storage directories (`PATCH /api/server/storage`), allowing users to switch the save location to any custom drive or folder on the fly.
- Exposes graceful shutdown (`POST /api/server/shutdown`) so the Chrome extension or tray can turn off the server to conserve PC resources.
- Persists device registry, active pairing sessions, and transfer logs in a local SQLite database (`devdrop.sqlite`).

### `apps/android` — Native Android Application
A native Android app built with Expo SDK 52 and React Native 0.76.7:
- **Instant Pairing:** Scans QR code generated on the desktop dashboard via `expo-camera` to obtain token and connect immediately.
- **Multi-File Sharing:** Selects multiple files of any type using `expo-document-picker` and streams them in parallel or sequentially.
- **Direct Text & Clipboard Drop:** Dedicated `/text` tab allows typing or pasting text to instantly blast across devices, complete with 1-click clipboard copy and system share sheet.
- **Reliable Transfers:** Keeps sockets alive during active background transfers with notification channels and Wi-Fi lock preservation.
- **Standalone Release APK:** Pre-compiled release APK ready to sideload at `dist/devdrop.apk` and downloadable from the web dashboard.

### `apps/web` — Web Dashboard & Showcase
A modern React 18 single-page application built with Vite and Tailwind CSS:
- **Public Product Landing Page (`/`):** A standalone showcase page explaining DevDrop's capabilities, architecture, and download links. Fully compatible with Vercel and static hosting.
- **Management Dashboard (`/dashboard`, `/send`, `/receive`, `/text`, `/devices`, `/settings`):** When connected to the local server, provides device pairing QR codes, multi-file drag-and-drop, real-time transfer monitoring, live clipboard/text drops, and dynamic storage configuration.

### `apps/extension` — Chrome Manifest V3 Extension
A lightweight extension that keeps DevDrop accessible from the browser toolbar:
- Displays server status (Online / Offline / LAN Address).
- **Zero-Footprint On-Demand Server Control:** Integrates with the Chrome Native Messaging host (`com.devdrop.launcher`) to start the background Node.js server with one click and shut it down when not in use.
- One-click shortcuts to open the local web dashboard or trigger quick transfers.

### `packages/shared`, `packages/api-types`, `packages/validation`
- Shared TypeScript interfaces, transfer state machines, API types, and Zod schemas powering end-to-end type safety between the server, web, extension, and mobile app.

---

## Data Flows

### 1. Multi-File Transfer (PC ➔ Mobile or Mobile ➔ PC)
```
1. Sender selects 1 or more files (via Web drag-and-drop or Native Android Picker)
       │
2. Client sends multipart/form-data POST /api/transfers
   (supports multiple files in a single request or concurrent requests)
       │
3. Server streams incoming chunks into Temporary/<transferId>.tmp
   Emits transfer:start and transfer:progress to connected sockets
       │
4. Server atomically finalizes files into From-Mobile/ or From-PC/
   Updates SQLite record to "completed" and emits transfer:completed
       │
5. Recipient downloads or opens the completed files with 1 click
```

### 2. Real-Time Text & Clipboard Drop
```
1. User pastes or types text on PC (/text) or Mobile (/text)
       │
2. Client emits text:send via Socket.IO or POSTs to /api/text
       │
3. Server writes snippet to storage as a .txt record, indexes it in SQLite,
   and broadcasts text:received to all connected devices in real time
       │
4. Receiving device displays floating toast banner with 1-click "Copy to Clipboard"
```

### 3. Native Messaging Server Lifecycle (Extension ➔ PC Server)
```
1. Chrome Extension user clicks "Start Server" in popup
       │
2. chrome.runtime.sendNativeMessage("com.devdrop.launcher", { command: "start" })
       │
3. Native host (node tools/native-host.cjs) spawns apps/server in background detached mode
       │
4. Extension detects server online at http://localhost:4545 and updates UI to green
       │
5. User clicks "Stop Server" ➔ calls POST /api/server/shutdown to release PC memory
```
