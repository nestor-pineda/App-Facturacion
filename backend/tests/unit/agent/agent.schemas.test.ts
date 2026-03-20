import { describe, expect, it } from 'vitest';
import { AgentChatSchema } from '@/agent/agent.schemas';

describe('AgentChatSchema', () => {
  it('acepta un mensaje válido con historial vacío', () => {
    const withEmpty = AgentChatSchema.safeParse({ message: 'Hola', history: [] });
    expect(withEmpty.success).toBe(true);
    if (withEmpty.success) {
      expect(withEmpty.data.message).toBe('Hola');
      expect(withEmpty.data.history).toEqual([]);
    }

    const omitted = AgentChatSchema.safeParse({ message: 'Hola' });
    expect(omitted.success).toBe(true);
    if (omitted.success) {
      expect(omitted.data.history).toEqual([]);
    }
  });

  it('acepta historial con roles user y model', () => {
    const parsed = AgentChatSchema.safeParse({
      message: 'Siguiente',
      history: [
        { role: 'user', content: 'Hola' },
        { role: 'model', content: '¿En qué puedo ayudarte?' },
      ],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.history).toHaveLength(2);
    }
  });

  it('rechaza mensaje vacío', () => {
    const parsed = AgentChatSchema.safeParse({ message: '', history: [] });
    expect(parsed.success).toBe(false);
  });

  it('rechaza historial con más de 20 mensajes', () => {
    const history = Array.from({ length: 21 }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('model' as const),
      content: `msg ${i}`,
    }));
    const parsed = AgentChatSchema.safeParse({ message: 'ok', history });
    expect(parsed.success).toBe(false);
  });

  it('rechaza roles distintos de user o model', () => {
    const parsed = AgentChatSchema.safeParse({
      message: 'test',
      history: [{ role: 'assistant', content: 'no permitido' }],
    });
    expect(parsed.success).toBe(false);
  });
});
