import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { createUserAndGetToken } from '../helpers/auth.helper';

vi.mock('../../src/services/email.service', () => ({
  sendQuoteEmail: vi.fn().mockResolvedValue(undefined),
  sendInvoiceEmail: vi.fn().mockResolvedValue(undefined),
}));

import * as emailService from '../../src/services/email.service';

const CLIENTS_URL = '/api/v1/clients';
const SERVICES_URL = '/api/v1/services';
const QUOTES_URL = '/api/v1/quotes';

const validClient = {
  nombre: 'Empresa Test SL',
  email: 'empresa@test.com',
  cif_nif: 'B12345678',
  direccion: 'Calle Test 1, Madrid',
};

const validService = {
  nombre: 'Consultoría',
  precio_base: 100.0,
  iva_porcentaje: 21,
};

describe('POST /api/v1/quotes', () => {
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

  it('should return 401 without auth token', async () => {
    const response = await request(app).post(QUOTES_URL).send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should create a quote in borrador state and return 201', async () => {
    const response = await request(app)
      .post(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({
        client_id: clientId,
        fecha: '2026-01-15',
        lines: [
          {
            service_id: serviceId,
            descripcion: 'Consultoría técnica',
            cantidad: 2,
            precio_unitario: 100.0,
            iva_porcentaje: 21,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.estado).toBe('borrador');
    expect(response.body.data.lines).toHaveLength(1);
    expect(Number(response.body.data.subtotal)).toBe(200);
    expect(Number(response.body.data.total_iva)).toBeCloseTo(42, 1);
    expect(Number(response.body.data.total)).toBeCloseTo(242, 1);
  });

  it('should store snapshot data on lines (not live service data)', async () => {
    const response = await request(app)
      .post(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({
        client_id: clientId,
        fecha: '2026-01-15',
        lines: [
          {
            service_id: serviceId,
            descripcion: 'Descripción snapshot',
            cantidad: 1,
            precio_unitario: 50.0,
            iva_porcentaje: 10,
          },
        ],
      });

    expect(response.status).toBe(201);
    const line = response.body.data.lines[0];
    expect(line.descripcion).toBe('Descripción snapshot');
    expect(Number(line.precio_unitario)).toBe(50);
    expect(Number(line.iva_porcentaje)).toBe(10);
  });

  it('should return 400 when required fields are missing', async () => {
    const response = await request(app)
      .post(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ client_id: clientId });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when lines array is empty', async () => {
    const response = await request(app)
      .post(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ client_id: clientId, fecha: '2026-01-15', lines: [] });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/quotes', () => {
  let token: string;

  beforeEach(async () => {
    token = await createUserAndGetToken();
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app).get(QUOTES_URL);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should return 200 with empty array when no quotes exist', async () => {
    const response = await request(app)
      .get(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(0);
  });

  it('should return only quotes belonging to the authenticated user', async () => {
    const { createSecondUserAndGetToken } = await import('../helpers/auth.helper');
    const otherToken = await createSecondUserAndGetToken();

    const clientRes = await request(app)
      .post(CLIENTS_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(validClient);
    const serviceRes = await request(app)
      .post(SERVICES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(validService);

    await request(app)
      .post(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({
        client_id: clientRes.body.data.id,
        fecha: '2026-01-15',
        lines: [{ service_id: serviceRes.body.data.id, descripcion: 'Test', cantidad: 1, precio_unitario: 100, iva_porcentaje: 21 }],
      });

    const response = await request(app)
      .get(QUOTES_URL)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
  });

  it('should filter quotes by estado query param', async () => {
    const clientRes = await request(app)
      .post(CLIENTS_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(validClient);
    const serviceRes = await request(app)
      .post(SERVICES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(validService);

    const clientId = clientRes.body.data.id;
    const serviceId = serviceRes.body.data.id;

    const quotePayload = {
      client_id: clientId,
      fecha: '2026-01-15',
      lines: [{ service_id: serviceId, descripcion: 'Test', cantidad: 1, precio_unitario: 100, iva_porcentaje: 21 }],
    };

    const q1Res = await request(app)
      .post(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(quotePayload);

    await request(app)
      .post(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(quotePayload);

    await request(app)
      .patch(`${QUOTES_URL}/${q1Res.body.data.id}/send`)
      .set('Authorization', `Bearer ${token}`);

    const response = await request(app)
      .get(`${QUOTES_URL}?estado=enviado`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].estado).toBe('enviado');
  });

  it('should filter quotes by client_id query param', async () => {
    const client1Res = await request(app)
      .post(CLIENTS_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(validClient);
    const client2Res = await request(app)
      .post(CLIENTS_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validClient, email: 'otro@cliente.com', cif_nif: 'B87654321' });
    const serviceRes = await request(app)
      .post(SERVICES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(validService);

    const linePayload = [{ service_id: serviceRes.body.data.id, descripcion: 'Test', cantidad: 1, precio_unitario: 100, iva_porcentaje: 21 }];

    await request(app)
      .post(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ client_id: client1Res.body.data.id, fecha: '2026-01-15', lines: linePayload });

    await request(app)
      .post(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ client_id: client2Res.body.data.id, fecha: '2026-01-15', lines: linePayload });

    const response = await request(app)
      .get(`${QUOTES_URL}?client_id=${client1Res.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].client_id).toBe(client1Res.body.data.id);
  });
});

describe('PUT /api/v1/quotes/:id', () => {
  let token: string;
  let clientId: string;
  let serviceId: string;
  let quoteId: string;

  const basePayload = () => ({
    client_id: clientId,
    fecha: '2026-01-15',
    lines: [
      { service_id: serviceId, descripcion: 'Servicio original', cantidad: 1, precio_unitario: 100, iva_porcentaje: 21 },
    ],
  });

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

    const quoteRes = await request(app)
      .post(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload());
    quoteId = quoteRes.body.data.id;
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app).put(`${QUOTES_URL}/${quoteId}`).send(basePayload());

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should update a borrador quote and return 200 with new data', async () => {
    const updatedPayload = {
      client_id: clientId,
      fecha: '2026-06-01',
      notas: 'Nota actualizada',
      lines: [
        { service_id: serviceId, descripcion: 'Servicio actualizado', cantidad: 3, precio_unitario: 200, iva_porcentaje: 10 },
      ],
    };

    const response = await request(app)
      .put(`${QUOTES_URL}/${quoteId}`)
      .set('Authorization', `Bearer ${token}`)
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
      fecha: '2026-06-01',
      lines: [
        { descripcion: 'Nueva línea A', cantidad: 1, precio_unitario: 50, iva_porcentaje: 21 },
        { descripcion: 'Nueva línea B', cantidad: 2, precio_unitario: 75, iva_porcentaje: 21 },
      ],
    };

    const response = await request(app)
      .put(`${QUOTES_URL}/${quoteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedPayload);

    expect(response.status).toBe(200);
    expect(response.body.data.lines).toHaveLength(2);
    const descriptions = response.body.data.lines.map((l: { descripcion: string }) => l.descripcion);
    expect(descriptions).toContain('Nueva línea A');
    expect(descriptions).toContain('Nueva línea B');
  });

  it('should return 400 when validation fails', async () => {
    const response = await request(app)
      .put(`${QUOTES_URL}/${quoteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ client_id: clientId });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 for non-existent quote', async () => {
    const response = await request(app)
      .put(`${QUOTES_URL}/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload());

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 409 ALREADY_SENT when trying to update an enviado quote', async () => {
    await request(app)
      .patch(`${QUOTES_URL}/${quoteId}/send`)
      .set('Authorization', `Bearer ${token}`);

    const response = await request(app)
      .put(`${QUOTES_URL}/${quoteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload());

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('ALREADY_SENT');
  });
});

describe('DELETE /api/v1/quotes/:id', () => {
  let token: string;
  let clientId: string;
  let serviceId: string;
  let quoteId: string;

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

    const quoteRes = await request(app)
      .post(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({
        client_id: clientId,
        fecha: '2026-01-15',
        lines: [{ service_id: serviceId, descripcion: 'Test', cantidad: 1, precio_unitario: 100, iva_porcentaje: 21 }],
      });
    quoteId = quoteRes.body.data.id;
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app).delete(`${QUOTES_URL}/${quoteId}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should delete a borrador quote and return 200', async () => {
    const response = await request(app)
      .delete(`${QUOTES_URL}/${quoteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const listResponse = await request(app)
      .get(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`);
    expect(listResponse.body.data).toHaveLength(0);
  });

  it('should return 404 for non-existent quote', async () => {
    const response = await request(app)
      .delete(`${QUOTES_URL}/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 409 ALREADY_SENT when trying to delete an enviado quote', async () => {
    await request(app)
      .patch(`${QUOTES_URL}/${quoteId}/send`)
      .set('Authorization', `Bearer ${token}`);

    const response = await request(app)
      .delete(`${QUOTES_URL}/${quoteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('ALREADY_SENT');
  });
});

describe('PATCH /api/v1/quotes/:id/send', () => {
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

  it('should return 401 without auth token', async () => {
    const response = await request(app).patch(`${QUOTES_URL}/some-id/send`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should mark a borrador quote as enviado and return 200', async () => {
    const createRes = await request(app)
      .post(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({
        client_id: clientId,
        fecha: '2026-01-15',
        lines: [{ service_id: serviceId, descripcion: 'Test', cantidad: 1, precio_unitario: 100, iva_porcentaje: 21 }],
      });
    const quoteId = createRes.body.data.id;

    const sendQuoteEmailSpy = vi.mocked(emailService.sendQuoteEmail);
    sendQuoteEmailSpy.mockClear();

    const response = await request(app)
      .patch(`${QUOTES_URL}/${quoteId}/send`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.estado).toBe('enviado');
    expect(sendQuoteEmailSpy).toHaveBeenCalledOnce();
    expect(sendQuoteEmailSpy.mock.calls[0][0].client.email).toBe(validClient.email);
  });

  it('should return 404 for non-existent quote', async () => {
    const response = await request(app)
      .patch(`${QUOTES_URL}/00000000-0000-0000-0000-000000000000/send`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 409 ALREADY_SENT when trying to send an already-sent quote', async () => {
    const createRes = await request(app)
      .post(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({
        client_id: clientId,
        fecha: '2026-01-15',
        lines: [{ service_id: serviceId, descripcion: 'Test', cantidad: 1, precio_unitario: 100, iva_porcentaje: 21 }],
      });
    const quoteId = createRes.body.data.id;

    await request(app)
      .patch(`${QUOTES_URL}/${quoteId}/send`)
      .set('Authorization', `Bearer ${token}`);

    const response = await request(app)
      .patch(`${QUOTES_URL}/${quoteId}/send`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('ALREADY_SENT');
  });
});

describe('POST /api/v1/quotes/:id/convert', () => {
  let token: string;
  let clientId: string;
  let serviceId: string;
  let quoteId: string;

  const buildQuotePayload = () => ({
    client_id: clientId,
    fecha: '2026-03-01',
    notas: 'Presupuesto de consultoría',
    lines: [
      { service_id: serviceId, descripcion: 'Consultoría web', cantidad: 5, precio_unitario: 200, iva_porcentaje: 21 },
      { descripcion: 'Reunión de seguimiento', cantidad: 2, precio_unitario: 75, iva_porcentaje: 21 },
    ],
  });

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

    const quoteRes = await request(app)
      .post(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(buildQuotePayload());
    quoteId = quoteRes.body.data.id;
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app).post(`${QUOTES_URL}/${quoteId}/convert`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should convert a borrador quote and return 201 with a new invoice', async () => {
    const response = await request(app)
      .post(`${QUOTES_URL}/${quoteId}/convert`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    const invoice = response.body.data;
    expect(invoice.estado).toBe('borrador');
    expect(invoice.numero).toBeNull();
    expect(invoice.client_id).toBe(clientId);
    expect(Number(invoice.subtotal)).toBe(1150);
    expect(Number(invoice.total_iva)).toBeCloseTo(241.5, 1);
    expect(Number(invoice.total)).toBeCloseTo(1391.5, 1);
    expect(invoice.notas).toBe('Presupuesto de consultoría');
    expect(invoice.lines).toHaveLength(2);
  });

  it('should copy all lines verbatim from the quote', async () => {
    const response = await request(app)
      .post(`${QUOTES_URL}/${quoteId}/convert`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(201);
    const lines = response.body.data.lines;
    const descriptions = lines.map((l: { descripcion: string }) => l.descripcion);
    expect(descriptions).toContain('Consultoría web');
    expect(descriptions).toContain('Reunión de seguimiento');
    expect(Number(lines.find((l: { descripcion: string }) => l.descripcion === 'Consultoría web').subtotal)).toBe(1000);
    expect(Number(lines.find((l: { descripcion: string }) => l.descripcion === 'Reunión de seguimiento').subtotal)).toBe(150);
  });

  it('should convert an enviado quote and return 201', async () => {
    await request(app)
      .patch(`${QUOTES_URL}/${quoteId}/send`)
      .set('Authorization', `Bearer ${token}`);

    const response = await request(app)
      .post(`${QUOTES_URL}/${quoteId}/convert`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(201);
    expect(response.body.data.estado).toBe('borrador');
    expect(response.body.data.client_id).toBe(clientId);
  });

  it('should use provided fecha_emision when given', async () => {
    const response = await request(app)
      .post(`${QUOTES_URL}/${quoteId}/convert`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fecha_emision: '2026-06-15' });

    expect(response.status).toBe(201);
    const invoiceFecha = response.body.data.fecha_emision;
    expect(invoiceFecha).toMatch(/^2026-06-15/);
  });

  it('should set fecha_emision when not provided', async () => {
    const response = await request(app)
      .post(`${QUOTES_URL}/${quoteId}/convert`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(201);
    expect(response.body.data.fecha_emision).not.toBeNull();
  });

  it('should return 400 when fecha_emision has invalid format', async () => {
    const response = await request(app)
      .post(`${QUOTES_URL}/${quoteId}/convert`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fecha_emision: 'not-a-date' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 for non-existent quote', async () => {
    const response = await request(app)
      .post(`${QUOTES_URL}/00000000-0000-0000-0000-000000000000/convert`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should not modify the original quote after conversion', async () => {
    await request(app)
      .post(`${QUOTES_URL}/${quoteId}/convert`)
      .set('Authorization', `Bearer ${token}`);

    const quoteRes = await request(app)
      .get(QUOTES_URL)
      .set('Authorization', `Bearer ${token}`);

    const original = quoteRes.body.data.find((q: { id: string }) => q.id === quoteId);
    expect(original).toBeDefined();
    expect(original.estado).toBe('borrador');
  });
});
