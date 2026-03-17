# Sistema de Facturación para Autónomos

Aplicación web para gestión de facturación destinada a autónomos en España.

## Estructura del Proyecto

```
APP-FACTURACION/
├── backend/        # API Node.js + Express + PostgreSQL + Prisma
├── frontend/       # React 18 + TypeScript + Vite + shadcn/ui (integrado con backend)
└── docs/           # Documentación técnica
```

## Inicio Rápido

### Backend

```bash
cd backend
npm install
cp .env.example .env   # Configurar variables de entorno
npm run dev
```

Para que al pulsar **Enviar** en un presupuesto o factura se envíe un correo real al cliente, descomenta y rellena las variables SMTP en `backend/.env` (en `.env.example` tienes un bloque de ejemplo con [Mailtrap](https://mailtrap.io) para desarrollo).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.development   # VITE_API_URL vacío usa el proxy de Vite
npm run dev
```

El frontend arranca en `http://localhost:8080` y hace proxy de las peticiones `/api` al backend en `localhost:3000`.

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

### Monorepo (ambos a la vez)

```bash
npm install            # Instala concurrently en root
npm run install:all    # Instala dependencias de todos los paquetes
npm run dev            # Arranca backend y frontend en paralelo
```

## Scripts Disponibles

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
