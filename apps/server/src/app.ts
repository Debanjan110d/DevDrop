import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import healthRoutes from './api/routes/health.js';
import pairingRoutes from './api/routes/pairing.js';
import devicesRoutes from './api/routes/devices.js';
import transfersRoutes from './api/routes/transfers.js';
import { errorHandler } from './api/middleware/errorHandler.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(): express.Application {
  const app = express();

  // Basic security headers, permissive enough for local network PWA
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS allowing all local network clients and dev servers
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });

  // Mount API routes
  app.use('/health', healthRoutes);
  app.use('/api', healthRoutes);
  app.use('/api', pairingRoutes);
  app.use('/api', devicesRoutes);
  app.use('/api', transfersRoutes);

  // Serve static web dashboard if built
  const webDistPath = path.resolve(__dirname, '../../web/dist');
  if (fs.existsSync(webDistPath)) {
    app.use(express.static(webDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return next();
      }
      res.sendFile(path.join(webDistPath, 'index.html'));
    });
  }

  // Global error handler
  app.use(errorHandler);

  return app;
}

