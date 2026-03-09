import { Router } from 'express';
import { authenticate } from '@/api/middlewares/auth.middleware';
import * as serviceController from '@/api/controllers/service.controller';

const router = Router();

router.use(authenticate);

router.get('/', serviceController.list);
router.post('/', serviceController.create);

export default router;
