import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as quoteController from '../controllers/quote.controller';

const router = Router();

router.use(authenticate);

router.get('/', quoteController.list);
router.post('/', quoteController.create);
router.patch('/:id/send', quoteController.send);

export default router;
