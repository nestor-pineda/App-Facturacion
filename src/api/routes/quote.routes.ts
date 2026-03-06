import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as quoteController from '../controllers/quote.controller';

const router = Router();

router.use(authenticate);

router.get('/', quoteController.list);
router.post('/', quoteController.create);
router.put('/:id', quoteController.update);
router.delete('/:id', quoteController.remove);
router.patch('/:id/send', quoteController.send);

export default router;
