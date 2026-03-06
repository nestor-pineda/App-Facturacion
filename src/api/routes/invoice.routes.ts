import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as invoiceController from '../controllers/invoice.controller';

const router = Router();

router.use(authenticate);

router.get('/', invoiceController.list);
router.post('/', invoiceController.create);
router.put('/:id', invoiceController.update);
router.delete('/:id', invoiceController.remove);
router.patch('/:id/send', invoiceController.send);

export default router;
