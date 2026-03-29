import { Request, Response } from 'express';
import { createInvoiceSchema, updateInvoiceSchema } from '@/api/schemas/document.schema';
import * as invoiceService from '@/services/invoice.service';

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_SENT: 'ALREADY_SENT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const list = async (req: Request, res: Response) => {
  const { estado, client_id, desde, hasta } = req.query as Record<string, string | undefined>;

  try {
    const invoices = await invoiceService.list(req.user!.id, {
      estado: estado as invoiceService.InvoiceFilters['estado'],
      client_id,
      desde,
      hasta,
    });
    return res.status(200).json({ success: true, data: invoices });
  } catch {
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const create = async (req: Request, res: Response) => {
  const parsed = createInvoiceSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Datos de entrada inválidos',
        code: ERROR_CODES.VALIDATION_ERROR,
        details: parsed.error.flatten(),
      },
    });
  }

  try {
    const invoice = await invoiceService.create(req.user!.id, parsed.data);
    return res.status(201).json({ success: true, data: invoice });
  } catch {
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const update = async (req: Request, res: Response) => {
  const parsed = updateInvoiceSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Datos de entrada inválidos',
        code: ERROR_CODES.VALIDATION_ERROR,
        details: parsed.error.flatten(),
      },
    });
  }

  try {
    const invoice = await invoiceService.update(req.user!.id, req.params.id as string, parsed.data);
    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === invoiceService.INVOICE_NOT_FOUND) {
        return res.status(404).json({
          success: false,
          error: { message: 'Factura no encontrada', code: ERROR_CODES.NOT_FOUND },
        });
      }

      if (error.message === invoiceService.ALREADY_SENT) {
        return res.status(409).json({
          success: false,
          error: { message: 'La factura ya fue enviada y no puede modificarse', code: ERROR_CODES.ALREADY_SENT },
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await invoiceService.remove(req.user!.id, req.params.id as string);
    return res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === invoiceService.INVOICE_NOT_FOUND) {
        return res.status(404).json({
          success: false,
          error: { message: 'Factura no encontrada', code: ERROR_CODES.NOT_FOUND },
        });
      }

      if (error.message === invoiceService.ALREADY_SENT) {
        return res.status(409).json({
          success: false,
          error: { message: 'La factura ya fue enviada y no puede eliminarse', code: ERROR_CODES.ALREADY_SENT },
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const send = async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.send(req.user!.id, req.params.id as string);
    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === invoiceService.INVOICE_NOT_FOUND) {
        return res.status(404).json({
          success: false,
          error: { message: 'Factura no encontrada', code: ERROR_CODES.NOT_FOUND },
        });
      }

      if (error.message === invoiceService.ALREADY_SENT) {
        return res.status(409).json({
          success: false,
          error: { message: 'Factura ya enviada', code: ERROR_CODES.ALREADY_SENT },
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const resend = async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.resendInvoiceEmail(req.user!.id, req.params.id as string);
    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    if (error instanceof Error && error.message === invoiceService.INVOICE_NOT_FOUND) {
      return res.status(404).json({
        success: false,
        error: { message: 'Factura no encontrada', code: ERROR_CODES.NOT_FOUND },
      });
    }
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const copy = async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.copyInvoice(req.user!.id, req.params.id as string);
    return res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === invoiceService.INVOICE_NOT_FOUND) {
        return res.status(404).json({
          success: false,
          error: { message: 'Factura no encontrada', code: ERROR_CODES.NOT_FOUND },
        });
      }
    }
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};
