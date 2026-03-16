import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, userEvent, waitFor } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { InvoiceForm } from './InvoiceForm';
import type { CreateInvoiceInput } from '@/schemas/invoice.schema';

const CLIENT_UUID = '11111111-1111-4111-a111-111111111111';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('InvoiceForm', () => {
  it('shows validation errors when submitting with empty required fields', async () => {
    const onSubmit = vi.fn();
    render(<InvoiceForm onSubmit={onSubmit} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear factura|create invoice/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /crear factura|create invoice/i }));

    expect(screen.getByText(/cliente inválido|invalid client|fecha obligatoria|date required|descripción obligatoria|description required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with form data when valid', async () => {
    const onSubmit = vi.fn();
    const defaultValues: CreateInvoiceInput = {
      clientId: CLIENT_UUID,
      fechaEmision: '2026-01-20',
      notas: '',
      lines: [{ serviceId: null, descripcion: 'Servicio de prueba', cantidad: 1, precioUnitario: 100, ivaPorcentaje: 21 }],
    };
    render(<InvoiceForm onSubmit={onSubmit} defaultValues={defaultValues} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear factura|create invoice/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /crear factura|create invoice/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const submitted: CreateInvoiceInput = onSubmit.mock.calls[0][0];
    expect(submitted.clientId).toBe(CLIENT_UUID);
    expect(submitted.lines).toHaveLength(1);
    expect(submitted.lines[0].descripcion).toBe('Servicio de prueba');
    expect(Number(submitted.lines[0].precioUnitario)).toBe(100);
  });
});
