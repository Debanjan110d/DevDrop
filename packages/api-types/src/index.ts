import type { Device, Transfer, TransferStatus } from "@devdrop/shared";

// ============================================================
// Generic response wrappers
// ============================================================

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============================================================
// Health endpoint
// GET /health
// ============================================================

export interface HealthResponse {
  status: "ok";
  uptime: number; // seconds
  version: string;
}

// ============================================================
// Server info endpoint
// GET /api/v1/info
// ============================================================

export interface ServerInfo {
  serverId: string;
  serverName: string;
  platform: "windows";
  version: string;
  lanIp: string;
  port: number;
}

// ============================================================
// Pairing sessions
// POST /api/v1/pairing/session  → CreatePairingSessionResponse
// GET  /api/v1/pairing/session/:token → PairingSessionStatus
// POST /api/v1/pairing/complete → CompletePairingResponse
// ============================================================

export interface PairingQRPayload {
  version: 1;
  url: string;
  pairingToken: string;
}

export interface CreatePairingSessionResponse {
  pairingToken: string;
  expiresAt: string; // ISO 8601
  qrPayload: PairingQRPayload;
}

export type PairingSessionState = "pending" | "completed" | "expired";

export interface PairingSessionStatus {
  pairingToken: string;
  state: PairingSessionState;
  expiresAt: string;
  pairedDeviceId?: string;
}

export interface PairDeviceRequest {
  pairingToken: string;
  deviceName: string;
  platform: string;
}

export interface CompletePairingResponse {
  device: Device;
  apiToken: string;
}

// ============================================================
// Devices
// GET    /api/v1/devices        → Device[]
// GET    /api/v1/devices/:id    → Device
// PATCH  /api/v1/devices/:id    → Device
// DELETE /api/v1/devices/:id    → void
// ============================================================

export interface UpdateDeviceRequest {
  name?: string;
  status?: "online" | "offline";
}

export interface ListDevicesResponse {
  devices: Device[];
  total: number;
}

// ============================================================
// Transfers
// POST   /api/v1/transfers          → Transfer
// GET    /api/v1/transfers          → Transfer[]
// GET    /api/v1/transfers/:id      → Transfer
// PATCH  /api/v1/transfers/:id      → Transfer
// DELETE /api/v1/transfers/:id      → void
// POST   /api/v1/transfers/:id/cancel → Transfer
// ============================================================

export interface CreateTransferRequest {
  fileName: string;
  mimeType: string;
  fileSize: number;
  direction: "pc-to-mobile" | "mobile-to-pc";
  destinationDeviceId: string;
}

export interface UpdateTransferRequest {
  status?: TransferStatus;
  bytesTransferred?: number;
}

export interface ListTransfersResponse {
  transfers: Transfer[];
  total: number;
  /** Optional cursor for pagination */
  nextCursor?: string;
}

export interface TransferProgressEvent {
  transferId: string;
  bytesTransferred: number;
  fileSize: number;
  percentage: number;
}
