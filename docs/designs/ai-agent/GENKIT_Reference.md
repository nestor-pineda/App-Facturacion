# Referencia Técnica: Genkit + Google AI
**Guía de implementación para el agente de facturación — Solo `@genkit-ai/googleai` (Free Tier)**

---

## 1. Instalación y versiones exactas

```bash
# Instalar con versiones exactas para evitar breaking changes
npm install --save-exact genkit@1 @genkit-ai/googleai@1

# Verificar instalación correcta
npm list genkit @genkit-ai/googleai

# UI de desarrollo local (opcional pero muy recomendada)
# Lanza inspector de flows en http://localhost:4000
npx genkit start -- npm run dev
```

> ⚠️ `genkit@1` es la versión estable. **NO usar `genkit@0.x`** (alpha). La API cambió completamente entre versiones.

---

## 2. Imports correctos

Los imports cambiaron entre versiones. Usar **siempre** estos:

```typescript
// ✅ CORRECTO — imports de genkit@1
import { genkit } from 'genkit';
import { googleAI, gemini20Flash } from '@genkit-ai/googleai';

// ❌ INCORRECTO — imports de versiones antiguas (no usar nunca)
import { configureGenkit } from '@genkit-ai/core';   // v0.x, obsoleto
import Genkit from 'genkit';                          // no existe
import { geminiPro } from '@genkit-ai/googleai';      // nombre cambiado
```

---

## 3. Inicialización

Genkit se inicializa **una sola vez** al arrancar el servidor. El objeto `ai` exportado es el que se usa en todo el módulo agent.

```typescript
// src/agent/genkit.config.ts
import { genkit } from 'genkit';
import { googleAI, gemini20Flash } from '@genkit-ai/googleai';
import { env } from '../config/env'; // validado con Zod

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  // NO configurar logLevel en producción (evita logs verbosos de Genkit)
});

// Re-exportar el modelo para usarlo en flows sin importar googleai de nuevo
export { gemini20Flash };
```

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
  model: gemini20Flash,

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

  // Rate limit alcanzado (15 RPM en free tier)
  if (error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
    throw new Error('Límite de solicitudes alcanzado. Intenta en unos segundos.');
  }

  // API key inválida o sin permisos
  if (error?.status === 401 || error?.status === 403) {
    throw new Error('Configuración de IA incorrecta. Contacta al administrador.');
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

---

## 9. Límites del Free Tier de Google AI

Modelo: `gemini-2.0-flash`

| Límite | Valor |
| :--- | :--- |
| Requests por minuto (RPM) | 15 RPM |
| Tokens por minuto (TPM) | 1.000.000 TPM |
| Requests por día (RPD) | 1.500 RPD |
| Contexto máximo (input) | 1.048.576 tokens |
| Output máximo | 8.192 tokens |
| **Coste** | **0€** |

El límite de 15 RPM es suficiente para uso personal. Si durante pruebas intensivas se alcanza, el error será `RESOURCE_EXHAUSTED` (HTTP 429) y se maneja en el bloque `catch` del punto 8.

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
| `googleAI is not a function` | Import de versión antigua (`v0.x`) | Usar: `import { googleAI } from '@genkit-ai/googleai'` |
| `GOOGLE_GENAI_API_KEY not found` | Variable de entorno no configurada | Añadir a `.env` y validar en `env.ts` con Zod |
| `RESOURCE_EXHAUSTED` | Rate limit del free tier (15 RPM) | Esperar 60 segundos o reducir frecuencia de llamadas |
| `Tool output does not match schema` | `outputSchema` no coincide con lo retornado | Verificar que la función retorna exactamente lo que define `outputSchema` |
| `messages must alternate roles` | Historial con dos roles iguales consecutivos | Verificar que `history` alterna `user`/`model` correctamente |
| `response.text` es `undefined` | El modelo devolvió solo tool calls sin texto final | Añadir al system prompt: "Siempre termina con una respuesta en texto." |
| `configureGenkit is not a function` | Código copiado de docs de `v0.x` | Reemplazar con `genkit({ plugins: [...] })` de `genkit@1` |
