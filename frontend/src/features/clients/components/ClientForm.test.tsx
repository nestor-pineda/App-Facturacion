import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/test/test-utils';
import { ClientForm } from './ClientForm';
import type { ClientInput } from '@/schemas/client.schema';

describe('ClientForm', () => {
  it('shows validation errors when submitting with empty required fields', async () => {
    const onSubmit = vi.fn();
    render(<ClientForm onSubmit={onSubmit} />);

    const submitButton = screen.getByRole('button', { name: /crear cliente|create client/i });
    await userEvent.click(submitButton);

    expect(screen.getByText(/nombre obligatorio|name is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with form data when valid', async () => {
    const onSubmit = vi.fn();
    render(<ClientForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/nombre|name/i), 'Acme SL');
    await userEvent.type(screen.getByLabelText(/email/i), 'contact@acme.com');
    await userEvent.type(screen.getByPlaceholderText('B12345678'), 'B12345678');
    await userEvent.type(screen.getByLabelText(/dirección|address/i), 'Calle Mayor 1');

    await userEvent.click(screen.getByRole('button', { name: /crear cliente|create client/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted: ClientInput = onSubmit.mock.calls[0][0];
    expect(submitted.nombre).toBe('Acme SL');
    expect(submitted.email).toBe('contact@acme.com');
    expect(submitted.cifNif).toBe('B12345678');
    expect(submitted.direccion).toBe('Calle Mayor 1');
  });
});
