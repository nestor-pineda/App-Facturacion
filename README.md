# App Facturación

Sistema de facturación para autónomos. Backend REST API construido con Node.js, Express, TypeScript y PostgreSQL.

---

## Requisitos previos

- Node.js v20+
- Docker

---

## Instalación

```bash
npm install
```

## Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores. Ver `ENVIRONMENT.md` para referencia completa.

---

## Base de datos

### Arrancar PostgreSQL

```bash
docker start facturacion-db
```

> Primera vez: ver `ENVIRONMENT.md` para el comando `docker run` completo.

### Aplicar migraciones

```bash
npx prisma migrate deploy
```

### Resetear la base de datos (dev)

```bash
npx prisma migrate reset
```

---

## Ver las tablas de la base de datos

### Opción 1 — Prisma Studio (interfaz visual)

Abre una interfaz web en el navegador con todas las tablas y sus datos:

```bash
npx prisma studio
```

Se abre automáticamente en `http://localhost:5555`. Desde ahí puedes:
- Navegar por cada tabla (`users`, `clients`, `invoices`, etc.)
- Ver, crear, editar y eliminar registros
- Filtrar y ordenar datos

### Opción 2 — Beekeeper Studio (cliente SQL)

Conecta Beekeeper Studio con estos datos:

| Campo    | Valor            |
| -------- | ---------------- |
| Type     | PostgreSQL       |
| Host     | `localhost`      |
| Port     | `5433`           |
| Database | `facturacion_db` |
| User     | `user`           |
| Password | `password`       |

---

## Desarrollo

```bash
npm run dev        # Servidor con hot reload
npm run typecheck  # Verificar tipos TypeScript
npm run lint       # Ver errores de estilo
npm run format     # Formatear código
```

## Tests

```bash
npm test                  # Todos los tests
npm run test:watch        # Modo watch
npm run test:coverage     # Con cobertura
npm run test:unit         # Solo unitarios
npm run test:integration  # Solo integración
```

---

## Documentación

| Documento | Contenido |
| --- | --- |
| `API.md` | Contratos de endpoints |
| `DATABASE.md` | Esquema de base de datos |
| `ENVIRONMENT.md` | Variables de entorno |
| `CONTEXT/product.md` | Definición del producto |
| `CONTEXT/domain.md` | Glosario de términos |
| `CONTEXT/decisions.md` | Decisiones arquitectónicas |
