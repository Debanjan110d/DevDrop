import { io, Socket } from 'socket.io-client';
import type { Transfer, Device } from '@devdrop/shared';
import { SOCKET_EVENTS } from '@devdrop/shared';

export function getSocketUrl(): string {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (typeof window !== 'undefined') {
    if (window.location.port === '5173') {
      return `http://${window.location.hostname}:4545`;
    }
    return window.location.origin;
  }
  return 'http://localhost:4545';
}

// ─── Typed event maps ─────────────────────────────────────────────────────

export type ServerToClientEvents = {
  [SOCKET_EVENTS.SERVER_STATUS]: (payload: { running: boolean; connectedDevices: number }) => void;
  [SOCKET_EVENTS.DEVICE_CONNECTED]: (device: Device) => void;
  [SOCKET_EVENTS.DEVICE_DISCONNECTED]: (payload: { deviceId: string }) => void;
  [SOCKET_EVENTS.DEVICE_PAIRED]: (device: Device) => void;
  [SOCKET_EVENTS.DEVICE_HEARTBEAT]: (payload: { deviceId: string; timestamp: string }) => void;
  [SOCKET_EVENTS.TRANSFER_CREATED]: (transfer: Transfer) => void;
  [SOCKET_EVENTS.TRANSFER_AVAILABLE]: (transfer: Transfer) => void;
  [SOCKET_EVENTS.TRANSFER_PROGRESS]: (payload: {
    transferId: string;
    bytesTransferred: number;
    totalBytes: number;
  }) => void;
  [SOCKET_EVENTS.TRANSFER_COMPLETED]: (transfer: Transfer) => void;
  [SOCKET_EVENTS.TRANSFER_FAILED]: (payload: { transferId: string; error: string }) => void;
  [SOCKET_EVENTS.TRANSFER_CANCELLED]: (payload: { transferId: string }) => void;
};

export type ClientToServerEvents = {
  [SOCKET_EVENTS.TRANSFER_SUBSCRIBE]: (transferId: string) => void;
  [SOCKET_EVENTS.TRANSFER_CANCEL]: (transferId: string) => void;
};

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ─── Singleton socket instance ────────────────────────────────────────────

let socket: TypedSocket | null = null;

export function getSocket(authToken?: string): TypedSocket {
  const token = authToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('devdrop_device_token') : null);

  if (!socket || !socket.connected) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      ...(token ? { auth: { token: `Bearer ${token}` } } : {}),
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    }) as TypedSocket;
  }
  return socket;
}

export function connectSocket(authToken?: string): TypedSocket {
  const s = getSocket(authToken);
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
