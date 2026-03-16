# Design Doc: Integración Frontend-Backend

## Estado
[x] Borrador | [ ] En revisión | [ ] Aprobado | [ ] Implementado

**Autor:** Agente IA  
**Fecha:** 2026-03-09  
**Prioridad:** Alta (bloqueante para entrega del MVP)  
**Relacionado con:**  
- `docs/designs/002-httpOnly-Cookies-design-doc.md` (autenticación)  
- `docs/designs/001-pdf-generation-design-doc.md` (descarga de PDFs)  
- `.cursor/rules/frontend.md` (arquitectura objetivo del frontend)  
- `docs/CONTEXT/API.md` (contratos de API)

---

## Resumen Ejecutivo

- **Problema:** Existe un backend funcional con API REST completa y un frontend generado con Lovable que usa datos mock. Ambos sistemas están desconectados.
- **Solución:** Plan de integración en 7 fases que conecta el frontend al backend, mantiene el diseño visual de Lovable, adapta los modelos de datos, implementa autenticación con httpOnly cookies, e incorpora i18n (es/en).
- **Impacto:** Al completar todas las fases, el MVP será funcional end-to-end: un autónomo podrá registrarse, gestionar clientes/servicios, crear facturas/presupuestos, y descargar PDFs.

---

## 1. Problema

El proyecto cuenta con dos sistemas independientes que necesitan converger:

1. **Backend (completo):** API REST con Express, PostgreSQL/Prisma, autenticación JWT en httpOnly cookies, generación de PDFs con Puppeteer, validación Zod, tests integrados.
2. **Frontend (UI shell):** React 18 + Vite + shadcn/ui generado con Lovable. Tiene layout, navegación, y páginas con mock data. No tiene API client, autenticación, formularios funcionales, ni tipos alineados al dominio.

Sin integración, el frontend es una cáscara visual sin funcionalidad real.

---

## 2. Contexto

### 2.1 Estado actual del Backend

| Aspecto | Estado |
|---------|--------|
| API REST | Completa: auth, clients, services, quotes, invoices, PDFs |
| Autenticación | JWT en httpOnly cookies (Design Doc 002) |
| Base de datos | PostgreSQL con Prisma, migraciones aplicadas |
| Validación | Zod en todos los endpoints |
| Testing | Unit + integration tests con Vitest + Supertest |
| PDF | Puppeteer, endpoints `/invoices/:id/pdf` y `/quotes/:id/pdf` |

**Endpoints disponibles:**

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/clients
POST   /api/v1/clients
PUT    /api/v1/clients/:id

GET    /api/v1/services
POST   /api/v1/services

GET    /api/v1/quotes
POST   /api/v1/quotes
PUT    /api/v1/quotes/:id
DELETE /api/v1/quotes/:id
PATCH  /api/v1/quotes/:id/send
POST   /api/v1/quotes/:id/convert
GET    /api/v1/quotes/:id/pdf

GET    /api/v1/invoices
POST   /api/v1/invoices
PUT    /api/v1/invoices/:id
DELETE /api/v1/invoices/:id
PATCH  /api/v1/invoices/:id/send
GET    /api/v1/invoices/:id/pdf
```

**Formato de respuesta estándar:**

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "message": "...", "code": "...", "details": [...] } }
```

### 2.2 Estado actual del Frontend

| Aspecto | Estado |
|---------|--------|
| Routing | React Router v6 con layout: `/`, `/clients`, `/services`, `/quotes`, `/invoices`, `/settings` |
| UI Components | 40+ componentes shadcn/ui instalados |
| Layout | Sidebar colapsable + header + contenido principal |
| Datos | Mock arrays locales en cada página |
| API Client | No existe |
| Autenticación | No existe (ni páginas, ni store, ni rutas protegidas) |
| Formularios | No existen (solo vistas de listado) |
| i18n | No configurado (UI en inglés) |
| Testing | Vitest configurado pero sin tests reales |
| Stores | No existe (TanStack Query configurado pero sin uso) |

### 2.3 Dependencias instaladas vs. requeridas

| Dependencia | Instalada | Requerida |
|-------------|-----------|-----------|
| `react` / `react-dom` 18 | Si | Si |
| `react-router-dom` v6 | Si | Si |
| `@tanstack/react-query` v5 | Si | Si |
| `react-hook-form` | Si | Si |
| `@hookform/resolvers` | Si | Si |
| `zod` | Si | Si |
| `date-fns` | Si | Si |
| `sonner` | Si | Si |
| `lucide-react` | Si | Si |
| `tailwindcss` + `tailwindcss-animate` | Si | Si |
| shadcn/ui (Radix) | Si | Si |
| `clsx` + `tailwind-merge` | Si | Si |
| `axios` | **No** | Si |
| `zustand` | **No** | Si |
| `react-i18next` + `i18next` | **No** | Si |
| `i18next-browser-languagedetector` | **No** | Si |
| `msw` | **No** | Si |
| `@playwright/test` | **No** | Si |
| `@testing-library/user-event` | **No** | Si |

---

## 3. Análisis de Brechas (Gap Analysis)

### 3.1 Modelo de datos: Lovable vs. Backend

#### Clientes

| Campo Lovable (mock) | Campo Backend (API) | Acción |
|----------------------|---------------------|--------|
| `id: number` | `id: string (UUID)` | Cambiar tipo a `string` |
| `name` | `nombre` | Renombrar |
| `email` | `email` | Compatible |
| `phone` | `telefono` | Renombrar |
| `projects: number` | No existe | Eliminar (no es del dominio) |
| No existe | `cif_nif` | Agregar |
| No existe | `direccion` | Agregar |
| No existe | `user_id` | Implícito (filtrado por auth) |

#### Servicios

| Campo Lovable (mock) | Campo Backend (API) | Acción |
|----------------------|---------------------|--------|
| `id: number` | `id: string (UUID)` | Cambiar tipo |
| `name` | `nombre` | Renombrar |
| `price` | `precio_base` | Renombrar |
| `unit` | No existe | Eliminar |
| `description` | `descripcion` | Renombrar |
| No existe | `iva_porcentaje` | Agregar (siempre 21 en MVP) |

#### Facturas

| Campo Lovable (mock) | Campo Backend (API) | Acción |
|----------------------|---------------------|--------|
| `id: number` | `id: string (UUID)` | Cambiar tipo |
| `number: "INV-001"` | `numero: "2026/001"` o `null` | Cambiar formato |
| `client: string` | `client: Client` (objeto relacionado) | Cambiar de string a objeto |
| `amount` | `total` | Renombrar |
| `status: "draft" \| "issued" \| "paid" \| "overdue"` | `estado: "borrador" \| "enviada"` | **Reducir estados** |
| `date` | `fecha_emision` | Renombrar |
| `dueDate` | No existe | Eliminar (no es del dominio MVP) |
| No existe | `subtotal`, `total_iva` | Agregar |
| No existe | `notas` | Agregar |
| No existe | `lines: InvoiceLine[]` | Agregar |

#### Presupuestos

| Campo Lovable (mock) | Campo Backend (API) | Acción |
|----------------------|---------------------|--------|
| `status: "draft" \| "sent" \| "accepted" \| "rejected"` | `estado: "borrador" \| "enviado"` | **Reducir estados** |
| (Similar mapping que facturas) | | |

### 3.2 Statuses: estados no alineados

El frontend de Lovable define estados que **no existen** en el dominio del backend:

| Estado Lovable | Existe en Backend | Acción |
|---------------|-------------------|--------|
| `draft` | Si → `borrador` | Mapear via i18n |
| `sent` | Si → `enviado`/`enviada` | Mapear via i18n |
| `issued` | No (equivale a `enviada`) | Eliminar, usar `enviada` |
| `paid` | No | Eliminar (fuera del MVP) |
| `overdue` | No | Eliminar (fuera del MVP) |
| `accepted` | No | Eliminar (fuera del MVP) |
| `rejected` | No | Eliminar (fuera del MVP) |
| `pending` | No | Eliminar |

El componente `StatusBadge` debe refactorizarse para soportar solo los estados del dominio.

### 3.3 Páginas y rutas faltantes

| Ruta | Estado | Necesaria para MVP |
|------|--------|-------------------|
| `/login` | **Falta** | Si |
| `/register` | **Falta** | Si |
| `/clients/new` | **Falta** (sidebar enlaza pero no existe) | Si |
| `/clients/:id` | **Falta** | Si |
| `/services/new` | **Falta** | Si |
| `/invoices/new` | **Falta** (sidebar enlaza pero no existe) | Si |
| `/invoices/:id` | **Falta** | Si |
| `/quotes/new` | **Falta** (sidebar enlaza pero no existe) | Si |
| `/quotes/:id` | **Falta** | Si |
| `/` (dashboard) | Existe (mock) | Si (conectar a API) |
| `/clients` | Existe (mock) | Si (conectar a API) |
| `/services` | Existe (mock) | Si (conectar a API) |
| `/invoices` | Existe (mock) | Si (conectar a API) |
| `/quotes` | Existe (mock) | Si (conectar a API) |
| `/settings` | Existe (placeholder) | No (post-MVP) |

### 3.4 Infraestructura faltante

| Componente | Estado |
|-----------|--------|
| API Client (Axios) | No existe |
| Auth store (Zustand) | No existe |
| Auth interceptors (refresh 401) | No existe |
| Protected routes | No existe |
| Tipos TypeScript de entidades | No existe |
| Schemas Zod frontend | No existe |
| i18n (react-i18next) | No existe |
| Variables de entorno (`.env`) | No existe |
| Vite proxy para dev | No configurado |
| MSW handlers para testing | No existe |
| Error handling global | No existe |

---

## 4. Solución Propuesta

### 4.1 Principio rector

> **Mantener el diseño visual de Lovable, reemplazar los datos y la lógica para conectar con el backend real.**

No se reestructurarán las carpetas al estilo `features/` de `frontend.md` en esta fase. Se prioriza la conexión funcional sobre la reorganización de archivos. La migración a la estructura `features/` se contempla como refactor posterior una vez el MVP funcione end-to-end.

### 4.2 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER                          │
│                                                     │
│  ┌───────────┐  ┌───────────┐  ┌────────────────┐  │
│  │  Zustand   │  │ TanStack  │  │  React Router  │  │
│  │ AuthStore  │  │   Query   │  │ ProtectedRoute │  │
│  └─────┬─────┘  └─────┬─────┘  └───────┬────────┘  │
│        │              │                 │            │
│        │    ┌─────────▼─────────┐       │            │
│        └───►│   Axios Client    │◄──────┘            │
│             │ (withCredentials) │                     │
│             └────────┬──────────┘                     │
│                      │  401 → auto refresh            │
│                      │  Cookie: accessToken           │
└──────────────────────┼──────────────────────────────┘
                       │ HTTPS
┌──────────────────────┼──────────────────────────────┐
│               BACKEND (Express)                      │
│                      │                               │
│  ┌──────────┐  ┌─────▼──────┐  ┌────────────────┐  │
│  │   CORS   │  │  Cookie    │  │   Auth MW      │  │
│  │credentials│  │  Parser   │  │ (JWT verify)   │  │
│  └──────────┘  └────────────┘  └───────┬────────┘  │
│                                         │            │
│  ┌──────────────────────────────────────▼────────┐  │
│  │          Controllers / Services               │  │
│  │  auth · clients · services · quotes · invoices │  │
│  └───────────────────────┬──────────────────────┘  │
│                          │                          │
│  ┌───────────────────────▼──────────────────────┐  │
│  │            PostgreSQL (Prisma)                │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 4.3 Vite Dev Proxy

En desarrollo, el frontend corre en `localhost:8080` y el backend en `localhost:3000`. Para evitar problemas de CORS en desarrollo y simplificar la configuración, se usará el proxy de Vite:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

Con esta configuración:
- **Desarrollo:** `VITE_API_URL = ""` (vacío, usa proxy relativo: `/api/v1/...`)
- **Producción:** `VITE_API_URL = "https://tu-backend.onrender.com"` (URL completa)

---

## 5. Alternativas Descartadas

### 5.1 Reestructurar carpetas a `features/` antes de integrar

**Descartada porque:** Añade una refactorización masiva antes de tener funcionalidad. Es más seguro primero conectar todo y luego reorganizar con tests que protejan de regresiones.

### 5.2 Usar `fetch` nativo en vez de Axios

**Descartada porque:** Axios ofrece interceptores para el refresh automático de tokens, transformación de respuestas, y configuración centralizada de `withCredentials`. Implementar esto con `fetch` requiere más código boilerplate.

### 5.3 Generar tipos desde OpenAPI/Swagger

**Descartada porque:** El backend no expone un schema OpenAPI. La complejidad de configurarlo no se justifica en MVP. Los tipos se definirán manualmente alineados al schema Prisma.

### 5.4 Compartir código (monorepo con paquete `shared`)

**Descartada porque:** Añade complejidad de build (workspace linking, publicación de paquetes). Los schemas Zod del frontend y del backend son ligeramente diferentes (el frontend no valida campos generados por el servidor como `id`, `created_at`). Se duplicarán tipos con disciplina.

---

## 6. Trade-offs

| Se gana | Se sacrifica |
|---------|-------------|
| MVP funcional end-to-end | Estructura de carpetas no es la ideal de `frontend.md` todavía |
| Diseño visual preservado de Lovable | Algunos componentes necesitan refactor (StatusBadge, mock data) |
| Auth segura con httpOnly cookies desde día 1 | Complejidad de interceptors y refresh logic |
| i18n desde el inicio (es/en) | Más trabajo inicial que hardcodear textos |
| Tipos duplicados (FE/BE) | Riesgo de divergencia si el schema cambia |

---

## 7. Plan de Implementación

### Fase 0: Dependencias y Configuración Base

**Objetivo:** Instalar todas las dependencias faltantes y configurar la infraestructura base.

**Tareas:**

1. **Instalar dependencias de producción:**

```bash
cd frontend
npm install axios zustand react-i18next i18next i18next-browser-languagedetector
```

2. **Instalar dependencias de desarrollo:**

```bash
npm install -D msw @playwright/test @testing-library/user-event
```

3. **Crear archivos de entorno:**

```
frontend/.env.development
  VITE_API_URL=
  VITE_ENV=development

frontend/.env.production
  VITE_API_URL=https://tu-backend.onrender.com
  VITE_ENV=production

frontend/.env.example
  VITE_API_URL=
  VITE_ENV=development
```

4. **Configurar Vite proxy:**

Añadir configuración de proxy en `vite.config.ts` para redirigir `/api` al backend local.

5. **Configurar constantes globales:**

Crear `src/lib/constants.ts` con constantes del dominio:

```typescript
export const IVA_DEFAULT = 21;
export const INVOICE_NUMBER_FORMAT = 'YYYY/NNN';

export const ESTADO_BORRADOR = 'borrador' as const;
export const ESTADO_ENVIADA = 'enviada' as const;
export const ESTADO_ENVIADO = 'enviado' as const;

export const API_ERROR_CODES = {
  NO_TOKEN: 'NO_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  ALREADY_SENT: 'ALREADY_SENT',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVOICE_DRAFT: 'INVOICE_DRAFT',
} as const;
```

6. **Eliminar `App.css`** (no se importa en ningún sitio).

**Criterio de completitud:** `npm run build` ejecuta sin errores, proxy redirige `/api` al backend.

---

### Fase 1: Tipos TypeScript y Schemas Zod

**Objetivo:** Definir los tipos de entidades del dominio y los schemas de validación del frontend, alineados al backend.

**Tareas:**

1. **Crear `src/types/entities.ts`:**

```typescript
export interface User {
  id: string;
  email: string;
  nombreComercial: string;
  nif: string;
  direccionFiscal: string;
  telefono?: string;
}

export interface Client {
  id: string;
  nombre: string;
  email: string;
  cifNif: string;
  direccion: string;
  telefono?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  nombre: string;
  descripcion?: string;
  precioBase: number;
  ivaPorcentaje: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLine {
  id: string;
  serviceId: string | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  ivaPorcentaje: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  numero: string | null;
  estado: 'borrador' | 'enviada';
  fechaEmision: string;
  subtotal: number;
  totalIva: number;
  total: number;
  notas?: string;
  client: Client;
  lines: InvoiceLine[];
  createdAt: string;
  updatedAt: string;
}

export interface QuoteLine {
  id: string;
  serviceId: string | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  ivaPorcentaje: number;
  subtotal: number;
}

export interface Quote {
  id: string;
  numero?: string | null;
  estado: 'borrador' | 'enviado';
  fecha: string;
  subtotal: number;
  totalIva: number;
  total: number;
  notas?: string;
  client: Client;
  lines: QuoteLine[];
  createdAt: string;
  updatedAt: string;
}
```

2. **Crear `src/types/api.ts`:**

```typescript
export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: { total: number };
}
```

3. **Crear `src/types/enums.ts`:**

```typescript
export type EstadoInvoice = 'borrador' | 'enviada';
export type EstadoQuote = 'borrador' | 'enviado';
```

4. **Crear schemas Zod frontend** (`src/schemas/`):

- `auth.schema.ts` — login (email, password), register (email, password, nombreComercial, nif, direccionFiscal, telefono?)
- `client.schema.ts` — nombre, email, cifNif, direccion, telefono?
- `service.schema.ts` — nombre, descripcion?, precioBase
- `invoice.schema.ts` — clientId, fechaEmision, notas?, lines[]
- `quote.schema.ts` — clientId, fecha, notas?, lines[]

**Criterio de completitud:** Todos los tipos compilados sin errores. Los schemas Zod validan correctamente inputs de ejemplo.

---

### Fase 2: API Client y Autenticación

**Objetivo:** Crear el cliente HTTP con Axios, implementar autenticación completa con httpOnly cookies, y crear las páginas de Login y Register.

**Tareas:**

1. **Crear `src/api/client.ts`:**

- Instancia Axios con `baseURL: import.meta.env.VITE_API_URL` y `withCredentials: true`
- Interceptor de respuesta para refresh automático en 401 (según Design Doc 002)
- Cola de requests fallidos mientras se refresca el token
- Logout automático si el refresh también falla

2. **Crear `src/api/endpoints/auth.ts`:**

```typescript
export const loginUser = (data: LoginInput) =>
  apiClient.post('/api/v1/auth/login', data);

export const registerUser = (data: RegisterInput) =>
  apiClient.post('/api/v1/auth/register', data);

export const refreshToken = () =>
  apiClient.post('/api/v1/auth/refresh');

export const logoutUser = () =>
  apiClient.post('/api/v1/auth/logout');
```

3. **Crear `src/store/authStore.ts`** (Zustand con persist):

- Estado: `user: User | null`, `isAuthenticated: boolean`
- Acciones: `login(user)`, `logout()`
- Persistencia: solo guarda `user` en localStorage (no tokens)

4. **Crear páginas de autenticación:**

- `src/pages/Login.tsx` — formulario con email/password, validación Zod, React Hook Form, enlace a registro
- `src/pages/Register.tsx` — formulario completo con todos los campos del usuario, validación Zod

5. **Crear componentes de ruta:**

- `src/components/ProtectedRoute.tsx` — redirige a `/login` si no autenticado
- `src/components/PublicRoute.tsx` — redirige a `/` si ya autenticado

6. **Actualizar `src/App.tsx`:**

```
Rutas públicas:
  /login    → LoginPage (envuelto en PublicRoute)
  /register → RegisterPage (envuelto en PublicRoute)

Rutas protegidas (envueltas en ProtectedRoute + AppLayout):
  /           → Dashboard
  /clients    → Clients
  /services   → Services
  /quotes     → Quotes
  /invoices   → Invoices
  /settings   → Settings
```

7. **Actualizar `AppSidebar.tsx`:**

- Añadir botón/opción de logout que llama a `logoutUser()` y `authStore.logout()`
- Mostrar nombre del usuario autenticado

**Criterio de completitud:**
- Login funciona contra backend real: envía credenciales, recibe cookies, redirige a dashboard
- Register crea usuario y redirige a login
- Rutas protegidas redirigen a login si no hay sesión
- Refresh automático funciona cuando el access token expira
- Logout limpia cookies y redirige a login

---

### Fase 3: CRUD de Clientes y Servicios

**Objetivo:** Conectar las páginas de Clientes y Servicios al backend real, reemplazando los datos mock.

**Tareas:**

1. **Crear endpoints API:**

- `src/api/endpoints/clients.ts` — `getClients()`, `createClient(data)`, `updateClient(id, data)`
- `src/api/endpoints/services.ts` — `getServices()`, `createService(data)`

2. **Crear hooks de TanStack Query:**

- `src/hooks/useClients.ts` — `useClients()` (query), `useCreateClient()` (mutation), `useUpdateClient()` (mutation)
- `src/hooks/useServices.ts` — `useServices()` (query), `useCreateService()` (mutation)

3. **Refactorizar `src/pages/Clients.tsx`:**

- Eliminar `mockClients`
- Usar `useClients()` para obtener datos reales
- Adaptar campos: `name` → `nombre`, `phone` → `telefono`, agregar `cifNif`, `direccion`
- Implementar loading state y error handling
- Añadir diálogo/página para crear cliente (botón "Add Client" → formulario con validación Zod)
- Añadir funcionalidad de edición (botón `MoreHorizontal` → menú con "Editar")

4. **Refactorizar `src/pages/Services.tsx`:**

- Eliminar `mockServices`
- Usar `useServices()` para datos reales
- Adaptar campos: `name` → `nombre`, `price` → `precioBase`, eliminar `unit`
- Implementar loading state y error handling
- Añadir diálogo/página para crear servicio

5. **Crear componentes de formulario:**

- `src/components/forms/ClientForm.tsx` — formulario reutilizable para crear/editar clientes
- `src/components/forms/ServiceForm.tsx` — formulario reutilizable para crear/editar servicios

**Criterio de completitud:**
- Listados muestran datos reales del backend
- Crear cliente/servicio funciona y refresca la lista (invalidación de cache TanStack Query)
- Editar cliente funciona
- Loading spinners visibles durante carga
- Errores de API mostrados con toast (sonner)
- Búsqueda funciona sobre datos reales

---

### Fase 4: CRUD de Presupuestos (Quotes)

**Objetivo:** Conectar la página de Presupuestos al backend, implementar creación/edición/envío.

**Tareas:**

1. **Crear `src/api/endpoints/quotes.ts`:**

- `getQuotes(filters?)`, `createQuote(data)`, `updateQuote(id, data)`, `deleteQuote(id)`, `sendQuote(id)`, `convertQuoteToInvoice(id, fecha?)`

2. **Crear hooks:**

- `src/hooks/useQuotes.ts` — queries y mutations para todas las operaciones

3. **Refactorizar `src/pages/Quotes.tsx`:**

- Eliminar `mockQuotes`
- Usar `useQuotes()` con filtros (`estado`, búsqueda)
- Adaptar filtros de status: eliminar "accepted", "rejected", usar solo "borrador"/"enviado"/"all"
- Adaptar campos al modelo del dominio

4. **Crear `src/pages/QuoteCreate.tsx`:**

- Formulario con selección de cliente (dropdown con datos de `useClients()`)
- Líneas de presupuesto dinámicas (useFieldArray): descripción, cantidad, precio, IVA
- Auto-rellenado desde catálogo de servicios (selector de servicio → snapshot de campos)
- Cálculos en tiempo real (subtotales, IVA, total)
- Validación Zod completa

5. **Crear `src/pages/QuoteDetail.tsx`:**

- Vista detallada del presupuesto con líneas
- Botones de acción condicionados por estado:
  - `borrador`: Editar, Eliminar, Enviar, Descargar PDF
  - `enviado`: Solo Descargar PDF, Convertir a Factura
- Confirmación antes de enviar (acción irreversible)

6. **Refactorizar `StatusBadge`:**

- Aceptar `estado: EstadoQuote | EstadoInvoice`
- Mapear estilos: `borrador` → amarillo, `enviado`/`enviada` → verde
- Mostrar label traducido según i18n (si implementado en esta fase) o label directo

7. **Agregar rutas nuevas en `App.tsx`:**

- `/quotes/new` → QuoteCreate
- `/quotes/:id` → QuoteDetail

**Criterio de completitud:**
- Listar presupuestos desde API con filtros funcionales
- Crear presupuesto con múltiples líneas y snapshot de servicios
- Editar presupuesto en borrador
- Enviar presupuesto (cambia estado, se vuelve inmutable)
- Eliminar presupuesto en borrador
- Convertir presupuesto a factura
- Descargar PDF

---

### Fase 5: CRUD de Facturas (Invoices)

**Objetivo:** Conectar la página de Facturas al backend, implementar creación/edición/envío/PDF.

**Tareas:**

1. **Crear `src/api/endpoints/invoices.ts`:**

- `getInvoices(filters?)`, `createInvoice(data)`, `updateInvoice(id, data)`, `deleteInvoice(id)`, `sendInvoice(id)`, `downloadInvoicePDF(id)`

2. **Crear hooks:**

- `src/hooks/useInvoices.ts` — queries y mutations
- `src/hooks/useInvoicePDF.ts` — mutation para descarga de PDF (blob → download)

3. **Refactorizar `src/pages/Invoices.tsx`:**

- Eliminar `mockInvoices`
- Adaptar filtros: solo "borrador"/"enviada"/"all" (eliminar "paid", "overdue", "issued")
- Adaptar campos: `number` → `numero` (formato YYYY/NNN), `amount` → `total`, eliminar `dueDate`
- Formatear moneda en EUR (`formatCurrency` de `lib/calculations.ts`)

4. **Crear `src/pages/InvoiceCreate.tsx`:**

- Similar a QuoteCreate pero con `fecha_emision` en vez de `fecha`
- Misma lógica de líneas dinámicas y cálculos

5. **Crear `src/pages/InvoiceDetail.tsx`:**

- Vista detallada con líneas
- Botones condicionados:
  - `borrador`: Editar, Eliminar, Enviar
  - `enviada`: Solo Descargar PDF (inmutable)
- **Enviar** genera número legal automáticamente (mostrar confirmación con advertencia de irreversibilidad)
- Descarga de PDF (solo si enviada)

6. **Crear `src/lib/calculations.ts`:**

- `calculateLineSubtotal(line)` → `cantidad * precioUnitario`
- `calculateLineIVA(line)` → `subtotal * (ivaPorcentaje / 100)`
- `calculateInvoiceTotals(lines)` → `{ subtotal, totalIva, total }`
- `formatCurrency(amount)` → formateado como EUR

7. **Agregar rutas nuevas en `App.tsx`:**

- `/invoices/new` → InvoiceCreate
- `/invoices/:id` → InvoiceDetail

**Criterio de completitud:**
- Listar facturas con filtros reales
- Crear factura con líneas, cálculos automáticos
- Editar factura en borrador
- Enviar factura → genera número correlativo, se vuelve inmutable
- Eliminar factura en borrador
- Descargar PDF de factura enviada
- Formateo de moneda en EUR

---

### Fase 6: Dashboard e i18n

**Objetivo:** Conectar el dashboard a datos reales y configurar internacionalización es/en.

**Tareas:**

1. **Refactorizar `src/pages/Index.tsx` (Dashboard):**

- Eliminar `recentItems` mock
- Mostrar métricas reales: total facturas, total presupuestos, facturas borrador, facturas enviadas
- Últimas facturas/presupuestos (últimos 5 de cada uno)
- Quick actions funcionales ("Nueva Factura", "Nuevo Presupuesto", "Nuevo Cliente")

2. **Configurar i18n:**

- Crear `src/i18n.ts` con configuración de react-i18next
- Crear archivos de traducción:
  - `public/locales/es/common.json`
  - `public/locales/en/common.json`
- Traducciones para:
  - Navegación (sidebar, header)
  - Estados (borrador/draft, enviada/sent, enviado/sent)
  - Formularios (labels, placeholders, validación)
  - Acciones (crear, editar, eliminar, enviar, descargar)
  - Mensajes de éxito/error (toasts)
  - Dashboard (métricas, títulos)

3. **Crear `src/store/localeStore.ts`:**

- Persistir idioma seleccionado
- Cambiar idioma en react-i18next al cambiar en store

4. **Crear `src/store/themeStore.ts`:**

- Toggle dark/light mode
- Persistir preferencia

5. **Actualizar componentes existentes:**

- Reemplazar textos hardcoded por `t('key')`
- Usar `formatCurrency` con locale apropiado

6. **Añadir controles de idioma y tema en la UI:**

- Selector de idioma (es/en) en header o settings
- Toggle de tema oscuro/claro en header

**Criterio de completitud:**
- Dashboard muestra datos reales del usuario autenticado
- Toda la UI disponible en español e inglés
- Cambio de idioma persiste entre sesiones
- Tema oscuro/claro funcional

---

### Fase 7: Testing y Polish

**Objetivo:** Añadir tests, corregir edge cases, y preparar para producción.

**Tareas:**

1. **Configurar MSW:**

- `src/test/mocks/handlers.ts` — handlers para todos los endpoints
- `src/test/mocks/server.ts` — servidor MSW para tests

2. **Tests unitarios (Vitest + RTL):**

- `lib/calculations.ts` — tests de cálculos
- `StatusBadge` — renderiza correctamente cada estado
- Schemas Zod — validan y rechazan inputs correctamente
- `authStore` — login/logout actualizan estado correctamente

3. **Tests de componentes:**

- Formularios de creación (client, service, invoice, quote)
- Listados con loading/error/empty states
- ProtectedRoute redirige si no autenticado

4. **Tests de integración:**

- Flujo login → dashboard → crear factura → enviar → descargar PDF
- Flujo crear presupuesto → convertir a factura

5. **Polish de UI:**

- Loading skeletons en todas las tablas/listados *(implementado: TableSkeleton, CardGridSkeleton, DashboardSkeleton en `src/components/common/`)*
- Empty states con ilustración/mensaje *(implementado: EmptyState en `src/components/common/`; icono, título, descripción y acción opcional; claves i18n emptyState por sección)*
- Confirmación en acciones destructivas (eliminar, enviar)
- Validación inline en formularios *(implementado: `mode: FORM_VALIDATION_MODE` — onTouched — en todos los formularios; constante en `lib/constants.ts`; errores debajo de cada campo)*
- Mobile responsive en todas las páginas nuevas

6. **Preparar para producción:**

- Verificar que el build de producción funciona: `npm run build`
- Verificar variables de entorno de producción
- Verificar CORS del backend acepta el dominio de producción
- Limpiar `console.log` olvidados
- Verificar TypeScript sin errores: `npx tsc --noEmit`

**Criterio de completitud:**
- Cobertura de tests unitarios ≥ 80%
- Build de producción sin errores ni warnings
- Todos los flujos principales funcionan end-to-end
- UI responsive en mobile

---

## 8. Orden de Ejecución Recomendado

```
Fase 0: Dependencias y Configuración ──────────────────► ~1 día
  │
  ▼
Fase 1: Tipos y Schemas ──────────────────────────────► ~0.5 días
  │
  ▼
Fase 2: API Client + Auth (Login/Register) ───────────► ~2 días
  │
  ├──────────────────────┐
  ▼                      ▼
Fase 3: Clientes      Fase 3: Servicios ──────────────► ~2 días
  │                      │ (pueden hacerse en paralelo)
  ├──────────────────────┘
  ▼
Fase 4: Presupuestos ────────────────────────────────► ~2-3 días
  │
  ▼
Fase 5: Facturas ────────────────────────────────────► ~2-3 días
  │
  ▼
Fase 6: Dashboard + i18n ───────────────────────────► ~2 días
  │
  ▼
Fase 7: Testing + Polish ──────────────────────────► ~2-3 días
```

**Tiempo estimado total: 12-15 días de desarrollo**

---

## 9. Criterios de Éxito

### Funcionales

- [ ] Un usuario puede registrarse, hacer login, y ser redirigido al dashboard
- [ ] El dashboard muestra datos reales del usuario autenticado
- [ ] CRUD completo de clientes funciona contra el backend
- [ ] CRUD completo de servicios funciona contra el backend
- [ ] Crear presupuesto con múltiples líneas y cálculos automáticos
- [ ] Enviar presupuesto (estado inmutable)
- [ ] Convertir presupuesto a factura
- [ ] Crear factura con múltiples líneas y cálculos automáticos
- [ ] Enviar factura → número correlativo generado automáticamente
- [ ] Factura enviada es inmutable (no se puede editar/eliminar)
- [ ] Descargar PDF de factura enviada
- [ ] Descargar PDF de presupuesto (ambos estados)
- [ ] Logout cierra sesión y limpia cookies

### Técnicos

- [ ] Refresh automático de token funciona transparentemente
- [ ] Errores de API se muestran como toasts al usuario
- [ ] Loading states visibles en todas las operaciones async
- [ ] Validación Zod en todos los formularios antes de enviar
- [ ] i18n funcional en español e inglés
- [ ] Tema oscuro/claro funcional
- [ ] Build de producción sin errores
- [ ] TypeScript sin errores (`tsc --noEmit`)
- [ ] Cobertura de tests ≥ 80%
- [ ] UI responsive (mobile + desktop)

### Seguridad

- [ ] Tokens JWT nunca expuestos en JavaScript (httpOnly cookies)
- [ ] CORS configurado con `credentials: true` y origin específico
- [ ] Rutas protegidas redirigen a login si no hay sesión
- [ ] Cada usuario solo ve sus propios datos (validado por backend)

---

## 10. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Cookies no se envían en dev (CORS) | Media | Alto | Vite proxy elimina el problema en desarrollo |
| Tipos frontend divergen del backend | Media | Medio | Disciplina: actualizar tipos FE cuando cambia schema Prisma |
| Lovable genera código difícil de mantener | Baja | Medio | Refactorizar componentes conforme se integran |
| Puppeteer falla en producción (PDF) | Baja | Medio | Ya testeado en backend; frontend solo descarga el blob |
| Performance con muchos datos en tablas | Baja | Bajo | Paginación server-side está preparada; virtualización si necesario |

---

## 11. Dependencias entre Backend y Frontend

### Cambios requeridos en el Backend

Ningún cambio funcional es necesario en el backend. La API actual cubre todas las necesidades. Solo verificar:

1. **CORS:** `ALLOWED_ORIGINS` incluye `http://localhost:8080` (puerto Vite) en desarrollo
2. **Cookies:** Configuración ya implementada según Design Doc 002
3. **Respuestas:** Formato `{ success, data, error }` consistente (ya implementado)

### Configuración necesaria del Backend para desarrollo

```env
# backend/.env (o .env.development)
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173
```

---

## 12. Archivos Clave a Crear/Modificar

### Archivos nuevos

| Archivo | Fase | Propósito |
|---------|------|-----------|
| `src/api/client.ts` | 2 | Instancia Axios con interceptors |
| `src/api/endpoints/auth.ts` | 2 | Funciones de API de autenticación |
| `src/api/endpoints/clients.ts` | 3 | Funciones de API de clientes |
| `src/api/endpoints/services.ts` | 3 | Funciones de API de servicios |
| `src/api/endpoints/quotes.ts` | 4 | Funciones de API de presupuestos |
| `src/api/endpoints/invoices.ts` | 5 | Funciones de API de facturas |
| `src/store/authStore.ts` | 2 | Estado global de autenticación |
| `src/store/localeStore.ts` | 6 | Estado de idioma |
| `src/store/themeStore.ts` | 6 | Estado de tema |
| `src/types/entities.ts` | 1 | Tipos de entidades del dominio |
| `src/types/api.ts` | 1 | Tipos de respuesta API |
| `src/types/enums.ts` | 1 | Enums del dominio |
| `src/schemas/auth.schema.ts` | 1 | Validación de login/register |
| `src/schemas/client.schema.ts` | 1 | Validación de clientes |
| `src/schemas/service.schema.ts` | 1 | Validación de servicios |
| `src/schemas/invoice.schema.ts` | 1 | Validación de facturas |
| `src/schemas/quote.schema.ts` | 1 | Validación de presupuestos |
| `src/lib/constants.ts` | 0 | Constantes del dominio |
| `src/lib/calculations.ts` | 5 | Cálculos de IVA y totales |
| `src/i18n.ts` | 6 | Configuración i18next |
| `src/components/ProtectedRoute.tsx` | 2 | Guard de rutas autenticadas |
| `src/components/PublicRoute.tsx` | 2 | Guard de rutas públicas |
| `src/components/forms/ClientForm.tsx` | 3 | Formulario de cliente |
| `src/components/forms/ServiceForm.tsx` | 3 | Formulario de servicio |
| `src/components/forms/InvoiceForm.tsx` | 5 | Formulario de factura |
| `src/components/forms/QuoteForm.tsx` | 4 | Formulario de presupuesto |
| `src/components/common/LoadingSpinner.tsx` | 2 | Spinner de carga (acciones, botones) |
| `src/components/common/TableSkeleton.tsx` | 0 | Skeleton de tabla para listados (Services, Invoices, Quotes) |
| `src/components/common/CardGridSkeleton.tsx` | 0 | Skeleton de grid de cards (Clients) |
| `src/components/common/DashboardSkeleton.tsx` | 0 | Skeleton del dashboard (stats + actions + tabla reciente) |
| `src/components/common/EmptyState.tsx` | 0 | Estado vacío: icono, título, descripción, acción opcional (listados y dashboard) |
| `src/components/common/ConfirmDialog.tsx` | 4 | Diálogo de confirmación |
| `src/pages/Login.tsx` | 2 | Página de login |
| `src/pages/Register.tsx` | 2 | Página de registro |
| `src/pages/InvoiceCreate.tsx` | 5 | Crear factura |
| `src/pages/InvoiceDetail.tsx` | 5 | Detalle de factura |
| `src/pages/QuoteCreate.tsx` | 4 | Crear presupuesto |
| `src/pages/QuoteDetail.tsx` | 4 | Detalle de presupuesto |
| `public/locales/es/common.json` | 6 | Traducciones español |
| `public/locales/en/common.json` | 6 | Traducciones inglés |
| `.env.development` | 0 | Variables de entorno dev |
| `.env.production` | 0 | Variables de entorno prod |
| `.env.example` | 0 | Ejemplo de variables |

### Archivos a modificar

| Archivo | Fase | Cambio |
|---------|------|--------|
| `vite.config.ts` | 0 | Añadir proxy `/api` |
| `src/App.tsx` | 2 | Añadir rutas auth + ProtectedRoute |
| `src/pages/Clients.tsx` | 3 | Reemplazar mock → API real |
| `src/pages/Services.tsx` | 3 | Reemplazar mock → API real |
| `src/pages/Quotes.tsx` | 4 | Reemplazar mock → API real |
| `src/pages/Invoices.tsx` | 5 | Reemplazar mock → API real |
| `src/pages/Index.tsx` | 6 | Reemplazar mock → API real |
| `src/components/StatusBadge.tsx` | 4 | Adaptar a estados del dominio |
| `src/components/AppSidebar.tsx` | 2 | Añadir logout + nombre usuario |
| `src/main.tsx` | 6 | Importar i18n |
| `package.json` | 0 | Nuevas dependencias |

---

## 13. Referencias

- [Design Doc 001: PDF Generation](./001-pdf-generation-design-doc.md)
- [Design Doc 002: httpOnly Cookies](./002-httpOnly-Cookies-design-doc.md)
- [API Reference](../CONTEXT/API.md)
- [Domain Glossary](../domain.md)
- [Product Scope](../product.md)
- [Architecture Decisions](../decisions.md)
- [Frontend Architecture](.cursor/rules/frontend.md)
