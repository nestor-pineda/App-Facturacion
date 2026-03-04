# App Facturación

Sistema de facturación para autónomos. Backend REST API construido con Node.js, Express, TypeScript y PostgreSQL.

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Instalación](#2-instalación)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Base de datos](#4-base-de-datos)
5. [Arrancar el servidor](#5-arrancar-el-servidor)
6. [Probar la API paso a paso](#6-probar-la-api-paso-a-paso)
7. [Tests](#7-tests)
8. [Comandos de desarrollo](#8-comandos-de-desarrollo)
9. [Ver los datos en la base de datos](#9-ver-los-datos-en-la-base-de-datos)
10. [Solución de problemas frecuentes](#10-solución-de-problemas-frecuentes)
11. [Documentación adicional](#11-documentación-adicional)

---

## 1. Requisitos previos

Antes de empezar, instala estas dos herramientas:

- **Node.js v20 o superior** → [nodejs.org/en/download](https://nodejs.org/en/download)
  - Comprueba que está instalado: `node --version`
- **Docker Desktop** → [docker.com/get-started](https://www.docker.com/get-started/)
  - Comprueba que está instalado: `docker --version`

---

## 2. Instalación

Clona el repositorio e instala las dependencias:

```bash
git clone <url-del-repositorio>
cd App-Facturacion
npm install
```

---

## 3. Variables de entorno

Crea el archivo `.env` a partir de la plantilla:

```bash
cp .env.example .env
```

Abre `.env` y rellena los valores. Para desarrollo local puedes usar exactamente esto:

```env
DATABASE_URL="postgresql://user:password@localhost:5433/facturacion_db"
JWT_SECRET="un-secreto-largo-de-al-menos-32-caracteres-aqui"
JWT_REFRESH_SECRET="otro-secreto-largo-de-al-menos-32-caracteres-aqui"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
ALLOWED_ORIGINS="http://localhost:5173"
```

> **Importante:** `JWT_SECRET` y `JWT_REFRESH_SECRET` deben tener al menos 32 caracteres. En producción usa valores aleatorios generados de forma segura. Para pruebas locales basta con cualquier cadena larga.

---

## 4. Base de datos

### Primera vez (crear el contenedor Docker)

Ejecuta este comando una sola vez para crear y arrancar PostgreSQL:

```bash
docker run -d \
  --name facturacion-db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=facturacion_db \
  -p 5433:5432 \
  postgres:16
```

### Veces siguientes (solo arrancar el contenedor)

```bash
docker start facturacion-db
```

### Aplicar las migraciones (crear las tablas)

Con el contenedor arrancado, ejecuta:

```bash
npx prisma migrate deploy
```

Esto crea todas las tablas en la base de datos. Solo es necesario la primera vez o cuando haya nuevas migraciones.

### Verificar que la base de datos está lista

```bash
npx prisma db pull --print
```

Si no hay errores, la conexión funciona correctamente.

---

## 5. Arrancar el servidor

```bash
npm run dev
```

Verás algo como:

```
Server running on http://localhost:3000
```

Comprueba que responde:

```bash
curl http://localhost:3000/health
```

Respuesta esperada:

```json
{ "status": "ok" }
```

---

## 6. Probar la API paso a paso

Todos los endpoints protegidos requieren un `accessToken` en la cabecera `Authorization`. El flujo completo es:

**Registro → Login → Guardar token → Usar token en el resto de llamadas**

### Paso 1 — Registrar un usuario

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
      "created_at": "2026-01-01T10:00:00.000Z",
      "updated_at": "2026-01-01T10:00:00.000Z"
    }
  }
}
```

---

### Paso 2 — Hacer login y guardar el token

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

Guarda el `accessToken`. Lo necesitarás en todos los pasos siguientes. En los ejemplos de abajo, sustituye `TU_TOKEN` por ese valor.

---

### Paso 3 — Crear un cliente

```bash
curl -X POST http://localhost:3000/api/v1/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "nombre": "Empresa Cliente SL",
    "email": "cliente@empresa.com",
    "cif_nif": "B12345678",
    "direccion": "Calle Cliente 10, 28080 Madrid"
  }'
```

Respuesta esperada (`201 Created`):

```json
{
  "success": true,
  "data": {
    "id": "uuid-del-cliente",
    "nombre": "Empresa Cliente SL",
    "email": "cliente@empresa.com",
    "cif_nif": "B12345678",
    "direccion": "Calle Cliente 10, 28080 Madrid"
  }
}
```

Guarda el `id` del cliente. Lo necesitarás para crear presupuestos y facturas.

---

### Paso 4 — Listar clientes

```bash
curl http://localhost:3000/api/v1/clients \
  -H "Authorization: Bearer TU_TOKEN"
```

Respuesta esperada (`200 OK`):

```json
{
  "success": true,
  "data": [ ... ],
  "meta": { "total": 1 }
}
```

---

### Paso 5 — Actualizar un cliente

```bash
curl -X PUT http://localhost:3000/api/v1/clients/UUID_DEL_CLIENTE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "nombre": "Empresa Cliente Actualizada SL"
  }'
```

---

### Paso 6 — Crear un servicio (catálogo)

```bash
curl -X POST http://localhost:3000/api/v1/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "nombre": "Consultoría web",
    "descripcion": "Análisis y diseño de soluciones web",
    "precio_base": 150.00,
    "iva_porcentaje": 21
  }'
```

Respuesta esperada (`201 Created`):

```json
{
  "success": true,
  "data": {
    "id": "uuid-del-servicio",
    "nombre": "Consultoría web",
    "descripcion": "Análisis y diseño de soluciones web",
    "precio_base": 150,
    "iva_porcentaje": 21
  }
}
```

Guarda el `id` del servicio.

---

### Paso 7 — Listar servicios

```bash
curl http://localhost:3000/api/v1/services \
  -H "Authorization: Bearer TU_TOKEN"
```

---

### Paso 8 — Crear un presupuesto

Usa el `id` del cliente y del servicio del paso anterior:

```bash
curl -X POST http://localhost:3000/api/v1/quotes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "client_id": "UUID_DEL_CLIENTE",
    "fecha": "2026-01-15",
    "notas": "Presupuesto para desarrollo web",
    "lines": [
      {
        "service_id": "UUID_DEL_SERVICIO",
        "descripcion": "Consultoría web - 5 horas",
        "cantidad": 5,
        "precio_unitario": 150.00,
        "iva_porcentaje": 21
      }
    ]
  }'
```

Respuesta esperada (`201 Created`) — el presupuesto se crea en estado `borrador`:

```json
{
  "success": true,
  "data": {
    "id": "uuid-del-presupuesto",
    "estado": "borrador",
    "subtotal": 750,
    "total_iva": 157.5,
    "total": 907.5,
    "lines": [ ... ]
  }
}
```

---

### Paso 9 — Enviar un presupuesto

Una vez enviado, el presupuesto queda bloqueado y no se puede editar:

```bash
curl -X PATCH http://localhost:3000/api/v1/quotes/UUID_DEL_PRESUPUESTO/send \
  -H "Authorization: Bearer TU_TOKEN"
```

Respuesta esperada (`200 OK`):

```json
{
  "success": true,
  "data": {
    "id": "uuid-del-presupuesto",
    "estado": "enviado",
    ...
  }
}
```

---

### Paso 10 — Crear una factura

El proceso es idéntico al presupuesto. La factura se crea en estado `borrador` y sin número legal:

```bash
curl -X POST http://localhost:3000/api/v1/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "client_id": "UUID_DEL_CLIENTE",
    "fecha_emision": "2026-01-20",
    "notas": "Factura por servicios de consultoría",
    "lines": [
      {
        "service_id": "UUID_DEL_SERVICIO",
        "descripcion": "Consultoría web - 5 horas",
        "cantidad": 5,
        "precio_unitario": 150.00,
        "iva_porcentaje": 21
      }
    ]
  }'
```

Respuesta esperada (`201 Created`):

```json
{
  "success": true,
  "data": {
    "id": "uuid-de-la-factura",
    "numero": null,
    "estado": "borrador",
    "subtotal": 750,
    "total_iva": 157.5,
    "total": 907.5,
    "lines": [ ... ]
  }
}
```

---

### Paso 11 — Emitir la factura (asigna número legal)

Este paso genera automáticamente el número correlativo `YYYY/NNN` y bloquea la factura:

```bash
curl -X PATCH http://localhost:3000/api/v1/invoices/UUID_DE_LA_FACTURA/send \
  -H "Authorization: Bearer TU_TOKEN"
```

Respuesta esperada (`200 OK`):

```json
{
  "success": true,
  "data": {
    "id": "uuid-de-la-factura",
    "numero": "2026/001",
    "estado": "enviada",
    ...
  }
}
```

---

### Paso 12 — Listar facturas (con filtros opcionales)

```bash
# Todas las facturas
curl http://localhost:3000/api/v1/invoices \
  -H "Authorization: Bearer TU_TOKEN"

# Solo facturas enviadas
curl "http://localhost:3000/api/v1/invoices?estado=enviada" \
  -H "Authorization: Bearer TU_TOKEN"

# Por cliente
curl "http://localhost:3000/api/v1/invoices?client_id=UUID_DEL_CLIENTE" \
  -H "Authorization: Bearer TU_TOKEN"

# Por rango de fechas
curl "http://localhost:3000/api/v1/invoices?desde=2026-01-01&hasta=2026-12-31" \
  -H "Authorization: Bearer TU_TOKEN"
```

---

### Renovar el accessToken (Refresh)

El `accessToken` expira en 1 hora. Usa el `refreshToken` para obtener uno nuevo sin volver a hacer login:

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

Respuesta esperada (`200 OK`):

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

> Si el `refreshToken` es inválido o ha expirado, se devuelve `401 INVALID_TOKEN` y debes volver a hacer login.

---

## 7. Tests

```bash
npm test                  # Todos los tests
npm run test:watch        # Modo watch (re-ejecuta al guardar)
npm run test:coverage     # Con informe de cobertura
npm run test:unit         # Solo tests unitarios
npm run test:integration  # Solo tests de integración
```

Los tests usan una base de datos real. Asegúrate de que el contenedor Docker está corriendo antes de ejecutarlos.

---

## 8. Comandos de desarrollo

```bash
npm run dev        # Servidor con hot reload
npm run typecheck  # Verificar tipos TypeScript
npm run lint       # Ver errores de estilo
npm run format     # Formatear código automáticamente
```

### Gestión de base de datos

```bash
npx prisma migrate deploy  # Aplicar migraciones pendientes
npx prisma migrate reset   # Resetear la BD (borra todos los datos)
npx prisma studio          # Abrir interfaz visual en el navegador
```

---

## 9. Ver los datos en la base de datos

### Opción A — Prisma Studio (interfaz visual, sin instalar nada)

```bash
npx prisma studio
```

Se abre en `http://localhost:5555`. Desde ahí puedes ver, crear, editar y eliminar registros en cualquier tabla.

### Opción B — Beekeeper Studio (cliente SQL)

Descarga [Beekeeper Studio](https://www.beekeeperstudio.io/) y conecta con estos datos:

| Campo    | Valor            |
| -------- | ---------------- |
| Type     | PostgreSQL       |
| Host     | `localhost`      |
| Port     | `5433`           |
| Database | `facturacion_db` |
| User     | `user`           |
| Password | `password`       |

---

## 10. Solución de problemas frecuentes

**El servidor no arranca / error de variables de entorno**
→ Comprueba que el archivo `.env` existe y tiene todos los campos rellenos. El servidor no arranca si falta alguna variable obligatoria.

**Error de conexión a la base de datos**
→ Asegúrate de que el contenedor Docker está corriendo: `docker ps`. Si no aparece `facturacion-db`, ejecútalo con `docker start facturacion-db`.

**`401 NO_TOKEN` al llamar a un endpoint**
→ Falta el header `Authorization`. Asegúrate de incluir `-H "Authorization: Bearer TU_TOKEN"` en el curl.

**`401 INVALID_TOKEN` al llamar a un endpoint**
→ El `accessToken` ha expirado (dura 1 hora). Usa el endpoint `/auth/refresh` para obtener uno nuevo o vuelve a hacer login.

**`404 NOT_FOUND` al actualizar o emitir un recurso**
→ El ID no existe o pertenece a otro usuario. Usa el ID exacto que devolvió la llamada de creación.

**`409 ALREADY_SENT` al emitir una factura**
→ La factura ya está en estado `enviada`. Las facturas emitidas son inmutables.

**Los tests fallan con error de base de datos**
→ Verifica que el contenedor Docker está arrancado y que `DATABASE_URL` en `.env` apunta al puerto `5433`.

---

## 11. Documentación adicional

| Documento            | Contenido                          |
| -------------------- | ---------------------------------- |
| `API.md`             | Contratos completos de endpoints   |
| `DATABASE.md`        | Esquema de tablas y reglas de negocio |
| `ENVIRONMENT.md`     | Variables de entorno con ejemplos  |
| `CONTEXT/product.md` | Definición del producto            |
| `CONTEXT/domain.md`  | Glosario de términos               |
| `CONTEXT/decisions.md` | Decisiones arquitectónicas       |
