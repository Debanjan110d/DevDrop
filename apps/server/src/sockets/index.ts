import { Server as SocketIOServer, Socket } from 'socket.io';
import { hashToken } from '../security/tokens.js';
import { db } from '../database/index.js';
import { logger } from '../utils/logger.js';
import { registerSocketHandlers } from './handlers.js';

export interface AuthenticatedSocket extends Socket {
  deviceId?: string;
  deviceName?: string;
  isLocalHost?: boolean;
}

let ioInstance: SocketIOServer | null = null;

export const onlineDeviceIds = new Set<string>();

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function isDeviceOnline(deviceId: string): boolean {
  if (deviceId === 'pc-host') return true;
  return onlineDeviceIds.has(deviceId);
}

export function setupSocketIO(io: SocketIOServer): void {
  ioInstance = io;

  // Auth middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    let rawToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    const clientIp = socket.handshake.address;
    const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1' || socket.handshake.auth?.isLocal;

    // Allow local dashboard without paired token
    if (isLocal && (!rawToken || rawToken === 'pc-local' || rawToken === 'Bearer pc-local')) {
      socket.deviceId = 'pc-host';
      socket.deviceName = 'PC Dashboard';
      socket.isLocalHost = true;
      return next();
    }

    if (!rawToken) {
      return next(new Error('Authentication token required'));
    }

    // Clean Bearer prefix if present
    let token = typeof rawToken === 'string' ? rawToken.trim() : '';
    if (token.startsWith('Bearer ')) {
      token = token.slice(7).trim();
    }

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const tokenHash = hashToken(token);
      const device = db.devices.findFirst({ tokenHash });

      if (!device) {
        return next(new Error('Device not recognized'));
      }

      if (device.revokedAt !== null && device.revokedAt !== undefined) {
        return next(new Error('Device access revoked'));
      }

      socket.deviceId = device.id;
      socket.deviceName = device.name;
      socket.isLocalHost = false;

      // Update last seen
      db.devices.update(device.id, { lastSeenAt: Date.now() });

      next();
    } catch (err) {
      logger.error('Socket auth error:', err);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id} (device: ${socket.deviceId})`);

    // Join device-specific room and mark online
    if (socket.deviceId) {
      onlineDeviceIds.add(socket.deviceId);
      socket.join(`device:${socket.deviceId}`);
    }

    registerSocketHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (reason: ${reason})`);
      if (socket.deviceId) {
        const room = io.sockets.adapter.rooms.get(`device:${socket.deviceId}`);
        if (!room || room.size === 0) {
          onlineDeviceIds.delete(socket.deviceId);
          io.emit('device:disconnected', {
            id: socket.deviceId,
            deviceId: socket.deviceId,
            status: 'offline',
            timestamp: Date.now(),
          });
        }
      }
    });

    // Announce connection to all clients
    io.emit('device:connected', {
      id: socket.deviceId,
      deviceId: socket.deviceId,
      name: socket.deviceName,
      status: 'online',
      timestamp: Date.now(),
    });
  });
}
