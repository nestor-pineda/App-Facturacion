import { z } from 'zod';

export const patchSendBodySchema = z.object({
  confirmationToken: z.string().min(1, 'confirmationToken es requerido'),
});
