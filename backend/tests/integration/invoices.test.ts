import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { withMutationGuards } from '../helpers/mutation-guard.helper';
import app from '@/app';
import { createUserAndGetCookies, createSecondUserAndGetCookies } from '../helpers/auth.helper';

vi.mock('@/services/email.service', () => ({
  sendQuoteEmail: vi.fn().mockResolvedValue(undefined),
  sendInvoiceEmail: vi.fn().mockResolvedValue(undefined),
}));

import * as emailService from '@/services/email.service';

const CLIENTS_URL = '/api/v1/clients';
const SERVICES_URL = '/api/v1/services';
const INVOICES_URL = '/api/v1/invoices';

const validClient = {
  nombre: 'Empresa Factura SL',
  email: 'factura@empresa.com',
  cif_nif: 'B99999999',
  direccion: 'Calle Factura 5, Madrid',
};

const validService = {
  nombre: 'Diseño web',
  precio_base: 200.0,
  iva_porcentaje: 21,
};

const buildInvoicePayload = (clientId: string, serviceId: string) => ({
  client_id: clientId,
  fecha_emision: '2026-01-20',
  lines: [
    {
      service_id: serviceId,
      descripcion: 'Diseño web completo',
      cantidad: 1,
      precio_unitario: 200.0,
      iva_porcentaje: 21,
    },
  ],
});

describe('GET /api/v1/invoices', () => {
  let cookies: string[];

  beforeEach(async () => {
    cookies = await createUserAndGetCookies();
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app).get(INVOICES_URL);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should return 200 with empty array when no invoices exist', async () => {
    const response = await request(app)
      .get(INVOICES_URL)
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(0);
  });

  it('should return 400 when estado query param is invalid', async () => {
    const response = await request(app)
      .get(`${INVOICES_URL}?estado=no-existe`)
      .set('Cookie', cookies);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should filter invoices by estado query param', async () => {
    const clientRes = await withMutationGuards(request(app)
      .post(CLIENTS_URL))
      .set('Cookie', cookies)
      .send(validClient);
    const serviceRes = await withMutationGuards(request(app)
      .post(SERVICES_URL))
      .set('Cookie', cookies)
      .send(validService);

    const clientId = clientRes.body.data.id;
    const serviceId = serviceRes.body.data.id;

    const inv1Res = await withMutationGuards(request(app)
      .post(INVOICES_URL))
      .set('Cookie', cookies)
      .send(buildInvoicePayload(clientId, serviceId));

    await withMutationGuards(request(app)
      .post(INVOICES_URL))
      .set('Cookie', cookies)
      .send(buildInvoicePayload(clientId, serviceId));

    // Send only the first invoice
    await withMutationGuards(request(app)
      .patch(`${INVOICES_URL}/${inv1Res.body.data.id}/send`))
      .set('Cookie', cookies);

    const response = await request(app)
      .get(`${INVOICES_URL}?estado=enviada`)
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].estado).toBe('enviada');
  });
});

describe('POST /api/v1/invoices', () => {
  let cookies: string[];
  let clientId: string;
  let serviceId: string;

  beforeEach(async () => {
    cookies = await createUserAndGetCookies();

    const clientRes = await withMutationGuards(request(app)
      .post(CLIENTS_URL))
      .set('Cookie', cookies)
      .send(validClient);
    clientId = clientRes.body.data.id;

    const serviceRes = await withMutationGuards(request(app)
      .post(SERVICES_URL))
      .set('Cookie', cookies)
      .send(validService);
    serviceId = serviceRes.body.data.id;
  });

  it('should return 401 without auth token', async () => {
    const response = await withMutationGuards(request(app).post(INVOICES_URL)).send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should create an invoice in borrador state with numero null', async () => {
    const response = await withMutationGuards(request(app)
      .post(INVOICES_URL))
      .set('Cookie', cookies)
      .send(buildInvoicePayload(clientId, serviceId));

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.estado).toBe('borrador');
    expect(response.body.data.numero).toBeNull();
    expect(Number(response.body.data.subtotal)).toBe(200);
    expect(Number(response.body.data.total_iva)).toBeCloseTo(42, 1);
    expect(Number(response.body.data.total)).toBeCloseTo(242, 1);
  });

  it('should return 400 when required fields are missing', async () => {
    const response = await withMutationGuards(request(app)
      .post(INVOICES_URL))
      .set('Cookie', cookies)
      .send({ client_id: clientId });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when lines array is empty', async () => {
    const response = await withMutationGuards(request(app)
      .post(INVOICES_URL))
      .set('Cookie', cookies)
      .send({ client_id: clientId, fecha_emision: '2026-01-20', lines: [] });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 when client_id belongs to another user', async () => {
    const otherCookies = await createSecondUserAndGetCookies();
    const otherClientRes = await withMutationGuards(request(app)
      .post(CLIENTS_URL))
      .set('Cookie', otherCookies)
      .send({
        nombre: 'Empresa Otra',
        email: 'cliente-otro-usuario@test.com',
        cif_nif: 'B11111111',
        direccion: 'Calle Otra 1',
      });
    expect(otherClientRes.status).toBe(201);

    const response = await withMutationGuards(request(app)
      .post(INVOICES_URL))
      .set('Cookie', cookies)
      .send(buildInvoicePayload(otherClientRes.body.data.id, serviceId));

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 404 when service_id belongs to another user', async () => {
    const otherCookies = await createSecondUserAndGetCookies();
    const otherServiceRes = await withMutationGuards(request(app)
      .post(SERVICES_URL))
      .set('Cookie', otherCookies)
      .send({
        nombre: 'Servicio otro usuario',
        precio_base: 50,
        iva_porcentaje: 21,
      });
    expect(otherServiceRes.status).toBe(201);

    const response = await withMutationGuards(request(app)
      .post(INVOICES_URL))
      .set('Cookie', cookies)
      .send(buildInvoicePayload(clientId, otherServiceRes.body.data.id));

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

describe('PUT /api/v1/invoices/:id', () => {
  let cookies: string[];
  let clientId: string;
  let serviceId: string;
  let invoiceId: string;

  const basePayload = (cId: string, sId: string) => ({
    client_id: cId,
    fecha_emision: '2026-01-20',
    lines: [
      { service_id: sId, descripcion: 'Servicio original', cantidad: 1, precio_unitario: 200, iva_porcentaje: 21 },
    ],
  });

  beforeEach(async () => {
    cookies = await createUserAndGetCookies();

    const clientRes = await withMutationGuards(request(app)
      .post(CLIENTS_URL))
      .set('Cookie', cookies)
      .send(validClient);
    clientId = clientRes.body.data.id;

    const serviceRes = await withMutationGuards(request(app)
      .post(SERVICES_URL))
      .set('Cookie', cookies)
      .send(validService);
    serviceId = serviceRes.body.data.id;

    const invRes = await withMutationGuards(request(app)
      .post(INVOICES_URL))
      .set('Cookie', cookies)
      .send(basePayload(clientId, serviceId));
    invoiceId = invRes.body.data.id;
  });

  it('should return 401 without auth token', async () => {
    const response = await withMutationGuards(request(app)
      .put(`${INVOICES_URL}/${invoiceId}`))
      .send(basePayload(clientId, serviceId));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should update a borrador invoice and return 200 with new data', async () => {
    const updatedPayload = {
      client_id: clientId,
      fecha_emision: '2026-07-01',
      notas: 'Nota actualizada',
      lines: [
        { service_id: serviceId, descripcion: 'Servicio actualizado', cantidad: 2, precio_unitario: 300, iva_porcentaje: 10 },
      ],
    };

    const response = await withMutationGuards(request(app)
      .put(`${INVOICES_URL}/${invoiceId}`))
      .set('Cookie', cookies)
      .send(updatedPayload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.notas).toBe('Nota actualizada');
    expect(Number(response.body.data.subtotal)).toBe(600);
    expect(Number(response.body.data.total_iva)).toBeCloseTo(60, 1);
    expect(Number(response.body.data.total)).toBeCloseTo(660, 1);
    expect(response.body.data.lines).toHaveLength(1);
    expect(response.body.data.lines[0].descripcion).toBe('Servicio actualizado');
  });

  it('should replace all lines on update (old lines are removed)', async () => {
    const updatedPayload = {
      client_id: clientId,
      fecha_emision: '2026-07-01',
      lines: [
        { descripcion: 'Nueva línea A', cantidad: 1, precio_unitario: 100, iva_porcentaje: 21 },
        { descripcion: 'Nueva línea B', cantidad: 2, precio_unitario: 150, iva_porcentaje: 21 },
      ],
    };

    const response = await withMutationGuards(request(app)
      .put(`${INVOICES_URL}/${invoiceId}`))
      .set('Cookie', cookies)
      .send(updatedPayload);

    expect(response.status).toBe(200);
    expect(response.body.data.lines).toHaveLength(2);
    const descriptions = response.body.data.lines.map((l: { descripcion: string }) => l.descripcion);
    expect(descriptions).toContain('Nueva línea A');
    expect(descriptions).toContain('Nueva línea B');
  });

  it('should return 400 when validation fails', async () => {
    const response = await withMutationGuards(request(app)
      .put(`${INVOICES_URL}/${invoiceId}`))
      .set('Cookie', cookies)
      .send({ client_id: clientId });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 for non-existent invoice', async () => {
    const response = await withMutationGuards(request(app)
      .put(`${INVOICES_URL}/00000000-0000-0000-0000-000000000000`))
      .set('Cookie', cookies)
      .send(basePayload(clientId, serviceId));

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 409 ALREADY_SENT when trying to update an enviada invoice', async () => {
    await withMutationGuards(request(app)
      .patch(`${INVOICES_URL}/${invoiceId}/send`))
      .set('Cookie', cookies);

    const response = await withMutationGuards(request(app)
      .put(`${INVOICES_URL}/${invoiceId}`))
      .set('Cookie', cookies)
      .send(basePayload(clientId, serviceId));

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('ALREADY_SENT');
  });
});

describe('DELETE /api/v1/invoices/:id', () => {
  let cookies: string[];
  let clientId: string;
  let serviceId: string;
  let invoiceId: string;

  beforeEach(async () => {
    cookies = await createUserAndGetCookies();

    const clientRes = await withMutationGuards(request(app)
      .post(CLIENTS_URL))
      .set('Cookie', cookies)
      .send(validClient);
    clientId = clientRes.body.data.id;

    const serviceRes = await withMutationGuards(request(app)
      .post(SERVICES_URL))
      .set('Cookie', cookies)
      .send(validService);
    serviceId = serviceRes.body.data.id;

    const invRes = await withMutationGuards(request(app)
      .post(INVOICES_URL))
      .set('Cookie', cookies)
      .send(buildInvoicePayload(clientId, serviceId));
    invoiceId = invRes.body.data.id;
  });

  it('should return 401 without auth token', async () => {
    const response = await withMutationGuards(request(app).delete(`${INVOICES_URL}/${invoiceId}`));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should delete a borrador invoice and return 200', async () => {
    const response = await withMutationGuards(request(app)
      .delete(`${INVOICES_URL}/${invoiceId}`))
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const listResponse = await request(app)
      .get(INVOICES_URL)
      .set('Cookie', cookies);
    expect(listResponse.body.data).toHaveLength(0);
  });

  it('should return 404 for non-existent invoice', async () => {
    const response = await withMutationGuards(request(app)
      .delete(`${INVOICES_URL}/00000000-0000-0000-0000-000000000000`))
      .set('Cookie', cookies);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 409 ALREADY_SENT when trying to delete an enviada invoice', async () => {
    await withMutationGuards(request(app)
      .patch(`${INVOICES_URL}/${invoiceId}/send`))
      .set('Cookie', cookies);

    const response = await withMutationGuards(request(app)
      .delete(`${INVOICES_URL}/${invoiceId}`))
      .set('Cookie', cookies);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('ALREADY_SENT');
  });
});

describe('PATCH /api/v1/invoices/:id/send', () => {
  let cookies: string[];
  let clientId: string;
  let serviceId: string;

  beforeEach(async () => {
    cookies = await createUserAndGetCookies();

    const clientRes = await withMutationGuards(request(app)
      .post(CLIENTS_URL))
      .set('Cookie', cookies)
      .send(validClient);
    clientId = clientRes.body.data.id;

    const serviceRes = await withMutationGuards(request(app)
      .post(SERVICES_URL))
      .set('Cookie', cookies)
      .send(validService);
    serviceId = serviceRes.body.data.id;
  });

  it('should return 401 without auth token', async () => {
    const response = await withMutationGuards(request(app).patch(`${INVOICES_URL}/some-id/send`));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should generate a numero and change estado to enviada', async () => {
    const createRes = await withMutationGuards(request(app)
      .post(INVOICES_URL))
      .set('Cookie', cookies)
      .send(buildInvoicePayload(clientId, serviceId));
    const invoiceId = createRes.body.data.id;

    const sendInvoiceEmailSpy = vi.mocked(emailService.sendInvoiceEmail);
    sendInvoiceEmailSpy.mockClear();

    const response = await withMutationGuards(request(app)
      .patch(`${INVOICES_URL}/${invoiceId}/send`))
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.estado).toBe('enviada');
    expect(response.body.data.numero).toMatch(/^\d{4}\/\d{3}$/);
    expect(sendInvoiceEmailSpy).toHaveBeenCalledOnce();
    expect(sendInvoiceEmailSpy.mock.calls[0][0].client.email).toBe(validClient.email);
  });

  it('should generate correlative numbers (YYYY/001, YYYY/002)', async () => {
    const year = new Date().getFullYear();

    const inv1Res = await withMutationGuards(request(app)
      .post(INVOICES_URL))
      .set('Cookie', cookies)
      .send(buildInvoicePayload(clientId, serviceId));

    const inv2Res = await withMutationGuards(request(app)
      .post(INVOICES_URL))
      .set('Cookie', cookies)
      .send(buildInvoicePayload(clientId, serviceId));

    await withMutationGuards(request(app)
      .patch(`${INVOICES_URL}/${inv1Res.body.data.id}/send`))
      .set('Cookie', cookies);

    const sendRes2 = await withMutationGuards(request(app)
      .patch(`${INVOICES_URL}/${inv2Res.body.data.id}/send`))
      .set('Cookie', cookies);

    expect(sendRes2.body.data.numero).toBe(`${year}/002`);
  });

  it('should return 409 ALREADY_SENT if invoice is already enviada', async () => {
    const createRes = await withMutationGuards(request(app)
      .post(INVOICES_URL))
      .set('Cookie', cookies)
      .send(buildInvoicePayload(clientId, serviceId));
    const invoiceId = createRes.body.data.id;

    await withMutationGuards(request(app)
      .patch(`${INVOICES_URL}/${invoiceId}/send`))
      .set('Cookie', cookies);

    const response = await withMutationGuards(request(app)
      .patch(`${INVOICES_URL}/${invoiceId}/send`))
      .set('Cookie', cookies);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('ALREADY_SENT');
  });

  it('should return 404 for non-existent invoice', async () => {
    const response = await withMutationGuards(request(app)
      .patch(`${INVOICES_URL}/00000000-0000-0000-0000-000000000000/send`))
      .set('Cookie', cookies);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/v1/invoices/:id/copy', () => {
  let cookies: string[];
  let clientId: string;
  let serviceId: string;
  let invoiceId: string;

  const buildPayloadWithNotes = () => ({
    client_id: clientId,
    fecha_emision: '2026-02-10',
    notas: 'Factura de prueba copia',
    lines: [
      {
        service_id: serviceId,
        descripcion: 'Servicio principal',
        cantidad: 2,
        precio_unitario: 150.0,
        iva_porcentaje: 21,
      },
    ],
  });

  beforeEach(async () => {
    cookies = await createUserAndGetCookies();

    const clientRes = await withMutationGuards(request(app)
      .post(CLIENTS_URL))
      .set('Cookie', cookies)
      .send(validClient);
    clientId = clientRes.body.data.id;

    const serviceRes = await withMutationGuards(request(app)
      .post(SERVICES_URL))
      .set('Cookie', cookies)
      .send(validService);
    serviceId = serviceRes.body.data.id;

    const invoiceRes = await withMutationGuards(request(app)
      .post(INVOICES_URL))
      .set('Cookie', cookies)
      .send(buildPayloadWithNotes());
    invoiceId = invoiceRes.body.data.id;
  });

  it('should return 401 without auth token', async () => {
    const response = await withMutationGuards(request(app).post(`${INVOICES_URL}/${invoiceId}/copy`));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should copy a borrador invoice and return 201 with a new borrador invoice', async () => {
    const response = await withMutationGuards(request(app)
      .post(`${INVOICES_URL}/${invoiceId}/copy`))
      .set('Cookie', cookies);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    const copy = response.body.data;
    expect(copy.id).not.toBe(invoiceId);
    expect(copy.estado).toBe('borrador');
    expect(copy.client_id).toBe(clientId);
    expect(copy.notas).toBe('Factura de prueba copia');
    expect(copy.numero).toBeNull();
    expect(copy.lines).toHaveLength(1);
    expect(copy.lines[0].descripcion).toBe('Servicio principal');
    expect(Number(copy.subtotal)).toBe(300);
    expect(Number(copy.total)).toBeCloseTo(363, 1);

    const listRes = await request(app).get(INVOICES_URL).set('Cookie', cookies);
    expect(listRes.body.data).toHaveLength(2);
  });

  it('should copy an enviada invoice and return 201 with a new borrador invoice', async () => {
    await withMutationGuards(request(app)
      .patch(`${INVOICES_URL}/${invoiceId}/send`))
      .set('Cookie', cookies);

    const response = await withMutationGuards(request(app)
      .post(`${INVOICES_URL}/${invoiceId}/copy`))
      .set('Cookie', cookies);

    expect(response.status).toBe(201);
    expect(response.body.data.estado).toBe('borrador');
    expect(response.body.data.id).not.toBe(invoiceId);
    expect(response.body.data.notas).toBe('Factura de prueba copia');
    expect(response.body.data.lines).toHaveLength(1);

    const listRes = await request(app).get(INVOICES_URL).set('Cookie', cookies);
    expect(listRes.body.data).toHaveLength(2);
  });

  it('should return 404 for non-existent invoice', async () => {
    const response = await withMutationGuards(request(app)
      .post(`${INVOICES_URL}/00000000-0000-0000-0000-000000000000/copy`))
      .set('Cookie', cookies);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
