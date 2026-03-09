import { Router } from 'express';
import { authenticate } from '@/api/middlewares/auth.middleware';
import * as clientController from '@/api/controllers/client.controller';

const router = Router();

router.use(authenticate);

router.get('/', clientController.list);
router.post('/', clientController.create);
router.put('/:id', clientController.update);

export default router;
