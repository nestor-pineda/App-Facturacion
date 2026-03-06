import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as invoiceController from '../controllers/invoice.controller';
import * as pdfController from '../controllers/pdf.controller';

const router = Router();

router.use(authenticate);

router.get('/', invoiceController.list);
router.post('/', invoiceController.create);
router.put('/:id', invoiceController.update);
router.delete('/:id', invoiceController.remove);
router.patch('/:id/send', invoiceController.send);
router.get('/:id/pdf', pdfController.generateInvoicePDF);

export default router;
