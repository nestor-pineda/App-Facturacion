# App Facturación

Sistema de facturación para autónomos. Backend REST API construido con Node.js, Express, TypeScript y PostgreSQL.

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Instalación](#2-instalación)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Base de datos](#4-base-de-datos)
5. [Arrancar el servidor](#5-arrancar-el-servidor)
6. [Logger (Pino y trazas)](#6-logger-pino-y-trazas)
7. [Probar la API paso a paso](#7-probar-la-api-paso-a-paso)
8. [Tests](#8-tests)
9. [Comandos de desarrollo](#9-comandos-de-desarrollo)
10. [Ver los datos en la base de datos](#10-ver-los-datos-en-la-base-de-datos)
11. [Solución de problemas frecuentes](#11-solución-de-problemas-frecuentes)
12. [Documentación adicional](#12-documentación-adicional)

> La sección **Probar la API paso a paso** cubre 20 pasos: registro, login, clientes, servicios, configuración SMTP (opcional), presupuestos (crear, enviar, listar, editar, eliminar, convertir a factura) y facturas (crear, emitir, listar, editar, eliminar).

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
SEND_CONFIRMATION_SECRET="tercer-secreto-largo-distinto-de-los-jwt-32chars"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
ALLOWED_ORIGINS="http://localhost:8080,http://localhost:5173"
```

> **Importante:** `JWT_SECRET`, `JWT_REFRESH_SECRET` y `SEND_CONFIRMATION_SECRET` deben ser **tres cadenas distintas** (≥32 caracteres cada una). Las dos primeras firman sesión; `SEND_CONFIRMATION_SECRET` firma los JWT de confirmación al enviar facturas/presupuestos y **no** debe ser igual a ninguna de las otras (comprometer solo `JWT_SECRET` no debe permitir forjar envíos). Zod en `src/config/env.ts` lo valida al arrancar.

> **CORS y anti-CSRF:** `ALLOWED_ORIGINS` debe listar los orígenes exactos del frontend (separados por coma). El frontend de este monorepo corre en **`http://localhost:8080`** (Vite); si ahí solo tienes `http://localhost:5173`, el login y el resto de mutaciones responderán **403** («Origen de la petición no permitido»). Las peticiones `POST`, `PUT`, `PATCH` y `DELETE` bajo `/api` exigen además `Origin` o `Referer` permitido y la cabecera `X-Requested-With: XMLHttpRequest` (el cliente web ya la incluye). Clientes no navegador deben replicar ambas.

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

## 6. Logger (Pino y trazas)

El backend usa **[Pino](https://github.com/pinojs/pino)** (`src/config/logger.ts`). La instancia exportada es `logger`.

### Dónde ver los logs

Por defecto Pino escribe **JSON en una línea por evento** en la **salida estándar** (`stdout`) del proceso. Al ejecutar `npm run dev`, esas líneas aparecen en la **misma terminal** que el servidor.

Ejemplo de línea (campos típicos: `level`, `time`, `msg`, `service`):

```json
{"level":30,"time":1730000000000,"service":"app-facturacion-api","msg":"Servidor en escucha","port":3000,"nodeEnv":"development"}
```

### Niveles según `NODE_ENV`

| `NODE_ENV`   | Nivel efectivo | Notas |
| ------------ | -------------- | ----- |
| `production` | `info`         | Sin trazas `debug`. |
| `test`       | `silent`       | Vitest no llena la consola con logs de la app. |
| Otro (p. ej. `development`) | `debug` | Más detalle en local. |

### Uso en código

```typescript
import { logger } from '@/config/logger';

logger.info('Algo ocurrió');
logger.info({ userId, action }, 'Acción completada');
logger.warn({ requestId }, 'Situación revisable');
logger.error({ err }, 'Fallo al procesar');
```

Los errores capturados en controladores suelen pasar por `logControllerError` (`src/lib/log-controller-error.ts`), que añade `requestId` y `context` (identificador de la operación).

### Auditoría y correlación

- Eventos de seguridad / negocio relevantes usan `auditLog` (`src/lib/audit-log.ts`): en el JSON verás `type: "audit"` y `event` (nombres en `src/constants/audit-events.constants.ts`).
- Cada petición puede llevar la cabecera **`X-Request-Id`** (o el servidor genera una). El mismo valor se devuelve en la respuesta y suele aparecer como **`requestId`** en los logs para enlazar todas las entradas de una misma petición.

### Legibilidad en local (opcional)

Para ver el JSON coloreado y multilínea, puedes tuberizar la salida (no hace falta instalar nada de forma permanente):

```bash
npm run dev 2>&1 | npx pino-pretty
```

---

## 7. Probar la API paso a paso

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

### Paso 7b — Configurar SMTP para envío de emails (opcional)

Si quieres que el sistema envíe emails reales al cliente cuando se envía un presupuesto o una factura, añade las siguientes variables a tu `.env`. Si se omiten, el envío de email se silencia automáticamente sin afectar a ninguna otra funcionalidad.

**Para desarrollo local** se recomienda [Mailtrap](https://mailtrap.io) (sandbox gratuito que captura los emails sin enviarlos de verdad):

```bash
# .env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<tu-user-de-mailtrap>
SMTP_PASS=<tu-pass-de-mailtrap>
SMTP_FROM="Facturación App <noreply@facturacion.app>"
```

Reinicia el servidor tras añadir las variables (`npm run dev`). A partir de ese momento, cada vez que se **complete el envío** —es decir, tras `POST /api/v1/quotes/:id/send-confirmation` o `POST /api/v1/invoices/:id/send-confirmation` y el `PATCH` correspondiente a `/send` con el `confirmationToken` recibido—, si el SMTP está configurado el cliente del documento recibirá un email HTML con el resumen.

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

El envío es **en dos pasos**: primero se pide un token de confirmación al servidor y luego se confirma con `PATCH` y cuerpo JSON. Así se evita que un único `PATCH` sin prueba previa complete la acción. Si el SMTP está configurado, el email se dispara al completar el segundo paso.

**1) Obtener token** (`200` con `data.confirmationToken`):

```bash
curl -X POST http://localhost:3000/api/v1/quotes/UUID_DEL_PRESUPUESTO/send-confirmation \
  -H "Authorization: Bearer TU_TOKEN"
```

**2) Confirmar envío** (sustituye `TOKEN_DEL_PASO_1` por el valor recibido):

```bash
curl -X PATCH http://localhost:3000/api/v1/quotes/UUID_DEL_PRESUPUESTO/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"confirmationToken":"TOKEN_DEL_PASO_1"}'
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

### Paso 10 — Listar presupuestos (con filtros opcionales)

```bash
# Todos los presupuestos
curl http://localhost:3000/api/v1/quotes \
  -H "Authorization: Bearer TU_TOKEN"

# Solo presupuestos en borrador
curl "http://localhost:3000/api/v1/quotes?estado=borrador" \
  -H "Authorization: Bearer TU_TOKEN"

# Solo presupuestos enviados
curl "http://localhost:3000/api/v1/quotes?estado=enviado" \
  -H "Authorization: Bearer TU_TOKEN"

# Por cliente
curl "http://localhost:3000/api/v1/quotes?client_id=UUID_DEL_CLIENTE" \
  -H "Authorization: Bearer TU_TOKEN"

# Por rango de fechas
curl "http://localhost:3000/api/v1/quotes?desde=2026-01-01&hasta=2026-12-31" \
  -H "Authorization: Bearer TU_TOKEN"
```

Respuesta esperada (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-del-presupuesto",
      "estado": "enviado",
      "subtotal": 750,
      "total_iva": 157.5,
      "total": 907.5,
      "lines": [ ... ]
    }
  ]
}
```

---

### Paso 11 — Editar un presupuesto borrador

Solo es posible mientras el presupuesto esté en estado `borrador`. El cuerpo reemplaza completamente la cabecera y las líneas:

```bash
curl -X PUT http://localhost:3000/api/v1/quotes/UUID_DEL_PRESUPUESTO \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "client_id": "UUID_DEL_CLIENTE",
    "fecha": "2026-02-01",
    "notas": "Presupuesto revisado",
    "lines": [
      {
        "service_id": "UUID_DEL_SERVICIO",
        "descripcion": "Consultoría web - 8 horas",
        "cantidad": 8,
        "precio_unitario": 150.00,
        "iva_porcentaje": 21
      }
    ]
  }'
```

Respuesta esperada (`200 OK`):

```json
{
  "success": true,
  "data": {
    "id": "uuid-del-presupuesto",
    "estado": "borrador",
    "subtotal": 1200,
    "total_iva": 252,
    "total": 1452,
    "lines": [ ... ]
  }
}
```

Si el presupuesto ya está en estado `enviado`, se devuelve `409 ALREADY_SENT`.

---

### Paso 12 — Eliminar un presupuesto borrador

```bash
curl -X DELETE http://localhost:3000/api/v1/quotes/UUID_DEL_PRESUPUESTO \
  -H "Authorization: Bearer TU_TOKEN"
```

Respuesta esperada (`200 OK`):

```json
{ "success": true }
```

Si el presupuesto ya está en estado `enviado`, se devuelve `409 ALREADY_SENT`.

---

### Paso 13 — Convertir un presupuesto en factura

Convierte un presupuesto (en cualquier estado) en una nueva factura en estado `borrador`. El presupuesto original no se modifica y se pueden generar múltiples facturas del mismo presupuesto.

```bash
# Sin fecha_emision (usa la fecha de hoy)
curl -X POST http://localhost:3000/api/v1/quotes/UUID_DEL_PRESUPUESTO/convert \
  -H "Authorization: Bearer TU_TOKEN"

# Con fecha_emision explícita
curl -X POST http://localhost:3000/api/v1/quotes/UUID_DEL_PRESUPUESTO/convert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{ "fecha_emision": "2026-06-01" }'
```

Respuesta esperada (`201 Created`):

```json
{
  "success": true,
  "data": {
    "id": "uuid-de-la-nueva-factura",
    "estado": "borrador",
    "numero": null,
    "client_id": "UUID_DEL_CLIENTE",
    "fecha_emision": "2026-06-01T00:00:00.000Z",
    "subtotal": 1000,
    "total_iva": 210,
    "total": 1210,
    "lines": [ ... ]
  }
}
```

---

### Paso 14 — Crear una factura

El proceso es idéntico al presupuesto pero usando `fecha_emision`. La factura se crea en estado `borrador` y sin número legal:

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

### Paso 15 — Emitir la factura (asigna número legal)

Mismo patrón que el presupuesto: **POST** `send-confirmation` y luego **PATCH** `/send` con el token en el cuerpo. Genera el número correlativo `YYYY/NNN` y bloquea la factura. Si el SMTP está configurado, el email se envía al completar el `PATCH`.

**1) Token:**

```bash
curl -X POST http://localhost:3000/api/v1/invoices/UUID_DE_LA_FACTURA/send-confirmation \
  -H "Authorization: Bearer TU_TOKEN"
```

**2) Emitir** (sustituye `TOKEN_DEL_PASO_1`):

```bash
curl -X PATCH http://localhost:3000/api/v1/invoices/UUID_DE_LA_FACTURA/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"confirmationToken":"TOKEN_DEL_PASO_1"}'
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

### Paso 16 — Listar facturas (con filtros opcionales)

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

### Paso 17 — Editar una factura borrador

Solo es posible mientras la factura esté en estado `borrador` (antes de emitirla):

```bash
curl -X PUT http://localhost:3000/api/v1/invoices/UUID_DE_LA_FACTURA \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "client_id": "UUID_DEL_CLIENTE",
    "fecha_emision": "2026-02-15",
    "notas": "Factura corregida",
    "lines": [
      {
        "service_id": "UUID_DEL_SERVICIO",
        "descripcion": "Consultoría web - 10 horas",
        "cantidad": 10,
        "precio_unitario": 150.00,
        "iva_porcentaje": 21
      }
    ]
  }'
```

Respuesta esperada (`200 OK`):

```json
{
  "success": true,
  "data": {
    "id": "uuid-de-la-factura",
    "numero": null,
    "estado": "borrador",
    "subtotal": 1500,
    "total_iva": 315,
    "total": 1815,
    "lines": [ ... ]
  }
}
```

Si la factura ya está en estado `enviada`, se devuelve `409 ALREADY_SENT`.

---

### Paso 18 — Eliminar una factura borrador

```bash
curl -X DELETE http://localhost:3000/api/v1/invoices/UUID_DE_LA_FACTURA \
  -H "Authorization: Bearer TU_TOKEN"
```

Respuesta esperada (`200 OK`):

```json
{ "success": true }
```

Si la factura ya está en estado `enviada`, se devuelve `409 ALREADY_SENT`.

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

## 8. Tests

```bash
npm test                  # Todos los tests
npm run test:watch        # Modo watch (re-ejecuta al guardar)
npm run test:coverage     # Con informe de cobertura
npm run test:unit         # Solo tests unitarios
npm run test:integration  # Solo tests de integración
```

Los tests usan una base de datos real. Asegúrate de que el contenedor Docker está corriendo antes de ejecutarlos.

Hay un test en `tests/integration/clients.test.ts` que comprueba el 409 al crear un cliente con email duplicado para el mismo usuario; está con `it.skip` hasta que exista el constraint `@@unique([user_id, email])` en el modelo Client. Ver [TESTING.md](../docs/CONTEXT/TESTING.md) para más detalle.

---

## 9. Comandos de desarrollo

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

## 10. Ver los datos en la base de datos

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

## 11. Solución de problemas frecuentes

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

## 12. Documentación adicional

| Documento            | Contenido                          |
| -------------------- | ---------------------------------- |
| `API.md`             | Contratos completos de endpoints   |
| `DATABASE.md`        | Esquema de tablas y reglas de negocio |
| `ENVIRONMENT.md`     | Variables de entorno con ejemplos  |
| `CONTEXT/product.md` | Definición del producto            |
| `CONTEXT/domain.md`  | Glosario de términos               |
| `CONTEXT/decisions.md` | Decisiones arquitectónicas       |
