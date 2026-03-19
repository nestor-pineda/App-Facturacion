import { Router } from 'express';
import { authenticate } from '@/api/middlewares/auth.middleware';
import * as quoteController from '@/api/controllers/quote.controller';
import * as pdfController from '@/api/controllers/pdf.controller';

const router = Router();

router.use(authenticate);

router.get('/', quoteController.list);
router.post('/', quoteController.create);
router.put('/:id', quoteController.update);
router.delete('/:id', quoteController.remove);
router.patch('/:id/send', quoteController.send);
router.post('/:id/resend', quoteController.resend);
router.post('/:id/copy', quoteController.copy);
router.post('/:id/convert', quoteController.convert);
router.get('/:id/pdf', pdfController.generateQuotePDF);

export default router;
