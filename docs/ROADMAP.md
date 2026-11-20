# DevDrop — Product Roadmap & Milestone Tracking

**Product tagline:** *Your devices. Your network. Your files.*

---

## 1. Version 1.0 — Definition of Done Checklist

| Item | Requirement | Status | Notes |
|---|---|---|---|
| 1 | Server started manually | ✅ Done | `node apps/server/dist/index.js` or `npm run devdrop:start` |
| 2 | Browser dashboard works | ✅ Done | React SPA served directly on `:4545/` and `:4545/dashboard` |
| 3 | Extension opens dashboard | ✅ Done | MV3 popup pings health and provides 1-click open |
| 4 | Mobile pairs using QR | ✅ Done | Single-use 120s token exchange generates device credentials |
| 5 | PC-to-Mobile transfer works | ✅ Done | Files staged on server -> streamed download to mobile |
| 6 | Mobile-to-PC transfer works | ✅ Done | Streamed HTTP upload -> moved atomically to `From-Mobile` |
| 7 | Dedicated PC storage works | ✅ Done | `From-Mobile`, `From-PC`, `Temporary`, `Database`, `Logs` |
| 8 | Transfer history persists | ✅ Done | Persisted in SQLite `transfers` table with timestamps & status |
| 9 | Real-time transfer progress | ✅ Done | Socket.IO event streaming (`transfer:progress`) |
| 10 | Multiple files transfer | ✅ Done | Multi-file queue in `SendPage` |
| 11 | Large files are streamed | ✅ Done | Streaming chunk pipes, no full buffering in RAM |
| 12 | Device revocation works | ✅ Done | Immediate revocation flag with `403 DEVICE_REVOKED` |
| 13 | Failed transfers handled | ✅ Done | Temporary `.tmp` unlinked, status marked `failed` |
| 14 | No cloud service required | ✅ Done | 100% self-hosted, zero external API or cloud calls |
| 15 | No public internet required | ✅ Done | Operates completely offline across local LAN / Wi-Fi |
| 16 | Complete documentation | ✅ Done | `README`, `ARCHITECTURE`, `API`, `SECURITY`, `DEVELOPMENT`, `ROADMAP` |

---

## 2. Post-v1.0 Milestone Roadmap

### v1.1 — Convenience (Next Release)
- [ ] **Automatic mDNS Discovery (`devdrop.local`):** Discover local PC host without typing IP addresses.
- [ ] **Transfer Queue Prioritization:** Reorder or pause in-flight transfers.
- [ ] **Enhanced Retry Logic:** One-click retry for failed network transfers.
- [ ] **Browser Extension Quick-Send:** Right-click context menu to send downloaded files to phone.

### v1.2 — Advanced Transfers
- [ ] **Resumable Chunked Transfers:** Support `Content-Range` chunked resume for multi-gigabyte transfers over spotty Wi-Fi.
- [ ] **Folder / Directory Transfers:** Tarball or zip streaming for directory transfers without temporary disk bloat.
- [ ] **Shared Clipboard:** Synchronize text or URLs between paired devices on demand.
- [ ] **Optional Compression:** On-the-fly gzip/deflate compression for text and document files.

### v2.0 — Native Mobile Experience
- [ ] **React Native + Expo Android App:** Native Android client leveraging the same REST & Socket.IO APIs.
- [ ] **Background Transfer Service:** Keep large downloads running while phone screen is locked.
- [ ] **Android System Share Sheet:** "Share via DevDrop" from any Android photo, document, or file manager app.
- [ ] **Native Push Notifications:** Local Android notifications for completed incoming transfers.

### v2.1 — Device Ecosystem
- [ ] **Multiple PC Hosts:** Switch between multiple computers on the same network.
- [ ] **Device Groups:** Send a file to all paired household devices simultaneously.
- [ ] **Optional PIN Protection:** Secondary confirmation PIN before receiving files.

