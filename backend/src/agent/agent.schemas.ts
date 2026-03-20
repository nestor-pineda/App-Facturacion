import { z } from 'zod';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string().min(1),
});

export const AgentChatSchema = z.object({
  message: z
    .string()
    .min(1)
    .max(2000)
    .describe('Mensaje actual del usuario'),
  history: z
    .array(ChatMessageSchema)
    .max(20)
    .default([])
    .describe('Historial de la conversación. Máximo 20 turnos.'),
});

export type AgentChatInput = z.infer<typeof AgentChatSchema>;
