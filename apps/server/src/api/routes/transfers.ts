import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  listTransfersHandler,
  createTransferHandler,
  getTransferHandler,
  updateTransferHandler,
  cancelTransferHandler,
  uploadTransferHandler,
  downloadTransferHandler,
  sendTextHandler,
  listTextHandler,
} from '../controllers/transfers.controller.js';

const router = Router();

router.use(authMiddleware as any);

router.get('/text', listTextHandler as any);
router.post('/text', sendTextHandler as any);
router.get('/transfers', listTransfersHandler as any);
router.post('/transfers', createTransferHandler as any);
router.get('/transfers/:id', getTransferHandler as any);
router.patch('/transfers/:id', updateTransferHandler as any);
router.delete('/transfers/:id', cancelTransferHandler as any);

// File upload: raw body streaming
router.post('/transfers/:id/upload', uploadTransferHandler as any);

// File download: streaming response
router.get('/transfers/:id/download', downloadTransferHandler as any);

export default router;
