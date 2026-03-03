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

## API — Ejemplos de uso

### Registrar un nuevo usuario

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "autonomo@ejemplo.com",
    "password": "Password123",
    "nombre_comercial": "Mi Empresa SL",
    "nif": "12345678A",
    "direccion_fiscal": "Calle Mayor 1, 28001 Madrid",
    "telefono": "600000000"
  }'
```

Respuesta esperada (`201 Created`):

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-generado",
      "email": "autonomo@ejemplo.com",
      "nombre_comercial": "Mi Empresa SL",
      "nif": "12345678A",
      "direccion_fiscal": "Calle Mayor 1, 28001 Madrid",
      "telefono": "600000000",
      "created_at": "2026-02-27T...",
      "updated_at": "2026-02-27T..."
    }
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "autonomo@ejemplo.com",
    "password": "Password123"
  }'
```

Respuesta esperada (`200 OK`):

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

> El `accessToken` debe enviarse en el header `Authorization: Bearer <token>` en todas las rutas protegidas.

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
