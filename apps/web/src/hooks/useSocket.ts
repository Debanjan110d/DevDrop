import { useEffect, useRef, useCallback } from 'react';
import { connectSocket } from '../services/socket';
import { useTransferStore } from '../stores/transferStore';
import { useDeviceStore } from '../stores/deviceStore';
import { useServerStore } from '../stores/serverStore';
import { SOCKET_EVENTS } from '@devdrop/shared';
import type { TypedSocket } from '../services/socket';

export function useSocket(authToken?: string) {
  const socketRef = useRef<TypedSocket | null>(null);

  const upsertTransfer = useTransferStore((s) => s.upsertTransfer);
  const updateTransferProgress = useTransferStore((s) => s.updateTransferProgress);
  const updateTransferStatus = useTransferStore((s) => s.updateTransferStatus);

  const upsertDevice = useDeviceStore((s) => s.upsertDevice);
  const updateDeviceStatus = useDeviceStore((s) => s.updateDeviceStatus);

  const setConnected = useServerStore((s) => s.setConnected);

  useEffect(() => {
    const socket = connectSocket(authToken);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Server events
    socket.on(SOCKET_EVENTS.SERVER_STATUS as any, (payload: { running: boolean; connectedDevices: number }) => {
      setConnected(payload.running);
    });

    // Device events
    socket.on(SOCKET_EVENTS.DEVICE_CONNECTED as any, (device: any) => {
      const id = device.id || device.deviceId;
      if (id) {
        updateDeviceStatus(id, 'online');
      }
      upsertDevice({ ...device, id, status: 'online' });
    });

    socket.on(SOCKET_EVENTS.DEVICE_DISCONNECTED as any, (payload: any) => {
      const devId = payload.id || payload.deviceId;
      if (devId) {
        updateDeviceStatus(devId, 'offline');
      }
    });

    socket.on(SOCKET_EVENTS.DEVICE_PAIRED as any, (device: any) => {
      upsertDevice(device);
    });

    // Transfer events
    socket.on(SOCKET_EVENTS.TRANSFER_CREATED as any, (transfer: any) => {
      upsertTransfer(transfer);
    });

    socket.on(SOCKET_EVENTS.TRANSFER_AVAILABLE as any, (transfer: any) => {
      upsertTransfer(transfer);
    });

    socket.on(SOCKET_EVENTS.TRANSFER_PROGRESS as any, (payload: { transferId: string; bytesTransferred: number; totalBytes: number }) => {
      updateTransferProgress(payload.transferId, payload.bytesTransferred);
    });

    socket.on(SOCKET_EVENTS.TRANSFER_COMPLETED as any, (transfer: any) => {
      upsertTransfer(transfer);
    });

    socket.on(SOCKET_EVENTS.TRANSFER_FAILED as any, (payload: { transferId: string; error: string }) => {
      updateTransferStatus(payload.transferId, 'failed');
    });

    socket.on(SOCKET_EVENTS.TRANSFER_CANCELLED as any, (payload: { transferId: string }) => {
      updateTransferStatus(payload.transferId, 'cancelled');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      Object.values(SOCKET_EVENTS).forEach((event) => {
        socket.off(event as any);
      });
    };
  }, [authToken, upsertTransfer, updateTransferProgress, updateTransferStatus, upsertDevice, updateDeviceStatus, setConnected]);

  const subscribeToTransfer = useCallback((transferId: string) => {
    (socketRef.current as any)?.emit(SOCKET_EVENTS.TRANSFER_SUBSCRIBE, { transferId });
  }, []);

  const cancelTransferSocket = useCallback((transferId: string) => {
    (socketRef.current as any)?.emit(SOCKET_EVENTS.TRANSFER_CANCEL, { transferId });
  }, []);

  return { socket: socketRef.current, subscribeToTransfer, cancelTransferSocket };
}
