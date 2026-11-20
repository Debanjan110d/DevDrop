# DevDrop — Development & Setup Guide

**Product tagline:** *Your devices. Your network. Your files.*

---

## 1. Prerequisites

- **Node.js:** v20.0.0 or newer (v22+ recommended for native `node:sqlite`)
- **npm:** v10.0.0 or newer
- **Operating System:** Windows 10/11 (PC Server & Extension host)
- **Mobile Device:** Android phone connected to the same local Wi-Fi network
- **Android SDK / Java (Optional for APK Rebuilds):** JDK 17 & Android SDK Build-Tools 35.0.0

---

## 2. Quick Start

### 2.1 Clone & Install Dependencies
```powershell
git clone <repository_url> d:\DevDrop
cd d:\DevDrop

# Install all workspace dependencies
npm install
```

### 2.2 Build All Packages & Frontends
```powershell
# Build shared packages, server, web dashboard, and browser extension
npm run build
```

### 2.3 Start Server
```powershell
# 1-Click Launchers (Root):
.\start-devdrop.bat
# Or using npm
npm run devdrop:start
# Or directly with node
node apps/server/dist/index.js
```

### 2.4 Server Output
```text
DevDrop Server

Status: Running
Port: 4545
Local: http://localhost:4545
Network: http://192.168.x.x:4545

Storage: C:\Users\<USER>\DevDrop\Files
Waiting for connections...
```

---

## 3. Chrome Extension & Native Messaging Setup

DevDrop includes a Manifest V3 Chrome Extension allowing on-demand server control without running background processes permanently:

1. **Register the Native Host:**
   Open PowerShell as normal user and run:
   ```powershell
   powershell -ExecutionPolicy Bypass -File tools/register-native-host.ps1
   ```
2. **Load Unpacked Extension in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in upper right)
   - Click **Load unpacked**
   - Select folder: `d:\DevDrop\apps\extension\dist`
3. **Usage:**
   - Click the DevDrop puzzle icon in Chrome.
   - Click **Start Server** to spawn the server on demand, or **Stop Server** to free up memory when finished.

---

## 4. Native Android App (`apps/android`)

The native mobile app is built with Expo SDK 52 and React Native 0.76.7.

### 4.1 Running in Development Mode
```powershell
cd apps/android
npx expo start
```
Scan the Metro QR code using Expo Go on your Android device.

### 4.2 Building the Release APK
The project includes a standalone Gradle build environment:
```powershell
cd apps/android/android
.\gradlew.bat assembleRelease
```
The output APK is generated at:
`apps/android/android/app/build/outputs/apk/release/app-release.apk`

A pre-built release APK is always mirrored at:
- `dist/devdrop.apk`
- `apps/web/dist/devdrop.apk` (directly downloadable at `http://<LAN-IP>:4545/devdrop.apk`)

---

## 5. Vercel & Cloud Deployment (`apps/web`)

DevDrop's web dashboard includes a public product showcase landing page (`/`) that can be deployed to Vercel or any static host:

- **Root `vercel.json` & `apps/web/vercel.json`** configure SPA client-side routing rewrites (`"source": "/(.*)", "destination": "/index.html"`).
- **Vercel Build Settings:**
  - Root directory: `apps/web` (or root with output `apps/web/dist`)
  - Build command: `npm run build:web`
  - Output directory: `dist`
- When deployed publicly, users can view the product features, architecture diagrams, and download the APK or follow setup instructions.

---

## 6. Workspace Scripts Reference

| Command | Action |
|---|---|
| `npm run dev` | Runs dev servers across all workspaces |
| `npm run build` | Compiles shared packages, server, web dashboard, and extension |
| `npm --workspace=apps/server run dev` | Runs server with nodemon + tsx for rapid backend development |
| `npm --workspace=apps/web run dev` | Starts Vite dev server with proxy to backend at port 5173 |
| `npm --workspace=apps/extension run build` | Builds Chrome Manifest V3 extension into `apps/extension/dist` |
| `npm --workspace=apps/android run android` | Starts local Android build / emulator |
