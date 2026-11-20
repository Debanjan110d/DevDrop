// ============================================================
// TransferStatus
// ============================================================

export type TransferStatus =
  | "pending"
  | "uploading"
  | "available"
  | "downloading"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

// ============================================================
// Core domain interfaces
// ============================================================

export interface Transfer {
  /** UUID v4 */
  id: string;
  fileName: string;
  mimeType: string;
  /** File size in bytes */
  fileSize: number;
  direction: "pc-to-mobile" | "mobile-to-pc";
  sourceDeviceId: string;
  destinationDeviceId: string;
  status: TransferStatus;
  /** Bytes transferred so far */
  bytesTransferred: number;
  createdAt: string; // ISO 8601
  completedAt?: string; // ISO 8601
}

export interface Device {
  /** UUID v4 */
  id: string;
  name: string;
  /** e.g. "windows" | "android" */
  platform: string;
  pairedAt: string; // ISO 8601
  lastSeenAt: string; // ISO 8601
  status: "online" | "offline";
}

// ============================================================
// Socket event name constants
// ============================================================

export const SOCKET_EVENTS = {
  // Server → client
  SERVER_STATUS: "server:status",
  DEVICE_CONNECTED: "device:connected",
  DEVICE_DISCONNECTED: "device:disconnected",
  DEVICE_PAIRED: "device:paired",
  TRANSFER_CREATED: "transfer:created",
  TRANSFER_AVAILABLE: "transfer:available",
  TRANSFER_PROGRESS: "transfer:progress",
  TRANSFER_COMPLETED: "transfer:completed",
  TRANSFER_FAILED: "transfer:failed",
  TRANSFER_CANCELLED: "transfer:cancelled",
  DEVICE_HEARTBEAT: "device:heartbeat",

  // Client → server
  TRANSFER_SUBSCRIBE: "transfer:subscribe",
  TRANSFER_CANCEL: "transfer:cancel",
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

// ============================================================
// Transfer state machine
// ============================================================

/** Maps each status to the set of statuses it may legally transition to. */
export const TRANSFER_STATE_MACHINE: Record<TransferStatus, TransferStatus[]> =
  {
    pending: ["uploading", "cancelled", "failed"],
    uploading: ["available", "failed", "cancelled"],
    available: ["downloading", "expired", "cancelled"],
    downloading: ["completed", "failed", "cancelled"],
    completed: [],
    failed: [],
    cancelled: [],
    expired: [],
  };

/**
 * Returns true if transitioning from `from` to `to` is a valid state machine
 * step; false otherwise.
 */
export function isValidTransition(
  from: TransferStatus,
  to: TransferStatus
): boolean {
  const allowed = TRANSFER_STATE_MACHINE[from];
  return allowed.includes(to);
}
