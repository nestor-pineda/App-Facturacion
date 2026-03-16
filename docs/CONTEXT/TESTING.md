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
| Componentes | Dentro de cada feature, junto al componente | `features/auth/components/ProtectedRoute.test.tsx`, `features/clients/components/ClientForm.test.tsx`, `features/services/components/ServiceForm.test.tsx`, `features/invoices/components/InvoiceForm.test.tsx`, `features/quotes/components/QuoteForm.test.tsx` |
| Páginas (listados) | Dentro de cada feature, en `pages/` | `features/clients/pages/Clients.test.tsx`, `features/services/pages/Services.test.tsx`, `features/invoices/pages/Invoices.test.tsx`, `features/quotes/pages/Quotes.test.tsx` — estados loading, empty, error con MSW |
| Integración | `src/test/integration/*.test.tsx` | `invoice-flow.test.tsx` (login → listado → crear factura), `quote-to-invoice-flow.test.tsx` (presupuesto → convertir a factura). Importan páginas desde `@/features/...`. |

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

## E2E (Playwright)

Los tests E2E ejecutan un navegador real contra el frontend (puerto 8080) y el backend (puerto 3000 vía proxy de Vite). Requieren que el **backend esté en marcha** (y la base de datos disponible); el frontend puede arrancarse manualmente o con el `webServer` de Playwright.

### Comandos

```bash
cd frontend
npm run test:e2e          # Ejecutar todos los tests E2E
npm run test:e2e:ui       # Modo UI (depuración)
npm run test:e2e:headed   # Con navegador visible
```

### Requisitos

- Backend corriendo en **3000** (p. ej. `cd backend && npm run dev`).
- Base de datos disponible (contenedor Docker o PostgreSQL local).
- `ALLOWED_ORIGINS` en el backend debe incluir `http://localhost:8080`.
- Si el puerto 8080 ya está en uso (frontend abierto en otro terminal), ejecuta con `PLAYWRIGHT_NO_WEB_SERVER=1 npm run test:e2e` para no arrancar un segundo servidor.

### Estructura

| Archivo | Descripción |
|---------|-------------|
| `frontend/playwright.config.ts` | Configuración (baseURL 8080, timeouts, webServer opcional, proyecto chromium). |
| `frontend/tests/e2e/auth.spec.ts` | Register, login, logout, redirect si no autenticado. |
| `frontend/tests/e2e/invoices.spec.ts` | Flujo: crear cliente/servicio/factura → enviar → número correlativo → descargar PDF → inmutabilidad. |
| `frontend/tests/e2e/quotes.spec.ts` | Flujo: crear cliente/servicio/presupuesto → enviar → convertir a factura. |
| `frontend/tests/e2e/helpers/auth.ts` | Helper: `registerNewUser`, `loginAsUser`, `registerAndLogin` (usuario único por ejecución). |

Los selectores usan roles y regex es/en para ser independientes del idioma de la app.

---

## Referencia en el plan

- Plan detallado: sección **2. Testing — Unitarios e Integración**, **3. E2E Testing (Playwright)** y **4. Refactorización a estructura features/** en [`siguientes-pasos.md`](../../siguientes-pasos.md).
- Estado: puntos 2, 3 y 4 implementados. Los tests de componentes y páginas viven dentro de cada feature (`src/features/*/components/*.test.tsx`, `src/features/*/pages/*.test.tsx`).
