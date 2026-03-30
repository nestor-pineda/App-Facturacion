import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { ai, GEMINI_MODEL_NAME } from '@/agent/genkit.config';
import { SYSTEM_PROMPT } from '@/agent/prompts/system.prompt';
import {
  createClientTools,
  createInvoiceTools,
  createQuoteTools,
  createServiceTools,
} from '@/agent/tools';

// Schemas Zod para el flow
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const FlowInputSchema = z.object({
  message: z.string(),
  history: z.array(ChatMessageSchema).default([]),
  userId: z.string(), // ← sigue viniendo del controller, que lo extrae del JWT
});

const FlowOutputSchema = z.object({
  reply: z.string(),
  toolsUsed: z.array(z.string()),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type FlowResult = z.infer<typeof FlowOutputSchema>;

// ✅ Ahora sí es un flow registrado en Genkit
export const billingFlow = ai.defineFlow(
  {
    name: 'billingFlow',
    inputSchema: FlowInputSchema,
    outputSchema: FlowOutputSchema,
  },
  async ({ message, history, userId }) => {
    // userId sigue viniendo del JWT via controller, no de input del usuario
    const { searchClientsTool, listClientsTool } = createClientTools(userId);
    const { searchServicesTool, listServicesTool } = createServiceTools(userId);
    const { listInvoicesTool, getInvoiceTool, createInvoiceTool } = createInvoiceTools(userId);
    const { listQuotesTool, getQuoteTool, createQuoteTool } = createQuoteTools(userId);

    const response = await ai.generate({
      model: googleAI.model(GEMINI_MODEL_NAME),
      system: SYSTEM_PROMPT,
      messages: [
        ...history.map((m: ChatMessage) => ({
          role: m.role,
          content: [{ text: m.content }],
        })),
        { role: 'user', content: [{ text: message }] },
      ],
      tools: [
        searchClientsTool,
        listClientsTool,
        searchServicesTool,
        listServicesTool,
        listInvoicesTool,
        getInvoiceTool,
        createInvoiceTool,
        listQuotesTool,
        getQuoteTool,
        createQuoteTool,
      ],
    });

    const toolsUsed: string[] = [];
    for (const step of response.messages ?? []) {
      for (const part of step.content ?? []) {
        if (part.toolRequest) {
          toolsUsed.push(part.toolRequest.name);
        }
      }
    }

    return {
      reply: response.text ?? '',
      toolsUsed,
    };
  }
);

// Mantener la función wrapper para el controller (interfaz pública sin cambios)
export async function runBillingFlow(
  message: string,
  history: ChatMessage[],
  userId: string
): Promise<FlowResult> {
  return billingFlow({ message, history, userId });
}