import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@devdrop/shared';
import type { Transfer } from '../../types';

export type SocketStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface SocketListenerCallbacks {
  onStatusChange?: (status: SocketStatus) => void;
  onTransferCreated?: (transfer: Transfer) => void;
  onTransferAvailable?: (transfer: Transfer) => void;
  onTransferProgress?: (data: { transferId: string; bytesTransferred: number; fileSize: number; percentage: number }) => void;
  onTransferCompleted?: (transfer: Transfer) => void;
  onTransferFailed?: (data: { transferId: string; error?: string }) => void;
  onTransferCancelled?: (data: { transferId: string; cancelledBy?: string }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private status: SocketStatus = 'disconnected';
  private callbacks: SocketListenerCallbacks = {};

  public setCallbacks(callbacks: SocketListenerCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public connect(serverUrl: string, deviceToken: string) {
    if (this.socket) {
      this.disconnect();
    }

    this.status = 'connecting';
    this.callbacks.onStatusChange?.('connecting');

    const cleanUrl = serverUrl.replace(/\/+$/, '');

    this.socket = io(cleanUrl, {
      auth: {
        token: deviceToken,
      },
      extraHeaders: {
        Authorization: `Bearer ${deviceToken}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.status = 'connected';
      this.callbacks.onStatusChange?.('connected');
      this.socket?.emit('device:heartbeat', { timestamp: Date.now() });
    });

    this.socket.on('disconnect', () => {
      this.status = 'disconnected';
      this.callbacks.onStatusChange?.('disconnected');
    });

    this.socket.on('connect_error', () => {
      this.status = 'error';
      this.callbacks.onStatusChange?.('error');
    });

    // DevDrop transfer events
    this.socket.on(SOCKET_EVENTS.TRANSFER_CREATED, (transfer: Transfer) => {
      this.callbacks.onTransferCreated?.(transfer);
    });

    this.socket.on(SOCKET_EVENTS.TRANSFER_AVAILABLE, (transfer: Transfer) => {
      this.callbacks.onTransferAvailable?.(transfer);
    });

    this.socket.on(SOCKET_EVENTS.TRANSFER_PROGRESS, (data: any) => {
      this.callbacks.onTransferProgress?.(data);
    });

    this.socket.on(SOCKET_EVENTS.TRANSFER_COMPLETED, (transfer: Transfer) => {
      this.callbacks.onTransferCompleted?.(transfer);
    });

    this.socket.on(SOCKET_EVENTS.TRANSFER_FAILED, (data: any) => {
      this.callbacks.onTransferFailed?.(data);
    });

    this.socket.on(SOCKET_EVENTS.TRANSFER_CANCELLED, (data: any) => {
      this.callbacks.onTransferCancelled?.(data);
    });
  }

  public subscribeToTransfer(transferId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(SOCKET_EVENTS.TRANSFER_SUBSCRIBE, { transferId });
    }
  }

  public cancelTransfer(transferId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(SOCKET_EVENTS.TRANSFER_CANCEL, { transferId });
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.status = 'disconnected';
    this.callbacks.onStatusChange?.('disconnected');
  }

  public getStatus(): SocketStatus {
    return this.status;
  }

  public getRawSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();

