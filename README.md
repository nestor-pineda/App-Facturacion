# Sistema de Facturación para Autónomos

Aplicación web para gestión de facturación destinada a autónomos en España.

## Estructura del Proyecto

```
APP-FACTURACION/
├── backend/        # API Node.js + Express + PostgreSQL + Prisma
├── frontend/       # React + TypeScript + Vite (próximamente)
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

## Documentación

- [`docs/API.md`](docs/API.md) — Referencia de endpoints REST
- [`docs/DATABASE.md`](docs/DATABASE.md) — Esquema de base de datos
- [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) — Variables de entorno
- [`docs/decisions.md`](docs/decisions.md) — Decisiones de arquitectura
- [`docs/domain.md`](docs/domain.md) — Modelo de dominio
- [`docs/product.md`](docs/product.md) — Especificación de producto
