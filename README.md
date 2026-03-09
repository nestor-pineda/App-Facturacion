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
