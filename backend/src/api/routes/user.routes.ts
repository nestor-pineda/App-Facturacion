import { Router } from 'express';
import { authenticate } from '@/api/middlewares/auth.middleware';
import * as userController from '@/api/controllers/user.controller';

const router = Router();

router.use(authenticate);
router.patch('/me', userController.updateCurrentUser);

export default router;
