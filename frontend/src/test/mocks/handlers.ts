import { http, HttpResponse } from 'msw';
import { API_BASE_PATH } from '@/lib/constants';

const BASE = API_BASE_PATH; // '/api/v1'

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  nombre_comercial: 'Test SL',
  nif: 'B12345678',
  direccion_fiscal: 'Calle Test 1',
  telefono: '+34600000000',
};

const mockClient = {
  id: '11111111-1111-4111-a111-111111111111',
  nombre: 'Cliente Test',
  email: 'client@example.com',
  cifNif: 'B87654321',
  direccion: 'Calle Cliente 1',
  telefono: '+34600000001',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockService = {
  id: '22222222-2222-4222-a222-222222222222',
  nombre: 'Servicio Test',
  descripcion: 'Descripción',
  precio_base: 100,
  iva_porcentaje: 21,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockQuote = {
  id: '33333333-3333-4333-a333-333333333333',
  numero: null,
  estado: 'borrador',
  fecha: '2026-01-15',
  subtotal: 100,
  totalIva: 21,
  total: 121,
  notas: null,
  client: mockClient,
  lines: [
    {
      id: 'ql-1',
      serviceId: '22222222-2222-4222-a222-222222222222',
      descripcion: 'Servicio Test',
      cantidad: 1,
      precioUnitario: 100,
      ivaPorcentaje: 21,
      subtotal: 100,
    },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockInvoice = {
  id: '44444444-4444-4444-a444-444444444444',
  numero: null,
  estado: 'borrador',
  fechaEmision: '2026-01-20',
  subtotal: 100,
  totalIva: 21,
  total: 121,
  notas: null,
  client: mockClient,
  lines: [
    {
      id: 'il-1',
      serviceId: '22222222-2222-4222-a222-222222222222',
      descripcion: 'Servicio Test',
      cantidad: 1,
      precioUnitario: 100,
      ivaPorcentaje: 21,
      subtotal: 100,
    },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/register`, () => {
    return HttpResponse.json({
      success: true,
      data: { user: { ...mockUser, nombreComercial: mockUser.nombre_comercial, direccionFiscal: mockUser.direccion_fiscal } },
    }, { status: 201 });
  }),
  http.post(`${BASE}/auth/login`, () => {
    return HttpResponse.json({
      success: true,
      data: { user: { ...mockUser, nombreComercial: mockUser.nombre_comercial, direccionFiscal: mockUser.direccion_fiscal } },
    }, { status: 200 });
  }),
  http.post(`${BASE}/auth/refresh`, () => {
    return HttpResponse.json({ success: true, data: { message: 'OK' } }, { status: 200 });
  }),
  http.post(`${BASE}/auth/logout`, () => {
    return HttpResponse.json({ success: true, data: { message: 'OK' } }, { status: 200 });
  }),

  // Clients
  http.get(`${BASE}/clients`, () => {
    return HttpResponse.json({
      success: true,
      data: [mockClient],
      meta: { total: 1 },
    }, { status: 200 });
  }),
  http.post(`${BASE}/clients`, () => {
    return HttpResponse.json({ success: true, data: mockClient }, { status: 201 });
  }),
  http.put(`${BASE}/clients/:id`, () => {
    return HttpResponse.json({ success: true, data: mockClient }, { status: 200 });
  }),

  // Services
  http.get(`${BASE}/services`, () => {
    return HttpResponse.json({
      success: true,
      data: [mockService],
    }, { status: 200 });
  }),
  http.post(`${BASE}/services`, () => {
    return HttpResponse.json({ success: true, data: mockService }, { status: 201 });
  }),

  // Quotes
  http.get(`${BASE}/quotes`, () => {
    return HttpResponse.json({
      success: true,
      data: [mockQuote],
    }, { status: 200 });
  }),
  http.post(`${BASE}/quotes`, () => {
    return HttpResponse.json({ success: true, data: mockQuote }, { status: 201 });
  }),
  http.put(`${BASE}/quotes/:id`, () => {
    return HttpResponse.json({ success: true, data: mockQuote }, { status: 200 });
  }),
  http.delete(`${BASE}/quotes/:id`, () => {
    return HttpResponse.json({ success: true, data: null }, { status: 200 });
  }),
  http.patch(`${BASE}/quotes/:id/send`, () => {
    return HttpResponse.json({
      success: true,
      data: { ...mockQuote, estado: 'enviado' },
    }, { status: 200 });
  }),
  http.post(`${BASE}/quotes/:id/convert`, () => {
    return HttpResponse.json({ success: true, data: mockInvoice }, { status: 201 });
  }),
  http.get(`${BASE}/quotes/:id/pdf`, () => {
    return new HttpResponse(new Blob(['pdf-content'], { type: 'application/pdf' }), {
      status: 200,
      headers: { 'Content-Type': 'application/pdf' },
    });
  }),

  // Invoices
  http.get(`${BASE}/invoices`, () => {
    return HttpResponse.json({
      success: true,
      data: [mockInvoice],
    }, { status: 200 });
  }),
  http.post(`${BASE}/invoices`, () => {
    return HttpResponse.json({ success: true, data: mockInvoice }, { status: 201 });
  }),
  http.put(`${BASE}/invoices/:id`, () => {
    return HttpResponse.json({ success: true, data: mockInvoice }, { status: 200 });
  }),
  http.delete(`${BASE}/invoices/:id`, () => {
    return HttpResponse.json({ success: true, data: null }, { status: 200 });
  }),
  http.patch(`${BASE}/invoices/:id/send`, () => {
    return HttpResponse.json({
      success: true,
      data: { ...mockInvoice, estado: 'enviada', numero: '2026/001' },
    }, { status: 200 });
  }),
  http.get(`${BASE}/invoices/:id/pdf`, () => {
    return new HttpResponse(new Blob(['pdf-content'], { type: 'application/pdf' }), {
      status: 200,
      headers: { 'Content-Type': 'application/pdf' },
    });
  }),
];
