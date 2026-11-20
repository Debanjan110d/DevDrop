import { Router } from 'express';
import { getHealth, getServerInfo, getServerStatus, updateStorageDirHandler, shutdownServerHandler } from '../controllers/health.controller.js';

const router = Router();

router.get('/health', getHealth);
router.get('/server/info', getServerInfo);
router.get('/server/status', getServerStatus);
router.patch('/server/storage', updateStorageDirHandler);
router.post('/server/shutdown', shutdownServerHandler);

export default router;
