import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/test/test-utils';
import { ServiceForm } from './ServiceForm';
import type { ServiceInput } from '@/schemas/service.schema';

describe('ServiceForm', () => {
  it('shows validation error when submitting with empty name', async () => {
    const onSubmit = vi.fn();
    render(<ServiceForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/precio base|base price/i), '100');
    await userEvent.click(screen.getByRole('button', { name: /crear servicio|create service/i }));

    expect(screen.getByText(/nombre obligatorio|name is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with form data when valid', async () => {
    const onSubmit = vi.fn();
    render(<ServiceForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/nombre|name/i), 'Diseño web');
    await userEvent.type(screen.getByLabelText(/precio base|base price/i), '200');

    await userEvent.click(screen.getByRole('button', { name: /crear servicio|create service/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted: ServiceInput = onSubmit.mock.calls[0][0];
    expect(submitted.nombre).toBe('Diseño web');
    expect(submitted.precioBase).toBe(200);
  });
});
