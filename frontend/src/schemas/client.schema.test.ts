import { describe, it, expect } from 'vitest';
import { createClientSchema } from './client.schema';

describe('createClientSchema', () => {
  const validInput = {
    nombre: 'Acme SL',
    email: 'contact@acme.com',
    cifNif: 'B12345678',
    direccion: 'Calle Mayor 1, Madrid',
    telefono: '+34600000000',
  };

  it('accepts valid input with all required fields', () => {
    const schema = createClientSchema();
    const result = schema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInput);
    }
  });

  it('accepts valid input without optional telefono', () => {
    const schema = createClientSchema();
    const { telefono, ...rest } = validInput;
    const result = schema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.telefono).toBeUndefined();
    }
  });

  it('rejects empty nombre', () => {
    const schema = createClientSchema();
    const result = schema.safeParse({ ...validInput, nombre: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const schema = createClientSchema();
    const result = schema.safeParse({ ...validInput, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects empty cifNif', () => {
    const schema = createClientSchema();
    const result = schema.safeParse({ ...validInput, cifNif: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty direccion', () => {
    const schema = createClientSchema();
    const result = schema.safeParse({ ...validInput, direccion: '' });
    expect(result.success).toBe(false);
  });
});
