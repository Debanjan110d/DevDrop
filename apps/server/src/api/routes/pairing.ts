import { Router } from 'express';
import { createSession, completePairing } from '../controllers/pairing.controller.js';
import { pairingRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/pairing/sessions', pairingRateLimiter, createSession);
router.post('/pair', pairingRateLimiter, completePairing);

export default router;
