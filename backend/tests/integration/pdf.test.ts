import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { createUserAndGetToken, createSecondUserAndGetToken } from '../helpers/auth.helper';

vi.mock('@/services/email.service', () => ({
  sendInvoiceEmail: vi.fn().mockResolvedValue(undefined),
  sendQuoteEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/services/pdf.service', () => ({
  generatePDF: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.4 fake-pdf-content')),
}));

const CLIENTS_URL = '/api/v1/clients';
const SERVICES_URL = '/api/v1/services';
const INVOICES_URL = '/api/v1/invoices';
const QUOTES_URL = '/api/v1/quotes';

const validClient = {
  nombre: 'PDF Test Client SL',
  email: 'pdfclient@test.com',
  cif_nif: 'B11111111',
  direccion: 'Calle PDF 1, Madrid',
};

const validService = {
  nombre: 'Servicio PDF',
  precio_base: 500.0,
  iva_porcentaje: 21,
};

const buildInvoicePayload = (clientId: string, serviceId: string) => ({
  client_id: clientId,
  fecha_emision: '2026-03-06',
  lines: [
    {
      service_id: serviceId,
      descripcion: 'Servicio de desarrollo',
      cantidad: 1,
      precio_unitario: 500.0,
      iva_porcentaje: 21,
    },
  ],
});

const buildQuotePayload = (clientId: string, serviceId: string) => ({
  client_id: clientId,
  fecha: '2026-03-06',
  lines: [
    {
      service_id: serviceId,
      descripcion: 'Presupuesto de desarrollo',
      cantidad: 1,
      precio_unitario: 500.0,
      iva_porcentaje: 21,
    },
  ],
});

describe('PDF endpoints', () => {
  let token: string;
  let clientId: string;
  let serviceId: string;

  beforeEach(async () => {
    token = await createUserAndGetToken();

    const clientRes = await request(app)
      .post(CLIENTS_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(validClient);
    clientId = clientRes.body.data.id;

    const serviceRes = await request(app)
      .post(SERVICES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(validService);
    serviceId = serviceRes.body.data.id;
  });

  describe('GET /api/v1/invoices/:id/pdf', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app).get(`${INVOICES_URL}/some-id/pdf`);

      expect(response.status).toBe(401);
    });

    it('should return 422 INVOICE_DRAFT for a borrador invoice', async () => {
      const createRes = await request(app)
        .post(INVOICES_URL)
        .set('Authorization', `Bearer ${token}`)
        .send(buildInvoicePayload(clientId, serviceId));
      const invoiceId = createRes.body.data.id;

      const response = await request(app)
        .get(`${INVOICES_URL}/${invoiceId}/pdf`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVOICE_DRAFT');
    });

    it('should return 404 for an invoice belonging to another user', async () => {
      const createRes = await request(app)
        .post(INVOICES_URL)
        .set('Authorization', `Bearer ${token}`)
        .send(buildInvoicePayload(clientId, serviceId));
      const invoiceId = createRes.body.data.id;

      await request(app)
        .patch(`${INVOICES_URL}/${invoiceId}/send`)
        .set('Authorization', `Bearer ${token}`);

      const otherToken = await createSecondUserAndGetToken();
      const response = await request(app)
        .get(`${INVOICES_URL}/${invoiceId}/pdf`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 200 with PDF buffer for a sent invoice', async () => {
      const createRes = await request(app)
        .post(INVOICES_URL)
        .set('Authorization', `Bearer ${token}`)
        .send(buildInvoicePayload(clientId, serviceId));
      const invoiceId = createRes.body.data.id;

      await request(app)
        .patch(`${INVOICES_URL}/${invoiceId}/send`)
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app)
        .get(`${INVOICES_URL}/${invoiceId}/pdf`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should set Content-Type to application/pdf for sent invoice', async () => {
      const createRes = await request(app)
        .post(INVOICES_URL)
        .set('Authorization', `Bearer ${token}`)
        .send(buildInvoicePayload(clientId, serviceId));
      const invoiceId = createRes.body.data.id;

      await request(app)
        .patch(`${INVOICES_URL}/${invoiceId}/send`)
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app)
        .get(`${INVOICES_URL}/${invoiceId}/pdf`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.headers['content-type']).toContain('application/pdf');
    });

    it('should set Content-Disposition attachment with filename for sent invoice', async () => {
      const createRes = await request(app)
        .post(INVOICES_URL)
        .set('Authorization', `Bearer ${token}`)
        .send(buildInvoicePayload(clientId, serviceId));
      const invoiceId = createRes.body.data.id;

      await request(app)
        .patch(`${INVOICES_URL}/${invoiceId}/send`)
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app)
        .get(`${INVOICES_URL}/${invoiceId}/pdf`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.headers['content-disposition']).toMatch(/attachment/);
      expect(response.headers['content-disposition']).toMatch(/factura-.*\.pdf/);
    });

    it('should return 404 for non-existent invoice id', async () => {
      const response = await request(app)
        .get(`${INVOICES_URL}/00000000-0000-0000-0000-000000000000/pdf`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/quotes/:id/pdf', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app).get(`${QUOTES_URL}/some-id/pdf`);

      expect(response.status).toBe(401);
    });

    it('should return 200 for a borrador quote', async () => {
      const createRes = await request(app)
        .post(QUOTES_URL)
        .set('Authorization', `Bearer ${token}`)
        .send(buildQuotePayload(clientId, serviceId));
      const quoteId = createRes.body.data.id;

      const response = await request(app)
        .get(`${QUOTES_URL}/${quoteId}/pdf`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should return 200 for an enviado quote', async () => {
      const createRes = await request(app)
        .post(QUOTES_URL)
        .set('Authorization', `Bearer ${token}`)
        .send(buildQuotePayload(clientId, serviceId));
      const quoteId = createRes.body.data.id;

      await request(app)
        .patch(`${QUOTES_URL}/${quoteId}/send`)
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app)
        .get(`${QUOTES_URL}/${quoteId}/pdf`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should set Content-Type to application/pdf for quote', async () => {
      const createRes = await request(app)
        .post(QUOTES_URL)
        .set('Authorization', `Bearer ${token}`)
        .send(buildQuotePayload(clientId, serviceId));
      const quoteId = createRes.body.data.id;

      const response = await request(app)
        .get(`${QUOTES_URL}/${quoteId}/pdf`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.headers['content-type']).toContain('application/pdf');
    });

    it('should set Content-Disposition attachment with filename for borrador quote', async () => {
      const createRes = await request(app)
        .post(QUOTES_URL)
        .set('Authorization', `Bearer ${token}`)
        .send(buildQuotePayload(clientId, serviceId));
      const quoteId = createRes.body.data.id;

      const response = await request(app)
        .get(`${QUOTES_URL}/${quoteId}/pdf`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.headers['content-disposition']).toMatch(/attachment/);
      expect(response.headers['content-disposition']).toMatch(/presupuesto-.*\.pdf/);
    });

    it('should return 404 for quote belonging to another user', async () => {
      const createRes = await request(app)
        .post(QUOTES_URL)
        .set('Authorization', `Bearer ${token}`)
        .send(buildQuotePayload(clientId, serviceId));
      const quoteId = createRes.body.data.id;

      const otherToken = await createSecondUserAndGetToken();
      const response = await request(app)
        .get(`${QUOTES_URL}/${quoteId}/pdf`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent quote id', async () => {
      const response = await request(app)
        .get(`${QUOTES_URL}/00000000-0000-0000-0000-000000000000/pdf`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
