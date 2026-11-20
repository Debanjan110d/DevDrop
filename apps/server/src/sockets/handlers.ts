import { Server as SocketIOServer } from 'socket.io';
import { AuthenticatedSocket } from './index.js';
import { logger } from '../utils/logger.js';
import { getTransfer } from '../services/transfer.service.js';

export function registerSocketHandlers(io: SocketIOServer, socket: AuthenticatedSocket): void {
  // Heartbeat – client sends, server echoes back with server timestamp
  socket.on('device:heartbeat', (data: { timestamp?: number }) => {
    socket.emit('device:heartbeat', {
      clientTimestamp: data?.timestamp,
      serverTimestamp: Date.now(),
      deviceId: socket.deviceId,
    });
  });

  // Subscribe to transfer progress updates
  socket.on('transfer:subscribe', async (data: { transferId: string }) => {
    if (!data?.transferId) {
      socket.emit('error', { code: 'INVALID_PAYLOAD', message: 'transferId required' });
      return;
    }

    try {
      const transfer = await getTransfer(data.transferId);
      // Only allow subscription if the device owns the transfer
      if (transfer.sourceDeviceId !== socket.deviceId && transfer.destinationDeviceId !== socket.deviceId) {
        socket.emit('error', { code: 'FORBIDDEN', message: 'Not authorized to subscribe to this transfer' });
        return;
      }

      socket.join(`transfer:${data.transferId}`);
      socket.emit('transfer:subscribed', { transferId: data.transferId });
      logger.info(`Device ${socket.deviceId} subscribed to transfer ${data.transferId}`);
    } catch (err) {
      socket.emit('error', { code: 'TRANSFER_NOT_FOUND', message: 'Transfer not found' });
    }
  });

  // Cancel a transfer via socket
  socket.on('transfer:cancel', async (data: { transferId: string }) => {
    if (!data?.transferId) {
      socket.emit('error', { code: 'INVALID_PAYLOAD', message: 'transferId required' });
      return;
    }

    try {
      const transfer = await getTransfer(data.transferId);
      if (transfer.sourceDeviceId !== socket.deviceId && transfer.destinationDeviceId !== socket.deviceId) {
        socket.emit('error', { code: 'FORBIDDEN', message: 'Not authorized to cancel this transfer' });
        return;
      }

      // Emit cancellation to the transfer room
      io.to(`transfer:${data.transferId}`).emit('transfer:cancelled', {
        transferId: data.transferId,
        cancelledBy: socket.deviceId,
        timestamp: Date.now(),
      });

      logger.info(`Transfer ${data.transferId} cancel requested by device ${socket.deviceId}`);
    } catch (err) {
      socket.emit('error', { code: 'TRANSFER_NOT_FOUND', message: 'Transfer not found' });
    }
  });

  // Direct Text / Clipboard Sharing
  socket.on('text:send', (data: { text: string; destinationDeviceId?: string }) => {
    if (!data?.text || typeof data.text !== 'string') return;
    const senderName = socket.deviceName || (socket.deviceId === 'pc-host' ? 'Host PC' : 'Mobile Phone');
    io.emit('text:received', {
      id: crypto.randomUUID(),
      text: data.text,
      senderId: socket.deviceId,
      senderName,
      destinationDeviceId: data.destinationDeviceId || 'all',
      timestamp: Date.now(),
    });
    logger.info(`Direct text shared by ${senderName} (${data.text.length} chars)`);
  });
}

/**
 * Broadcast transfer progress to all subscribers.
 */
export function broadcastTransferProgress(
  io: SocketIOServer,
  transferId: string,
  progress: { bytesTransferred: number; fileSize: number; status: string }
): void {
  io.to(`transfer:${transferId}`).emit('transfer:progress', {
    transferId,
    ...progress,
    percentage: progress.fileSize > 0 ? Math.round((progress.bytesTransferred / progress.fileSize) * 100) : 0,
    timestamp: Date.now(),
  });
}
