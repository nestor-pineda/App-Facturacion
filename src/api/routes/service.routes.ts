import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as serviceController from '../controllers/service.controller';

const router = Router();

router.use(authenticate);

router.get('/', serviceController.list);
router.post('/', serviceController.create);

export default router;
