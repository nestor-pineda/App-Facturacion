import { ai, gemini20Flash } from '@/agent/genkit.config';
import { SYSTEM_PROMPT } from '@/agent/prompts/system.prompt';
import {
  createClientTools,
  createInvoiceTools,
  createQuoteTools,
  createServiceTools,
} from '@/agent/tools';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface FlowResult {
  reply: string;
  toolsUsed: string[];
}

export async function runBillingFlow(
  message: string,
  history: ChatMessage[],
  userId: string
): Promise<FlowResult> {
  const { searchClientsTool, listClientsTool } = createClientTools(userId);
  const { searchServicesTool, listServicesTool } = createServiceTools(userId);
  const { listInvoicesTool, getInvoiceTool, createInvoiceTool, sendInvoiceTool } =
    createInvoiceTools(userId);
  const { listQuotesTool, getQuoteTool, createQuoteTool, sendQuoteTool } =
    createQuoteTools(userId);

  const response = await ai.generate({
    model: gemini20Flash,
    system: SYSTEM_PROMPT,
    messages: [
      ...history.map(m => ({
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
      sendInvoiceTool,
      listQuotesTool,
      getQuoteTool,
      createQuoteTool,
      sendQuoteTool,
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
