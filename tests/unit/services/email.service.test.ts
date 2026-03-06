import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/config/env', () => ({
  env: {
    SMTP_HOST: 'smtp.mailtrap.io',
    SMTP_PORT: 2525,
    SMTP_USER: 'test-user',
    SMTP_PASS: 'test-pass',
    SMTP_FROM: 'Test <test@example.com>',
    NODE_ENV: 'test',
  },
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

import nodemailer from 'nodemailer';
import * as emailService from '../../../src/services/email.service';

const baseQuoteData: emailService.QuoteEmailData = {
  client: { nombre: 'Empresa Test SL', email: 'cliente@empresa.com' },
  user: { nombre_comercial: 'Freelancer SA', nif: '12345678A' },
  quote: {
    fecha: new Date('2026-03-01'),
    notas: 'Pago a 30 días',
    subtotal: 1000,
    total_iva: 210,
    total: 1210,
    lines: [
      {
        descripcion: 'Consultoría web',
        cantidad: 5,
        precio_unitario: 200,
        iva_porcentaje: 21,
        subtotal: 1000,
      },
    ],
  },
};

const baseInvoiceData: emailService.InvoiceEmailData = {
  client: { nombre: 'Empresa Test SL', email: 'cliente@empresa.com' },
  user: { nombre_comercial: 'Freelancer SA', nif: '12345678A' },
  invoice: {
    numero: '2026/001',
    fecha_emision: new Date('2026-03-01'),
    notas: 'Pago a 30 días',
    subtotal: 1000,
    total_iva: 210,
    total: 1210,
    lines: [
      {
        descripcion: 'Consultoría web',
        cantidad: 5,
        precio_unitario: 200,
        iva_porcentaje: 21,
        subtotal: 1000,
      },
    ],
  },
};

describe('email.service', () => {
  const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });

  beforeEach(() => {
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: mockSendMail } as never);
    mockSendMail.mockClear();
    vi.mocked(nodemailer.createTransport).mockClear();
  });

  describe('sendQuoteEmail', () => {
    it('should call sendMail with client email as recipient', async () => {
      await emailService.sendQuoteEmail(baseQuoteData);

      expect(mockSendMail).toHaveBeenCalledOnce();
      const callArg = mockSendMail.mock.calls[0][0];
      expect(callArg.to).toBe('cliente@empresa.com');
    });

    it('should set subject containing nombre_comercial', async () => {
      await emailService.sendQuoteEmail(baseQuoteData);

      const callArg = mockSendMail.mock.calls[0][0];
      expect(callArg.subject).toContain('Freelancer SA');
    });

    it('should include total amount in email html', async () => {
      await emailService.sendQuoteEmail(baseQuoteData);

      const callArg = mockSendMail.mock.calls[0][0];
      expect(callArg.html).toContain('1210');
    });

    it('should include client name in email html', async () => {
      await emailService.sendQuoteEmail(baseQuoteData);

      const callArg = mockSendMail.mock.calls[0][0];
      expect(callArg.html).toContain('Empresa Test SL');
    });

    it('should include line description in email html', async () => {
      await emailService.sendQuoteEmail(baseQuoteData);

      const callArg = mockSendMail.mock.calls[0][0];
      expect(callArg.html).toContain('Consultoría web');
    });

    it('should include notas when present', async () => {
      await emailService.sendQuoteEmail(baseQuoteData);

      const callArg = mockSendMail.mock.calls[0][0];
      expect(callArg.html).toContain('Pago a 30 días');
    });
  });

  describe('sendInvoiceEmail', () => {
    it('should call sendMail with client email as recipient', async () => {
      await emailService.sendInvoiceEmail(baseInvoiceData);

      expect(mockSendMail).toHaveBeenCalledOnce();
      const callArg = mockSendMail.mock.calls[0][0];
      expect(callArg.to).toBe('cliente@empresa.com');
    });

    it('should set subject containing invoice numero', async () => {
      await emailService.sendInvoiceEmail(baseInvoiceData);

      const callArg = mockSendMail.mock.calls[0][0];
      expect(callArg.subject).toContain('2026/001');
    });

    it('should include invoice numero in email html', async () => {
      await emailService.sendInvoiceEmail(baseInvoiceData);

      const callArg = mockSendMail.mock.calls[0][0];
      expect(callArg.html).toContain('2026/001');
    });

    it('should include total amount in email html', async () => {
      await emailService.sendInvoiceEmail(baseInvoiceData);

      const callArg = mockSendMail.mock.calls[0][0];
      expect(callArg.html).toContain('1210');
    });

    it('should include client name in email html', async () => {
      await emailService.sendInvoiceEmail(baseInvoiceData);

      const callArg = mockSendMail.mock.calls[0][0];
      expect(callArg.html).toContain('Empresa Test SL');
    });
  });
});

describe('email.service — no SMTP configured', () => {
  it('should not call sendMail and return undefined when SMTP_HOST is absent', async () => {
    vi.mocked(nodemailer.createTransport).mockReturnValue(null as never);

    const { sendQuoteEmail } = await import('../../../src/services/email.service');
    await expect(sendQuoteEmail(baseQuoteData)).resolves.toBeUndefined();
  });
});

describe('email.service — SMTP_HOST set without credentials', () => {
  it('should not include auth in createTransport options when SMTP_USER and SMTP_PASS are absent', async () => {
    const { env } = await import('../../../src/config/env');
    const originalUser = (env as Record<string, unknown>).SMTP_USER;
    const originalPass = (env as Record<string, unknown>).SMTP_PASS;
    (env as Record<string, unknown>).SMTP_USER = undefined;
    (env as Record<string, unknown>).SMTP_PASS = undefined;

    const mockSendMailNoAuth = vi.fn().mockResolvedValue({ messageId: 'no-auth-id' });
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: mockSendMailNoAuth } as never);
    vi.mocked(nodemailer.createTransport).mockClear();

    await emailService.sendQuoteEmail(baseQuoteData);

    const callArg = vi.mocked(nodemailer.createTransport).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.auth).toBeUndefined();

    (env as Record<string, unknown>).SMTP_USER = originalUser;
    (env as Record<string, unknown>).SMTP_PASS = originalPass;
  });

  it('should include auth in createTransport options when both credentials are present', async () => {
    vi.mocked(nodemailer.createTransport).mockClear();
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: vi.fn().mockResolvedValue({}) } as never);

    await emailService.sendQuoteEmail(baseQuoteData);

    const callArg = vi.mocked(nodemailer.createTransport).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.auth).toEqual({ user: 'test-user', pass: 'test-pass' });
  });
});
