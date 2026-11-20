import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getDeviceHandler,
  updateDeviceHandler,
  deleteDeviceHandler,
  listDevicesHandler,
} from '../controllers/devices.controller.js';

const router = Router();

router.use(authMiddleware as any);

router.get('/devices', listDevicesHandler as any);
router.get('/devices/:id', getDeviceHandler as any);
router.patch('/devices/:id', updateDeviceHandler as any);
router.delete('/devices/:id', deleteDeviceHandler as any);

export default router;
