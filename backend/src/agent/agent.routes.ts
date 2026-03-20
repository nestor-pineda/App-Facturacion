import { Router } from 'express';
import { authenticate } from '@/api/middlewares/auth.middleware';
import { agentChat } from '@/agent/agent.controller';

const router = Router();

router.use(authenticate);
router.post('/chat', agentChat);

export default router;
