# Testing — Unitarios e integración

Documentación del setup de tests del proyecto (punto 2 de [siguientes-pasos.md](../../siguientes-pasos.md)).

---

## Frontend (Vitest + RTL + MSW)

### Dependencias

- **Vitest** — runner de tests
- **@testing-library/react** + **@testing-library/jest-dom** — render y aserciones
- **@testing-library/user-event** — simulación de interacción de usuario
- **MSW** (Mock Service Worker) — mock de la API en tests
- **jsdom** — entorno de navegador en Node

### Configuración

- **`frontend/vitest.config.ts`** — Vitest con plugin React, `jsdom`, alias `@/`, `setupFiles: src/test/setup.ts`
- **`frontend/src/test/setup.ts`** — jest-dom, i18n (init síncrono para tests), mock de `window.matchMedia`
- **`frontend/src/test/test-utils.tsx`** — wrapper de `render` con `QueryClientProvider`, `MemoryRouter`, `I18nextProvider`, `TooltipProvider`; re-export de `userEvent`
- **`frontend/src/test/mocks/handlers.ts`** — handlers MSW para auth, clients, services, quotes, invoices
- **`frontend/src/test/mocks/server.ts`** — `setupServer(...handlers)` para usar en tests que necesiten API mockeada

### Comandos

```bash
cd frontend
npm run test          # Ejecutar todos los tests una vez
npm run test:watch    # Modo watch (re-ejecuta al guardar)
```

### Estructura de tests

| Tipo | Ubicación | Descripción |
|------|-----------|-------------|
| Unitarios | Junto al módulo (`.test.ts` / `.test.tsx`) | `lib/calculations.test.ts`, `schemas/client.schema.test.ts`, `store/authStore.test.ts`, `components/StatusBadge.test.tsx` |
| Componentes | Mismo directorio que el componente | `ProtectedRoute.test.tsx`, `forms/ClientForm.test.tsx`, `forms/ServiceForm.test.tsx`, `forms/InvoiceForm.test.tsx`, `forms/QuoteForm.test.tsx` |
| Páginas (listados) | `src/pages/*.test.tsx` | `Clients.test.tsx`, `Services.test.tsx`, `Invoices.test.tsx`, `Quotes.test.tsx` — estados loading, empty, error con MSW |
| Integración | `src/test/integration/*.test.tsx` | `invoice-flow.test.tsx` (login → listado → crear factura), `quote-to-invoice-flow.test.tsx` (presupuesto → convertir a factura) |

### Uso en tests

- Para componentes que no llaman a la API: `import { render, screen, userEvent } from '@/test/test-utils'`
- Para tests que usan API: en el archivo, `beforeAll(() => server.listen())`, `afterEach(() => server.resetHandlers())`, `afterAll(() => server.close())` e `import { server } from '@/test/mocks/server'`
- Para rutas: pasar `routerProps: { initialEntries: ['/ruta'] }` al `render` del test-utils

---

## Backend (Vitest + supertest)

### Comandos

```bash
cd backend
npm test                  # Todos los tests
npm run test:watch        # Modo watch
npm run test:coverage     # Con informe de cobertura
npm run test:unit         # Solo tests unitarios
npm run test:integration  # Solo tests de integración
```

Los tests de integración usan una base de datos real. El contenedor Docker debe estar en marcha.

### Estructura

- **`backend/tests/unit/`** — middlewares, services, templates (auth, pdf, quote, invoice, email, formatters)
- **`backend/tests/integration/`** — auth (login, register, refresh), clients, services, quotes, invoices, pdf
- **`backend/tests/helpers/`** — helpers de autenticación (cookies) para integración

### Test de cliente duplicado (409)

En **`backend/tests/integration/clients.test.ts`** existe un test que comprueba que al crear un cliente con un email ya existente para el mismo usuario se devuelve **409** y `EMAIL_ALREADY_EXISTS`. Está marcado con **`it.skip`** porque requiere que el modelo Prisma `Client` tenga `@@unique([user_id, email])`. Cuando se añada ese constraint y se aplique la migración, se puede quitar el `.skip` para que el test se ejecute.

---

## Referencia en el plan

- Plan detallado: sección **2. Testing — Unitarios e Integración** en [`siguientes-pasos.md`](../../siguientes-pasos.md).
- Estado: punto 2 implementado; documentación en este archivo.
