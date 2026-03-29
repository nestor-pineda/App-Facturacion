# Sistema de Facturación para Autónomos

Aplicación web para gestión de facturación destinada a autónomos en España.

## Descripción general del proyecto

Este proyecto es una aplicación de facturación para autónomos en España con arquitectura monorepo (`backend` + `frontend`). Permite gestionar el ciclo de facturación y ofrece utilidades de soporte como envío de correos y asistente IA.

## Stack tecnológico utilizado

- **Backend:** Node.js, Express, PostgreSQL, Prisma, Genkit + `@genkit-ai/google-genai` (Gemini, p. ej. `gemini-3-flash-preview`)
- **Frontend:** React 18, TypeScript, Vite, shadcn/ui
- **Testing:** Playwright (E2E) y suites de tests por paquete
- **Entorno recomendado:** npm workspaces en monorepo

## Información sobre instalación y ejecución

### Backend (desarrollo)

```bash
cd backend
npm install
cp .env.example .env   # Configurar variables de entorno
npm run dev
```

En `backend/.env`, **`JWT_SECRET` y `JWT_REFRESH_SECRET` deben ser dos cadenas distintas**, cada una de **al menos 32 caracteres**. El arranque valida esto con Zod: si copias el mismo valor en ambas, el proceso termina con error. Usa el ejemplo de `.env.example` o genera valores aleatorios distintos para cada una.

Para que al pulsar **Enviar** en un presupuesto o factura se envíe un correo real al cliente, descomenta y rellena las variables SMTP en `backend/.env` (en `.env.example` tienes un bloque de ejemplo con [Mailtrap](https://mailtrap.io) para desarrollo).

**Asistente IA (Genkit + Gemini):** el endpoint `POST /api/v1/agent/chat` y el widget de chat del frontend necesitan una **`GOOGLE_GENAI_API_KEY` válida** de [Google AI Studio](https://aistudio.google.com/apikey). El backend usa el plugin **`@genkit-ai/google-genai`** (no el paquete legacy `@genkit-ai/googleai`). Si la clave es un placeholder o está revocada, la API responde **503** con `code: AGENT_MISCONFIGURED`. Si Google devuelve **429** (cuota, límite de frecuencia o *spending cap*), la API responde **503** con `code: AGENT_RATE_LIMITED`. Si el modelo configurado no está disponible para tu proyecto (**404**), la API responde **503** con `code: AGENT_MODEL_UNAVAILABLE`. Tras cambiar `.env`, reinicia el backend o deja que nodemon recargue (también vigila `.env` en `npm run dev`).

### Frontend (desarrollo)

```bash
cd frontend
npm install
cp .env.example .env.development   # VITE_API_URL vacío usa el proxy de Vite
npm run dev
```

El frontend arranca en `http://localhost:8080` y hace proxy de las peticiones `/api` al backend en `localhost:3000`.

### Monorepo (backend + frontend a la vez)

```bash
npm install            # Instala concurrently en root
npm run install:all    # Instala dependencias de todos los paquetes
npm run dev            # Arranca backend y frontend en paralelo
```

### Popular la base de datos (datos de prueba)

Tras levantar el servidor y aplicar las migraciones, ejecuta el seed para tener datos listos para testear:

```bash
cd backend
npm run seed
```

Esto crea un usuario de prueba con clientes, servicios, presupuestos y facturas de ejemplo.

**Credenciales de acceso:**

| Campo    | Valor                    |
|----------|--------------------------|
| Email    | `admin@facturacion.test` |
| Password | `Test1234!`              |

> El script es idempotente: si lo ejecutas varias veces, limpia los datos del usuario de prueba y los vuelve a insertar desde cero.

### Prisma Studio

Para inspeccionar y editar la base de datos con la interfaz gráfica de Prisma, ejecuta Prisma Studio **desde la carpeta del backend** (donde está el schema y el `.env` con `DATABASE_URL`):

```bash
cd backend
npx prisma studio
```

Se abrirá en el navegador (por defecto `http://localhost:5555`). Asegúrate de tener configurado `DATABASE_URL` en `backend/.env` (por ejemplo copiando `backend/.env.example` a `backend/.env` y ajustando usuario, contraseña y nombre de la base de datos).

## Estructura del proyecto

```
APP-FACTURACION/
├── backend/        # API Node.js + Express + PostgreSQL + Prisma
├── frontend/       # React 18 + TypeScript + Vite + shadcn/ui (integrado con backend)
└── docs/           # Documentación técnica
```

## Funcionalidades principales

- Gestión de clientes y servicios.
- Creación y gestión de presupuestos y facturas.
- Envío de presupuestos/facturas por correo mediante SMTP.
- Asistente IA para soporte en el flujo de facturación (`POST /api/v1/agent/chat`).
- Datos de prueba y credenciales preconfiguradas para entorno de desarrollo.

## Información adicional

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev:backend` | Arranca el backend en modo desarrollo |
| `npm run dev:frontend` | Arranca el frontend en modo desarrollo |
| `npm run dev` | Arranca ambos en paralelo |
| `npm run build` | Compila backend y frontend |
| `npm run test` | Ejecuta tests de todos los paquetes |
| `npm run install:all` | Instala dependencias de todos los paquetes |

Para ejecutar solo los tests del frontend: `cd frontend && npm run test`. Para solo el backend: `cd backend && npm test`. Ver [`docs/CONTEXT/TESTING.md`](docs/CONTEXT/TESTING.md).

### Tests E2E (Playwright)

Los tests E2E usan un navegador real contra el frontend y el backend. **Requisitos:** backend en marcha (puerto 3000), base de datos disponible y `ALLOWED_ORIGINS` con `http://localhost:8080`.

```bash
cd frontend
npm run test:e2e          # Ejecutar todos los tests E2E
npm run test:e2e:ui       # Modo UI (depuración)
npm run test:e2e:headed   # Con navegador visible
```

Si el puerto 8080 ya está en uso (frontend abierto en otro terminal), ejecuta: `PLAYWRIGHT_NO_WEB_SERVER=1 npm run test:e2e`. Detalle en [`docs/CONTEXT/TESTING.md`](docs/CONTEXT/TESTING.md#e2e-playwright).

## Preparación para producción

Sigue estos pasos antes de desplegar (por ejemplo Frontend en [Vercel](https://vercel.com), Backend en [Render](https://render.com), base de datos en [Neon](https://neon.tech)).

### 1. Backend — comprobaciones y build

Desde la raíz del repo:

```bash
cd backend
npm ci
npm run typecheck    # TypeScript sin errores
npm run lint        # ESLint sin errores (o npm run lint:fix)
npm run build       # Genera dist/ (necesario para npm start)
```

En producción el servidor arranca con `node dist/index.js`; si no ejecutas `build`, no existirá `dist/` y el proceso fallará.

### 2. Backend — Prisma en el servidor

En el entorno de producción (o en el comando de build del despliegue) hay que generar el cliente Prisma y aplicar migraciones:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

`prisma migrate deploy` usa la variable `DATABASE_URL` del entorno (la URL de tu base de datos de producción).

### 3. Frontend — comprobaciones y build

```bash
cd frontend
npm ci
npx tsc --noEmit    # TypeScript sin errores
npm run lint        # ESLint sin errores
npm run build       # Genera la carpeta dist/ para servir estáticos
```

El build de Vite deja el resultado en `frontend/dist/`. En Vercel (o similar) el *Build Command* será `npm run build` y el *Output Directory* `dist`.

### 4. Variables de entorno en producción

**Backend** (Render u otro host):

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de PostgreSQL (ej. Neon) |
| `JWT_SECRET` | Secreto de ≥32 caracteres (debe ser **distinto** de `JWT_REFRESH_SECRET`; Zod lo comprueba al arrancar) |
| `JWT_REFRESH_SECRET` | Otro secreto de ≥32 caracteres, **distinto** del anterior |
| `ALLOWED_ORIGINS` | URL del frontend en producción (ej. `https://tu-app.vercel.app`) |
| `PORT` | Lo suele asignar el host (ej. Render) |
| `NODE_ENV` | `production` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Opcional; para envío real de correos al cliente |

**Frontend** (Vercel u otro):

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL pública del backend (ej. `https://tu-api.onrender.com`) |

Si no defines `VITE_API_URL`, el frontend asumirá peticiones relativas a `/api` (válido si usas proxy en el mismo dominio).

### 5. Comandos de despliegue típicos

**Backend (ej. Render):**

- **Root Directory:** `backend` (si el repo es monorepo en la raíz).
- **Build Command:** `npm install --include=dev && npm run build && npx prisma generate`  
  En Render, `npm install` suele omitir `devDependencies` (`NODE_ENV=production`). Sin ellas falla el build: faltan `typescript`, `@types/express`, etc. **`--include=dev`** fuerza instalar lo necesario para compilar.
- **Start Command:** `npx prisma migrate deploy && npm start`

(O incluir `prisma migrate deploy` en un script de start si prefieres ejecutarlo en cada arranque.)

**Frontend (ej. Vercel):**

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Root Directory:** `frontend` (si el repo es monorepo en la raíz)

### 6. Recomendaciones adicionales

- Revisar y eliminar `console.log` de código que no sea de depuración.
- En producción, usar un servicio SMTP real (no Mailtrap sandbox) si quieres que los correos lleguen al cliente.
- Consultar [`docs/CONTEXT/ENVIRONMENT.md`](docs/CONTEXT/ENVIRONMENT.md) para el listado completo de variables.

## Documentación

- [`docs/CONTEXT/API.md`](docs/CONTEXT/API.md) — Referencia de endpoints REST
- [`docs/CONTEXT/TESTING.md`](docs/CONTEXT/TESTING.md) — Setup de tests (unitarios, componentes, integración; frontend y backend)
- [`docs/CONTEXT/NAMING-CONVENTIONS.md`](docs/CONTEXT/NAMING-CONVENTIONS.md) — Convención snake_case (API/backend) vs camelCase (frontend); evita fallos de mapeo
- [`docs/CONTEXT/DATABASE.md`](docs/CONTEXT/DATABASE.md) — Esquema de base de datos
- [`docs/CONTEXT/ENVIRONMENT.md`](docs/CONTEXT/ENVIRONMENT.md) — Variables de entorno
- [`docs/decisions.md`](docs/decisions.md) — Decisiones de arquitectura
- [`docs/domain.md`](docs/domain.md) — Modelo de dominio
- [`docs/product.md`](docs/product.md) — Especificación de producto
- [`siguientes-pasos.md`](siguientes-pasos.md) — Próximos pasos: i18n, tests (p.2 implementado), refactor, despliegue

### Design Docs

- [`docs/designs/001-pdf-generation-design-doc.md`](docs/designs/001-pdf-generation-design-doc.md) — Generación de PDFs con Puppeteer
- [`docs/designs/002-httpOnly-Cookies-design-doc.md`](docs/designs/002-httpOnly-Cookies-design-doc.md) — Autenticación con cookies httpOnly
- [`docs/designs/003-frontend-backend-integration-design-doc.md`](docs/designs/003-frontend-backend-integration-design-doc.md) — Integración frontend-backend
