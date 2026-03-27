# Referencia Técnica: Genkit + Google AI
**Guía de implementación para el agente de facturación — Plugin `@genkit-ai/google-genai` (API key / Google AI Studio)**

---

## 1. Instalación y versiones exactas

```bash
# Instalar con versiones exactas para evitar breaking changes
# El plugin oficial actual es @genkit-ai/google-genai (sustituye al legacy @genkit-ai/googleai).
npm install --save-exact genkit@1 @genkit-ai/google-genai@1

# Verificar instalación correcta
npm list genkit @genkit-ai/google-genai

# UI de desarrollo local (opcional pero muy recomendada)
# Lanza inspector de flows en http://localhost:4000
npx genkit start -- npm run dev
```

> ⚠️ `genkit@1` es la versión estable. **NO usar `genkit@0.x`** (alpha). La API cambió completamente entre versiones.

---

## 2. Imports correctos

Los imports cambiaron entre versiones. Usar **siempre** estos:

```typescript
// ✅ CORRECTO — genkit@1 + plugin google-genai
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// ❌ INCORRECTO — imports de versiones antiguas (no usar nunca)
import { configureGenkit } from '@genkit-ai/core';   // v0.x, obsoleto
import Genkit from 'genkit';                          // no existe
import { googleAI } from '@genkit-ai/googleai';      // paquete legacy; usar google-genai
```

---

## 3. Inicialización

Genkit se inicializa **una sola vez** al arrancar el servidor. El objeto `ai` exportado es el que se usa en todo el módulo agent.

```typescript
// src/agent/genkit.config.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { env } from '../config/env'; // validado con Zod

/** ID de modelo en la API (p. ej. preview); revisar SDK/Google si cambia el nombre. */
export const GEMINI_MODEL_NAME = 'gemini-3-flash-preview' as const;

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  // NO configurar logLevel en producción (evita logs verbosos de Genkit)
});
```

En el flow, el modelo se referencia así:

```typescript
import { googleAI } from '@genkit-ai/google-genai';
import { ai, GEMINI_MODEL_NAME } from './genkit.config';

await ai.generate({
  model: googleAI.model(GEMINI_MODEL_NAME),
  // ...
});
```

Si un modelo nuevo aún no tiene constante exportada, puedes pasar el string del ID que reconozca el plugin, p. ej. `googleAI.model('gemini-2.5-flash')`, según la lista de modelos del paquete instalado.

---

## 4. Definición de Tools con `ai.defineTool`

Las tools son la forma en que Gemini puede llamar a tu código. Cada tool tiene: nombre, descripción, `inputSchema`, `outputSchema` y función ejecutora.

```typescript
// Patrón completo de definición de tool
const myTool = ai.defineTool(
  {
    name: 'toolName',           // camelCase, único en el flow
    description: `Descripción detallada.
      Gemini lee esto para decidir cuándo usar la tool.
      Cuanto más específica, menos alucinaciones.`,
    inputSchema: z.object({     // Zod schema — los .describe() son leídos por Gemini
      param1: z.string().describe('Qué es este parámetro'),
      param2: z.number().optional(),
    }),
    outputSchema: z.object({    // NO omitir — Gemini lo necesita para entender la respuesta
      result: z.string(),
    }),
  },
  async (input) => {            // input está tipado automáticamente según inputSchema
    return { result: 'valor' }; // debe matchear exactamente outputSchema
  }
);
```

> ⚠️ El `outputSchema` **no es opcional**. Sin él, el modelo puede malinterpretar la respuesta de la tool y comportarse de forma impredecible.

---

## 5. Llamada a `ai.generate` con tools

`ai.generate` ejecuta el ciclo de razonamiento completo, incluyendo llamadas automáticas a tools si el modelo lo decide (puede ser más de una en cadena).

```typescript
const response = await ai.generate({
  model: googleAI.model(GEMINI_MODEL_NAME),

  // System prompt: instrucciones permanentes del agente, se antepone a todo
  system: 'Eres un asistente de facturación...',

  // Historial de mensajes en formato Genkit (ver sección 6)
  messages: [
    { role: 'user',  content: [{ text: 'mensaje anterior' }] },
    { role: 'model', content: [{ text: 'respuesta anterior' }] },
    { role: 'user',  content: [{ text: 'mensaje actual' }] },
  ],

  // Array de tools disponibles para este generate
  tools: [tool1, tool2, tool3],
});

// Obtener texto de la respuesta final
const text = response.text;

// Inspeccionar qué tools se llamaron (para logging/debugging)
for (const msg of response.messages ?? []) {
  for (const part of msg.content ?? []) {
    if (part.toolRequest) {
      console.log('Tool llamada:', part.toolRequest.name);
      console.log('Con input:', part.toolRequest.input);
    }
    if (part.toolResponse) {
      console.log('Resultado:', part.toolResponse.output);
    }
  }
}
```

---

## 6. Formato del historial de mensajes

**CRÍTICO:** El historial que llega del cliente (strings) debe transformarse al formato interno de Genkit antes de pasarse a `generate`. Son formatos distintos.

```typescript
// Lo que llega en req.body.history (formato del cliente):
const clientHistory = [
  { role: 'user',  content: 'hola' },
  { role: 'model', content: 'hola, ¿en qué puedo ayudarte?' },
];

// Transformación requerida para Genkit:
// content debe ser un ARRAY de "parts", no un string directamente
const genkitMessages = [
  // Historial transformado
  ...clientHistory.map(msg => ({
    role: msg.role as 'user' | 'model',
    content: [{ text: msg.content }], // ← wrappear en array
  })),
  // Mensaje actual al final
  { role: 'user' as const, content: [{ text: currentMessage }] },
];
```

---

## 7. Tipos TypeScript útiles de Genkit

Para evitar usar `any` innecesariamente:

```typescript
import type { Part, ToolRequestPart, ToolResponsePart } from 'genkit';

// Verificar si una Part es una llamada a tool
function isToolRequest(part: Part): part is ToolRequestPart {
  return 'toolRequest' in part;
}

// Verificar si una Part es respuesta de tool
function isToolResponse(part: Part): part is ToolResponsePart {
  return 'toolResponse' in part;
}

// Tipo del historial que acepta ai.generate en messages[]
type GenkitMessage = {
  role: 'user' | 'model';
  content: Part[];
};
```

---

## 8. Manejo de errores de la API de Google

```typescript
try {
  const response = await ai.generate({ ... });
  return response.text;
} catch (error: any) {

  // Rate limit alcanzado (HTTP 429; mensaje puede incluir cuota o spending cap)
  if (error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
    throw new Error('Límite de solicitudes alcanzado. Intenta en unos segundos.');
  }

  // API key inválida o sin permisos
  if (error?.status === 401 || error?.status === 403) {
    throw new Error('Configuración de IA incorrecta. Contacta al administrador.');
  }

  // Modelo no disponible para el proyecto (retirado o ID incorrecto)
  if (error?.status === 404 && error?.message?.toLowerCase().includes('model')) {
    throw new Error('Modelo no disponible. Actualiza el ID de modelo en el backend.');
  }

  // Contenido bloqueado por filtros de seguridad de Google
  if (error?.message?.includes('SAFETY')) {
    throw new Error('La solicitud fue bloqueada por filtros de seguridad.');
  }

  // Error genérico
  console.error('[Genkit] Error inesperado:', error);
  throw new Error('El agente no pudo procesar la solicitud.');
}
```

En este proyecto, `agent.controller.ts` mapea errores concretos a **503** con códigos `AGENT_MISCONFIGURED`, `AGENT_RATE_LIMITED` y `AGENT_MODEL_UNAVAILABLE` cuando aplica.

---

## 9. Límites y cuotas (Google AI Studio)

Los límites exactos (RPM, TPM, RPD) **dependen del plan y del modelo** y cambian con el tiempo. Consulta siempre el panel de **Uso / Límite de frecuencia** en [Google AI Studio](https://aistudio.google.com/).

Modelo por defecto en código: **`gemini-3-flash-preview`**.

---

## 10. UI de desarrollo: `genkit start`

Genkit incluye una UI web para inspeccionar y probar flows en local. Muy útil durante el desarrollo para ver el trace completo de cada llamada.

```bash
# Arrancar la UI de Genkit (en terminal separada al servidor)
npx genkit start -- npm run dev

# Abre http://localhost:4000 en el navegador
# Desde ahí puedes:
#   - Ejecutar flows manualmente con inputs de prueba
#   - Ver el trace completo (qué tools se llamaron, cuántos tokens)
#   - Inspeccionar inputs y outputs de cada step del razonamiento
```

> ⚠️ La UI de Genkit (puerto 4000) es **solo para desarrollo**. No debe estar accesible en producción.

---

## 11. Errores comunes y soluciones

| Error | Causa probable | Solución |
| :--- | :--- | :--- |
| `Cannot find module 'genkit'` | Paquete no instalado | `npm install --save-exact genkit@1` |
| `googleAI is not a function` | Import de versión antigua (`v0.x`) o paquete equivocado | Usar: `import { googleAI } from '@genkit-ai/google-genai'` |
| `GOOGLE_GENAI_API_KEY not found` | Variable de entorno no configurada | Añadir a `.env` y validar en `env.ts` con Zod |
| `RESOURCE_EXHAUSTED` / HTTP 429 | Cuota, rate limit o spending cap | Revisar AI Studio / Cloud Billing; esperar o ajustar límites |
| `Tool output does not match schema` | `outputSchema` no coincide con lo retornado | Verificar que la función retorna exactamente lo que define `outputSchema` |
| `messages must alternate roles` | Historial con dos roles iguales consecutivos | Verificar que `history` alterna `user`/`model` correctamente |
| `response.text` es `undefined` | El modelo devolvió solo tool calls sin texto final | Añadir al system prompt: "Siempre termina con una respuesta en texto." |
| `configureGenkit is not a function` | Código copiado de docs de `v0.x` | Reemplazar con `genkit({ plugins: [...] })` de `genkit@1` |
