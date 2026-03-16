import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { StatusBadge } from './StatusBadge';
import { ESTADO_BORRADOR, ESTADO_ENVIADA, ESTADO_ENVIADO } from '@/lib/constants';

describe('StatusBadge', () => {
  it('renders draft label and draft style for borrador', () => {
    render(<StatusBadge status={ESTADO_BORRADOR} />);
    expect(screen.getByText('Borrador')).toBeInTheDocument();
    const badge = screen.getByText('Borrador');
    expect(badge).toHaveClass('bg-yellow-100');
  });

  it('renders sent (f) label and green style for enviada', () => {
    render(<StatusBadge status={ESTADO_ENVIADA} />);
    expect(screen.getByText('Enviada')).toBeInTheDocument();
    const badge = screen.getByText('Enviada');
    expect(badge).toHaveClass('bg-green-100');
  });

  it('renders sent (m) label and green style for enviado', () => {
    render(<StatusBadge status={ESTADO_ENVIADO} />);
    expect(screen.getByText('Enviado')).toBeInTheDocument();
    const badge = screen.getByText('Enviado');
    expect(badge).toHaveClass('bg-green-100');
  });
});
