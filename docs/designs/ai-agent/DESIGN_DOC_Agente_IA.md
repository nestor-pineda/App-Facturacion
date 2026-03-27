# Design Doc: Agente IA de Lenguaje Natural
**Sistema de Facturación MVP — Versión 1.0 — Marzo 2026**

---

## 1. Propósito y Alcance

Este documento describe la arquitectura, contratos de código y reglas de implementación para añadir un agente de inteligencia artificial al sistema de facturación. El objetivo es permitir al usuario operar la aplicación mediante lenguaje natural en español, delegando la traducción de intenciones a acciones concretas sobre la API existente.

> **Principio fundamental:** El agente NO reemplaza ninguna capa existente. Actúa exclusivamente como orquestador que llama a los servicios internos ya implementados. Todas las reglas de negocio, validaciones y restricciones de seguridad siguen residiendo en dichos servicios.

**Ejemplo de uso:**
> "Crea una factura borrador para Empresa Demo con 3 horas de consultoría a 120€ la hora" → El agente resuelve el cliente, calcula líneas, llama al servicio y responde con el resumen.

### 1.1 Qué puede hacer el agente

- Consultar y buscar clientes, servicios, presupuestos y facturas del usuario autenticado
- Gestionar clientes y servicios (listado, creacion y actualizacion)
- Crear presupuestos y facturas en estado borrador con sus lineas
- Actualizar y eliminar documentos en estado borrador
- Marcar presupuestos como enviados y facturas como enviadas (con flujo de confirmacion obligatorio)
- Reenviar por email presupuestos/facturas ya enviados sin alterar su estado
- Copiar presupuestos/facturas enviados para crear un nuevo borrador con el mismo contenido
- Convertir presupuestos en nuevas facturas borrador
- Descargar PDF de presupuestos y facturas (incluye facturas en estado borrador)
- Responder preguntas sobre estado, totales, fechas y actividad de facturacion del usuario

### 1.2 Qué NO puede hacer el agente

- Editar o eliminar facturas en estado `enviada` (regla de negocio inmutable)
- Editar o eliminar presupuestos en estado `enviado`
- Acceder a datos de otros usuarios (aislamiento por `user_id` garantizado)
- Inventar datos no presentes en la base de datos
- Ejecutar acciones irreversibles sin confirmación explícita del usuario
- Modificar el esquema de la base de datos ni la configuración del sistema

---

## 2. Stack Tecnológico del Módulo

El módulo se integra dentro del proyecto Express/TypeScript existente sin introducir nuevos lenguajes ni runtimes.

| Elemento | Valor |
| :--- | :--- |
| **Librería** | `genkit@1` + `@genkit-ai/google-genai@1` (plugin oficial; reemplaza a `@genkit-ai/googleai`) |
| **Modelo IA** | `gemini-3-flash-preview` (ID en API/SDK; preview hasta estabilización por parte de Google) |
| **Proveedor** | Google AI (`googleAI` desde `@genkit-ai/google-genai`) — **NO** Vertex AI |
| **API Key** | Variable de entorno `GOOGLE_GENAI_API_KEY` (gratuita en [aistudio.google.com](https://aistudio.google.com/apikey)) |
| **Transporte** | Endpoint Express `POST /api/v1/agent/chat`, protegido con middleware JWT existente |
| **Estado sesión** | Sin persistencia en DB para MVP. Historial enviado por el cliente en cada request |
| **Lenguaje** | TypeScript 5.x (igual que el resto del proyecto) |

> ⚠️ **CRÍTICO:** NO usar el plugin `@genkit-ai/vertexai`. Usar exclusivamente **`@genkit-ai/google-genai`** (API key de [Google AI Studio](https://aistudio.google.com/apikey)). El paquete `@genkit-ai/googleai` queda en desuso frente a `google-genai` para modelos recientes.

---

## 3. Arquitectura del Módulo

### 3.1 Estructura de carpetas

El módulo vive enteramente dentro de `src/agent/`. No se crean carpetas fuera de este directorio.

```
src/
  agent/
    tools/
      client.tools.ts       ← tools de clientes
      service.tools.ts      ← tools de servicios
      quote.tools.ts        ← tools de presupuestos
      invoice.tools.ts      ← tools de facturas
      index.ts              ← re-exporta todas las tools
    flows/
      billing.flow.ts       ← flow principal del agente
    prompts/
      system.prompt.ts      ← system prompt del agente
    agent.controller.ts     ← controlador Express
    agent.routes.ts         ← router Express
    agent.schemas.ts        ← schemas Zod del endpoint
    genkit.config.ts        ← inicialización de Genkit
```

### 3.2 Flujo de datos completo

```
POST /api/v1/agent/chat
  │  { message: string, history: Message[] }
  │
  ├─► middleware authenticate (JWT → req.userId)
  │
  ├─► agent.controller.ts
  │     └─► runBillingFlow(message, history, userId)
  │
  ├─► billing.flow.ts  (Genkit Flow)
  │     ├─► Construye messages con system + history + message
  │     └─► ai.generate() con tools registradas
  │
  ├─► Gemini (p. ej. `gemini-3-flash-preview`) decide qué tool llamar
  │
  ├─► Genkit ejecuta la tool (ej: createInvoiceTool)
  │     └─► Llama a invoiceService.create(userId, data)
  │           └─► Usa Prisma → PostgreSQL
  │
  ├─► Resultado de tool vuelve a Gemini
  │
  └─► Gemini genera respuesta final en lenguaje natural
        └─► { reply: string, toolsUsed: string[] }
```

### 3.3 Principio de inyección de userId

El `userId` **NUNCA** se pasa como parte del mensaje del usuario ni se lee desde los argumentos de la tool. Se inyecta mediante **closure** en el momento de crear las tools para cada request. Esto garantiza el aislamiento de datos.

```typescript
// En billing.flow.ts (imports: googleAI desde @genkit-ai/google-genai; ai, GEMINI_MODEL_NAME desde genkit.config)
export async function runBillingFlow(message, history, userId) {
  // Las tools se crean con el userId capturado en closure
  const tools = createToolsForUser(userId);
  
  const response = await ai.generate({
    model: googleAI.model(GEMINI_MODEL_NAME),
    system: SYSTEM_PROMPT,
    messages: [...history, { role: 'user', content: [{ text: message }] }],
    tools,
  });
  return response;
}
```

---

## 4. Configuración de Genkit

### 4.1 `genkit.config.ts`

Este archivo inicializa Genkit una única vez al arrancar el servidor. Se importa en el punto de entrada de la aplicación (`app.ts` o `server.ts`).

```typescript
// src/agent/genkit.config.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { env } from '../config/env';

export const GEMINI_MODEL_NAME = 'gemini-3-flash-preview' as const;

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: env.GOOGLE_GENAI_API_KEY }),
  ],
});
```

En `billing.flow.ts` el modelo se referencia como `googleAI.model(GEMINI_MODEL_NAME)` importando `googleAI` desde `@genkit-ai/google-genai`.

### 4.2 Variable de entorno requerida

Añadir a `src/config/env.ts` (validado con Zod como el resto de variables):

```typescript
// En el schema Zod de env.ts:
GOOGLE_GENAI_API_KEY: z.string().min(1, 'Google AI API key requerida'),

// En .env:
GOOGLE_GENAI_API_KEY=AIzaSy...

// En .env.example:
GOOGLE_GENAI_API_KEY=your-google-ai-api-key-here
```

---

## 5. System Prompt del Agente

El system prompt define la identidad, capacidades y restricciones del agente. Es la capa más crítica para prevenir alucinaciones y comportamientos incorrectos.

```typescript
// src/agent/prompts/system.prompt.ts
export const SYSTEM_PROMPT = `
Eres un asistente de facturación para autónomos españoles.
Ayudas al usuario a gestionar sus clientes, servicios,
presupuestos y facturas usando lenguaje natural.

## TUS CAPACIDADES
Puedes: buscar clientes, buscar servicios, crear presupuestos,
crear facturas, consultar facturas, marcar como enviado.

## REGLAS ABSOLUTAS — NUNCA LAS INCUMPLAS

1. DATOS REALES ÚNICAMENTE
   - NUNCA inventes IDs, nombres, precios ni fechas.
   - Si no encuentras un cliente o servicio, di que no existe
     y pregunta si quiere buscarlo de otra forma.
   - Antes de crear cualquier documento, usa las tools de
     búsqueda para obtener los IDs reales.

2. CONFIRMACIÓN ANTES DE ACCIONES IRREVERSIBLES
   - Antes de marcar una factura como 'enviada', SIEMPRE
     muestra el resumen (número, cliente, total) y pide
     confirmación explícita. Una factura enviada es INMUTABLE.
   - Antes de eliminar cualquier documento, confirma siempre.

3. CÁLCULOS
   - IVA siempre al 21% en el MVP.
   - subtotal_linea = cantidad * precio_unitario
   - iva_linea = subtotal_linea * 0.21
   - total = subtotal + total_iva
   - Siempre muestra el desglose al confirmar.

4. IDIOMA Y TONO
   - Responde siempre en español.
   - Tono profesional pero cercano.
   - En errores, explica qué falló y ofrece alternativa.

5. NUMERACIÓN DE FACTURAS
   - El número se genera AUTOMÁTICAMENTE al enviar.
   - Nunca inventes ni sugieras números de factura.

6. AISLAMIENTO DE DATOS
   - Solo tienes acceso a los datos del usuario autenticado.
   - No menciones datos de otros usuarios.
`;
```

---

## 6. Definición de Tools

### 6.1 Principios de diseño de tools

- Cada tool tiene una responsabilidad única y bien definida
- Los inputs usan `camelCase` (TypeScript)
- Cada tool incluye una descripción detallada para que Gemini sepa cuándo usarla
- El `userId` se inyecta por closure, **nunca** en el schema de input de la tool
- Las tools lanzan errores descriptivos que Gemini puede explicar al usuario

### 6.2 Catálogo completo de tools

| Tool name | Descripción | Cuándo la usa Gemini |
| :--- | :--- | :--- |
| `searchClients` | Busca clientes por nombre o email (búsqueda parcial) | Cuando el usuario menciona un cliente por nombre y necesita su ID |
| `getClientById` | Obtiene un cliente por su UUID exacto | Para verificar datos de un cliente antes de crear documento |
| `listClients` | Lista clientes del usuario autenticado | Para consultas generales de cartera y seleccion de cliente |
| `createClient` | Crea un cliente nuevo | Cuando el usuario dicta los datos de alta de cliente |
| `updateClient` | Actualiza datos de un cliente | Cuando el usuario solicita corregir datos fiscales o contacto |
| `searchServices` | Busca servicios del catálogo por nombre (búsqueda parcial) | Cuando el usuario menciona un servicio y necesita precio e ID |
| `listServices` | Lista todos los servicios del usuario | Para mostrar catálogo disponible o cuando el usuario pide opciones |
| `createService` | Crea un servicio de catálogo | Cuando el usuario quiere dar de alta un nuevo concepto recurrente |
| `updateService` | Actualiza un servicio existente | Cuando cambia precio base o descripcion del servicio |
| `createInvoice` | Crea una factura en estado borrador | Cuando el usuario quiere crear una factura nueva |
| `getInvoice` | Obtiene detalle completo de una factura por ID | Para mostrar detalles o verificar antes de enviar |
| `listInvoices` | Lista facturas con filtros opcionales (estado, cliente, fechas) | Para búsquedas y consultas sobre facturas |
| `updateInvoice` | Actualiza una factura en borrador | Cuando se modifican lineas, fecha o notas antes de enviar |
| `deleteInvoice` | Elimina factura en borrador | **SOLO** tras confirmacion explicita |
| `sendInvoice` | Marca factura como enviada y genera número legal | **SOLO** tras confirmación explícita del usuario |
| `resendInvoice` | Reenvia email de factura enviada sin cambiar estado | Cuando el usuario pide reenviar una factura ya emitida |
| `copyInvoice` | Crea una nueva factura borrador desde una enviada | Cuando el usuario quiere reutilizar una factura anterior |
| `downloadInvoicePdf` | Genera/descarga PDF de factura | Cuando el usuario pide el PDF (borrador o enviada) |
| `createQuote` | Crea un presupuesto en estado borrador | Cuando el usuario quiere crear un presupuesto |
| `getQuote` | Obtiene detalle de un presupuesto por ID | Para verificar contenido antes de enviar/convertir |
| `listQuotes` | Lista presupuestos con filtros opcionales | Para consultas sobre presupuestos |
| `updateQuote` | Actualiza un presupuesto en borrador | Cuando se ajustan lineas, fecha o notas |
| `deleteQuote` | Elimina presupuesto en borrador | **SOLO** tras confirmacion explicita |
| `sendQuote` | Marca presupuesto como enviado | **SOLO** tras confirmación explícita |
| `resendQuote` | Reenvia email de presupuesto enviado sin cambiar estado | Cuando el usuario pide reenviar un presupuesto |
| `copyQuote` | Crea un nuevo presupuesto borrador desde uno enviado | Cuando el usuario quiere duplicar un presupuesto previo |
| `convertQuoteToInvoice` | Convierte presupuesto en factura borrador | Cuando el usuario quiere facturar un presupuesto aceptado |
| `downloadQuotePdf` | Genera/descarga PDF de presupuesto | Cuando el usuario pide exportar presupuesto en PDF |

### 6.3 Patrón base de implementación

Todas las tools siguen el mismo patrón. `createInvoice` es el ejemplo canónico:

```typescript
// src/agent/tools/invoice.tools.ts
import { z } from 'zod';
import { ai } from '../genkit.config';
import * as invoiceService from '../../services/invoice.service';

const InvoiceLineInputSchema = z.object({
  serviceId: z.string().uuid().nullable()
    .describe('UUID del servicio. null si es línea manual'),
  descripcion: z.string().min(1)
    .describe('Descripción del concepto (snapshot)'),
  cantidad: z.number().positive()
    .describe('Unidades o horas'),
  precioUnitario: z.number().positive()
    .describe('Precio unitario sin IVA en euros'),
  ivaPorcentaje: z.number().default(21)
    .describe('Porcentaje de IVA. En MVP siempre 21'),
});

export function createInvoiceTools(userId: string) {

  const createInvoiceTool = ai.defineTool(
    {
      name: 'createInvoice',
      description: `Crea una nueva factura en estado borrador.
        Usar cuando el usuario quiere generar una factura.
        Requiere clientId (UUID) y al menos una línea.
        El número legal se asigna solo al enviar, no al crear.`,
      inputSchema: z.object({
        clientId: z.string().uuid()
          .describe('UUID del cliente. Obtenerlo con searchClients primero'),
        fechaEmision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe('Fecha ISO YYYY-MM-DD. Usar la fecha de hoy si no se especifica'),
        lines: z.array(InvoiceLineInputSchema).min(1)
          .describe('Mínimo una línea de factura'),
        notas: z.string().optional()
          .describe('Notas opcionales para el pie de la factura'),
      }),
      outputSchema: z.object({
        id: z.string().uuid(),
        estado: z.literal('borrador'),
        subtotal: z.number(),
        totalIva: z.number(),
        total: z.number(),
        message: z.string()
          .describe('Confirmación legible para mostrar al usuario'),
      }),
    },
    async (input) => {
      // userId viene del closure, nunca del input
      const invoice = await invoiceService.create(userId, {
        clientId: input.clientId,
        fechaEmision: new Date(input.fechaEmision),
        lines: input.lines,
        notas: input.notas,
      });
      return {
        id: invoice.id,
        estado: 'borrador' as const,
        subtotal: Number(invoice.subtotal),
        totalIva: Number(invoice.total_iva),
        total: Number(invoice.total),
        message: `Factura borrador creada. Total: ${invoice.total}€`,
      };
    }
  );

  return { createInvoiceTool };
}
```

### 6.4 Tool crítica: `sendInvoice`

Esta tool es la más delicada. El system prompt instruye al agente a pedir confirmación antes de llamarla, pero la tool también incluye una guardia propia mediante el campo `userConfirmed`:

```typescript
const sendInvoiceTool = ai.defineTool(
  {
    name: 'sendInvoice',
    description: `Marca una factura como ENVIADA y genera su número legal
      correlativo (ej: 2026/003). Esta acción es IRREVERSIBLE.
      SOLO llamar esta tool si el usuario ha confirmado explícitamente.
      Nunca llamarla si el usuario solo preguntó o pidió ver la factura.`,
    inputSchema: z.object({
      invoiceId: z.string().uuid()
        .describe('UUID de la factura a enviar'),
      userConfirmed: z.boolean()
        .describe('Debe ser true. Confirma que el usuario ha aprobado la acción'),
    }),
    outputSchema: z.object({
      numero: z.string(),
      message: z.string(),
    }),
  },
  async (input) => {
    if (!input.userConfirmed) {
      throw new Error('Acción cancelada: se requiere confirmación del usuario');
    }
    const invoice = await invoiceService.markAsSent(userId, input.invoiceId);
    return {
      numero: invoice.numero,
      message: `Factura ${invoice.numero} enviada correctamente.`,
    };
  }
);
```

### 6.5 Tool de búsqueda: `searchClients`

El agente debe siempre resolver nombres a IDs reales con esta tool antes de crear cualquier documento. Nunca inventar UUIDs.

```typescript
const searchClientsTool = ai.defineTool(
  {
    name: 'searchClients',
    description: `Busca clientes por nombre o email.
      Usar SIEMPRE antes de crear facturas o presupuestos
      para obtener el clientId real. Nunca inventar UUIDs.`,
    inputSchema: z.object({
      query: z.string().min(1)
        .describe('Nombre o email parcial del cliente a buscar'),
    }),
    outputSchema: z.array(z.object({
      id: z.string().uuid(),
      nombre: z.string(),
      email: z.string(),
      cifNif: z.string(),
    })),
  },
  async (input) => {
    const clients = await clientService.search(userId, input.query);
    return clients.map(c => ({
      id: c.id,
      nombre: c.nombre,
      email: c.email,
      cifNif: c.cif_nif,
    }));
  }
);
```

---

## 7. Billing Flow

```typescript
// src/agent/flows/billing.flow.ts
import { googleAI } from '@genkit-ai/google-genai';
import { ai, GEMINI_MODEL_NAME } from '../genkit.config';
import { SYSTEM_PROMPT } from '../prompts/system.prompt';
import { createClientTools } from '../tools/client.tools';
import { createServiceTools } from '../tools/service.tools';
import { createInvoiceTools } from '../tools/invoice.tools';
import { createQuoteTools } from '../tools/quote.tools';

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

  // Inyectar userId en todas las tools via closure
  const { searchClientsTool, getClientByIdTool } = createClientTools(userId);
  const { searchServicesTool, listServicesTool } = createServiceTools(userId);
  const {
    createInvoiceTool, listInvoicesTool,
    getInvoiceTool, sendInvoiceTool,
  } = createInvoiceTools(userId);
  const { createQuoteTool, listQuotesTool, sendQuoteTool } = createQuoteTools(userId);

  const toolsUsed: string[] = [];

  const response = await ai.generate({
    model: googleAI.model(GEMINI_MODEL_NAME),
    system: SYSTEM_PROMPT,
    messages: [
      // Transformar historial del cliente al formato de Genkit
      ...history.map(m => ({
        role: m.role,
        content: [{ text: m.content }],
      })),
      { role: 'user', content: [{ text: message }] },
    ],
    tools: [
      searchClientsTool, getClientByIdTool,
      searchServicesTool, listServicesTool,
      createInvoiceTool, listInvoicesTool, getInvoiceTool, sendInvoiceTool,
      createQuoteTool, listQuotesTool, sendQuoteTool,
    ],
  });

  // Recopilar nombres de tools usadas para logging
  for (const step of response.messages ?? []) {
    for (const part of step.content ?? []) {
      if (part.toolRequest) toolsUsed.push(part.toolRequest.name);
    }
  }

  return {
    reply: response.text,
    toolsUsed,
  };
}
```

---

## 8. Endpoint de la API

### 8.1 Contrato

| Campo | Valor |
| :--- | :--- |
| **Método** | `POST` |
| **Ruta** | `/api/v1/agent/chat` |
| **Auth** | Bearer JWT (middleware `authenticate` existente) |
| **Content-Type** | `application/json` |

### 8.2 Request body schema (Zod)

```typescript
// src/agent/agent.schemas.ts
import { z } from 'zod';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string().min(1),
});

export const AgentChatSchema = z.object({
  message: z.string().min(1).max(2000)
    .describe('Mensaje actual del usuario'),
  history: z.array(ChatMessageSchema).max(20).default([])
    .describe('Historial de la conversación. Máximo 20 turnos.'),
});

export type AgentChatInput = z.infer<typeof AgentChatSchema>;
```

### 8.3 Responses

```jsonc
// 200 OK
{
  "success": true,
  "data": {
    "reply": "He creado la factura borrador para Empresa Demo...",
    "toolsUsed": ["searchClients", "createInvoice"]
  }
}

// 400 Bad Request (validación Zod)
{
  "success": false,
  "error": { "message": "message es requerido", "code": "VALIDATION_ERROR" }
}

// 401 Unauthorized (JWT inválido/expirado)
{
  "success": false,
  "error": { "message": "Token inválido", "code": "UNAUTHORIZED" }
}

// 500 Internal Server Error (error del modelo IA)
{
  "success": false,
  "error": { "message": "El agente no pudo procesar la solicitud", "code": "AGENT_ERROR" }
}
```

### 8.4 Controlador

```typescript
// src/agent/agent.controller.ts
import { Request, Response } from 'express';
import { AgentChatSchema } from './agent.schemas';
import { runBillingFlow } from './flows/billing.flow';

export async function agentChat(req: Request, res: Response) {
  const parsed = AgentChatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' },
    });
  }

  const { message, history } = parsed.data;
  const userId = req.userId; // inyectado por middleware authenticate

  try {
    const result = await runBillingFlow(message, history, userId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[AgentChat] Error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'El agente no pudo procesar la solicitud', code: 'AGENT_ERROR' },
    });
  }
}
```

### 8.5 Router

```typescript
// src/agent/agent.routes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { agentChat } from './agent.controller';

const router = Router();

router.use(authenticate); // Todas las rutas del agente requieren autenticación

router.post('/chat', agentChat);

export default router;
```

### 8.6 Registro en `app.ts` / `server.ts`

```typescript
import agentRouter from './agent/agent.routes';

// Inicializar Genkit una sola vez al arrancar el servidor
import './agent/genkit.config';

app.use('/api/v1/agent', agentRouter);
```

---

## 9. Dependencias a Instalar

```bash
npm install --save-exact genkit@1 @genkit-ai/google-genai@1
```

> ⚠️ **NO instalar** `@genkit-ai/vertexai`, `@genkit-ai/firebase` ni ningún otro plugin de Genkit. Esos servicios tienen coste económico.

Verificar versiones disponibles antes de instalar:

```bash
npm view genkit version
npm view @genkit-ai/google-genai version
```

Actualizar `ENVIRONMENT.md` añadiendo:

| Variable | Descripción | Obtención | Entornos |
| :--- | :--- | :--- | :--- |
| `GOOGLE_GENAI_API_KEY` | API key de Google AI Studio para Gemini | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (gratuita) | development, production, test |

---

## 10. Estrategia de Testing

Seguir TDD estricto como el resto del proyecto (ver `testing.md`).

### 10.1 Qué testear

- **Tools individualmente:** mockear los servicios y verificar inputs/outputs y que el `userId` viene del closure
- **El flow:** mockear `ai.generate` y verificar que las tools se pasan correctamente
- **El controlador:** validación del schema Zod y manejo de errores
- **Test E2E con modelo real:** marcado como `skip` en CI, ejecutar manualmente

### 10.2 Patrón de mock para tools

```typescript
// tests/unit/agent/tools/invoice.tools.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as invoiceService from '../../../src/services/invoice.service';
import { createInvoiceTools } from '../../../src/agent/tools/invoice.tools';

vi.mock('../../../src/services/invoice.service');

const TEST_USER_ID = 'test-user-uuid';

describe('createInvoiceTool', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call invoiceService.create with userId from closure', async () => {
    const mockInvoice = {
      id: 'inv-uuid', subtotal: 200, total_iva: 42, total: 242,
    };
    vi.mocked(invoiceService.create).mockResolvedValue(mockInvoice as any);

    const { createInvoiceTool } = createInvoiceTools(TEST_USER_ID);

    // Simular llamada directa a la función interna de la tool
    const result = await (createInvoiceTool as any).__action({
      clientId: 'client-uuid',
      fechaEmision: '2026-03-10',
      lines: [{
        serviceId: null,
        descripcion: 'Consultoría',
        cantidad: 2,
        precioUnitario: 100,
        ivaPorcentaje: 21,
      }],
    });

    expect(invoiceService.create).toHaveBeenCalledWith(
      TEST_USER_ID, // userId del closure, no del input
      expect.objectContaining({ clientId: 'client-uuid' })
    );
    expect(result.total).toBe(242);
  });
});
```

### 10.3 Test de seguridad — aislamiento de userId

Este test es **crítico**. Verifica que la tool nunca puede operar con un `userId` diferente al del closure:

```typescript
it('should NEVER use a userId other than the one from closure', async () => {
  vi.mocked(clientService.search).mockResolvedValue([]);
  const { searchClientsTool } = createClientTools('real-user-id');

  // Aunque el mensaje del usuario contuviera otro userId, la tool lo ignora
  await (searchClientsTool as any).__action({ query: 'test' });

  expect(clientService.search).toHaveBeenCalledWith(
    'real-user-id', // siempre el del closure
    'test'
  );
});
```

---

## 11. Gestión del Historial de Conversación

### 11.1 Modelo stateless

El backend **NO persiste** el historial de conversación en base de datos para el MVP. El cliente es responsable de enviar el historial acumulado en cada request.

**Responsabilidad del cliente:** El frontend debe mantener el array `history` en memoria de la sesión y enviarlo completo en cada llamada a `POST /api/v1/agent/chat`. El límite es 20 mensajes, validado por el schema Zod.

### 11.2 Límites

- Máximo 20 mensajes en `history` (10 turnos de conversación)
- Si el cliente envía más de 20, el schema Zod lo rechaza con error 400
- El cliente debe implementar una ventana deslizante si la conversación es larga

---

## 12. Manejo de Errores

| Escenario | Comportamiento esperado | HTTP |
| :--- | :--- | :--- |
| API key inválida o expirada | Log del error, respuesta `503` `AGENT_MISCONFIGURED` cuando aplique | 503 |
| Rate limit / tope de gasto de Google AI | Log del error, respuesta `503` `AGENT_RATE_LIMITED` | 503 |
| Modelo no disponible para el proyecto (404) | Log del error, respuesta `503` `AGENT_MODEL_UNAVAILABLE` | 503 |
| Tool lanza error (ej: cliente no encontrado) | Gemini recibe el error y lo explica en lenguaje natural | 200 |
| Schema Zod inválido en request | Error de validación estándar del proyecto | 400 |
| JWT expirado o inválido | Middleware `authenticate` rechaza, igual que cualquier endpoint | 401 |
| Intento de enviar factura ya enviada | Service lanza error, Gemini lo explica al usuario | 200 |

---

## 13. Restricciones y Límites

| Restricción | Valor |
| :--- | :--- |
| Historial máximo | 20 mensajes por request (validado por Zod) |
| Longitud máx. mensaje | 2000 caracteres (validado por Zod) |
| Modelo | Por defecto `gemini-3-flash-preview` (ajustar `GEMINI_MODEL_NAME` si Google renombra el ID) |
| Coste | Depende del plan/cuotas de Google AI Studio; el free tier tiene límites que pueden cambiar |
| Persistencia | Sin persistencia en DB para MVP |
| IVA soportado | Solo 21% (igual que el resto del MVP) |
| Idioma | Solo español (definido en system prompt) |

---

## 14. Checklist de Implementación

El agente de Cursor debe completar estos pasos **en orden**. No avanzar al siguiente sin verificar el anterior.

### Fase 1 — Setup

- [ ] Obtener `GOOGLE_GENAI_API_KEY` en [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- [ ] Añadir `GOOGLE_GENAI_API_KEY` a `.env`, `.env.example` y `src/config/env.ts`
- [ ] Instalar `genkit` y `@genkit-ai/google-genai` con `npm install --save-exact`
- [ ] Crear `src/agent/genkit.config.ts` con la configuración mínima
- [ ] Importar `genkit.config.ts` en `app.ts`/`server.ts`
- [ ] Verificar que el servidor arranca sin errores: `npm run dev`

### Fase 2 — Tools (TDD: test primero)

- [ ] `src/agent/tools/client.tools.ts` con `searchClients` y `getClientById`
- [ ] `src/agent/tools/service.tools.ts` con `searchServices` y `listServices`
- [ ] `src/agent/tools/invoice.tools.ts` con todas las tools de factura
- [ ] `src/agent/tools/quote.tools.ts` con todas las tools de presupuesto
- [ ] Tests unitarios para cada tool escritos y pasando

### Fase 3 — Flow y Endpoint

- [ ] `src/agent/prompts/system.prompt.ts`
- [ ] `src/agent/flows/billing.flow.ts`
- [ ] `src/agent/agent.schemas.ts`
- [ ] `src/agent/agent.controller.ts`
- [ ] `src/agent/agent.routes.ts`
- [ ] Registrar el router en `app.ts`

### Fase 4 — Verificación

- [ ] `"lista mis clientes"` → usa `searchClients`, devuelve lista
- [ ] `"crea factura para [cliente inexistente]"` → responde que no existe, no inventa
- [ ] `"envía la factura X"` → pide confirmación **antes** de llamar `sendInvoice`
- [ ] Verificar que el `userId` del closure es siempre el correcto en todas las tools
- [ ] `npm run test` → todos los tests pasan
- [ ] `npm run typecheck` → sin errores de TypeScript

---

## 15. Documentación a Actualizar al Completar

- **`API.md`** → añadir sección `POST /agent/chat` con contrato completo
- **`ENVIRONMENT.md`** → añadir `GOOGLE_GENAI_API_KEY` a la tabla de variables obligatorias
- **`general.md`** → añadir `genkit` y `@genkit-ai/google-genai` a la sección Stack Tecnológico
- **`decisions.md`** → mantener entrada sobre Genkit + Google AI (modelo y plugin actualizados según evolución de Google)

---

## 16. Cambios Funcionales Recientes (Facturacion Web)

Esta seccion deja trazabilidad de los cambios funcionales aplicados en presupuestos y facturas durante marzo 2026 para mantener sincronizadas implementacion y documentacion.

### 16.1 Presupuestos (Quotes)

- Se anade accion **Reenviar** en listado de presupuestos enviados (menu de 3 puntos), debajo de **Descargar PDF**.
- Se anade accion **Copiar presupuesto** en listado de presupuestos enviados y en detalle de presupuesto enviado.
- **Copiar presupuesto** crea un nuevo presupuesto en estado `borrador` con los mismos datos (cliente, notas y lineas) y redirige al detalle del nuevo documento.
- Se mantiene la regla de negocio de copia solo para presupuestos en estado `enviado`.

### 16.2 Facturas (Invoices)

- Se anade accion **Enviar** y **Descargar PDF** para facturas en estado `borrador` en la pagina de listado.
- Se anade accion **Reenviar** para facturas en estado `enviada` en listado y en detalle.
- Se anade accion **Copiar factura** para facturas en estado `enviada` en listado y en detalle.
- **Copiar factura** crea una nueva factura en estado `borrador` con los mismos datos del documento origen y redirige al detalle de la nueva factura.
- Se habilita descarga PDF para facturas en estado `borrador` desde backend y frontend.
- Se garantiza visibilidad del boton **Descargar PDF** en el detalle de factura para todos los estados.

### 16.3 Reglas de datos y validaciones

- Campo **Cantidad** en lineas de factura: solo enteros (`1, 2, 3...`), con validacion de esquema y restricciones de input.
- Se corrige mapeo de datos `snake_case -> camelCase` en facturas y lineas para evitar visualizacion `NaN` en precio e IVA.
- Se corrige visualizacion de numero en tablas: cuando no existe numero de documento se muestra `-` en lugar de `(borrador)`.

### 16.4 Formato de fechas y consistencia UI

- Se normaliza el formato de fechas en tablas de facturas y dashboard a `D-M-YYYY` (sin ceros a la izquierda).
- Se mantiene orden coherente de acciones en menus/contextos:
  - borrador: `Enviar`, `Descargar PDF`, editar/eliminar segun vista;
  - enviado: `Descargar PDF`, `Reenviar`, `Copiar`.

### 16.5 Backend (API/Servicios)

- Nuevos endpoints:
  - `POST /quotes/:id/copy`
  - `POST /invoices/:id/copy`
  - `POST /invoices/:id/resend`
- Nuevos metodos de servicio para copia y reenvio:
  - `copyQuote`, `copyInvoice`, `resendInvoiceEmail`.
- Reglas de error especificas por estado no permitido al copiar documentos no enviados.

### 16.6 Frontend (Hooks, Paginas e i18n)

- Nuevos hooks de mutacion para copia y reenvio en presupuestos y facturas.
- Actualizacion de menus de acciones en listados y botones en paginas de detalle.
- Nuevas claves de traduccion para acciones (`copy`, `resend`) y toasts de exito/error.
