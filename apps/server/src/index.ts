import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { initDatabase, closeDatabase } from './database/index.js';
import { initStorage } from './storage/index.js';
import { getPrimaryLanAddress } from './discovery/network.js';
import { setupSocketIO } from './sockets/index.js';
import { logger } from './utils/logger.js';

let ioInstance: SocketIOServer | null = null;

export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized');
  }
  return ioInstance;
}

async function startServer(): Promise<void> {
  try {
    // 1. Initialize file storage directories
    initStorage();

    // 2. Initialize SQLite database and run migrations
    initDatabase();

    // 3. Create Express app and HTTP server
    const app = createApp();
    const server = http.createServer(app);

    // 4. Initialize Socket.IO
    ioInstance = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    setupSocketIO(ioInstance);

    // 5. Start listening
    server.listen(config.port, config.host, () => {
      const lanIp = getPrimaryLanAddress();

      // Print exact startup banner as specified in DevDrop Spec §5.1
      console.log('\nDevDrop Server\n');
      console.log('Status: Running');
      console.log(`Port: ${config.port}`);
      console.log(`Local: http://localhost:${config.port}`);
      console.log(`Network: http://${lanIp}:${config.port}\n`);
      console.log(`Storage: ${config.storageDir}\n`);
      console.log('Waiting for connections...\n');
    });

    // Handle graceful shutdown
    const handleShutdown = () => {
      logger.info('Shutting down DevDrop server...');
      server.close(() => {
        closeDatabase();
        logger.info('DevDrop server stopped.');
        process.exit(0);
      });
    };

    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
  } catch (err) {
    logger.error('Failed to start DevDrop server:', err);
    process.exit(1);
  }
}

startServer();

