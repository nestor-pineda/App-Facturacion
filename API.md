Aquí tienes el archivo **`API.md`** consolidado para tu proyecto. Este documento define los contratos técnicos de todos los endpoints basándose en la arquitectura de capas y las reglas de negocio de tu Fase 0.

Copia el siguiente bloque de código para crear tu archivo:

```markdown
# API Reference — Sistema de Facturación MVP

**Base URL:** `/api/v1`  
**Auth:** Bearer Token en header `Authorization` (JWT)  
**Formato de Respuesta:** Siempre `{ success: boolean, data?: any, error?: { message, code, details } }`

---

## 🔐 Autenticación

### POST `/auth/register`
Registra un nuevo autónomo en el sistema.
- **Body:** `{ email, password, nombre_comercial, nif, direccion_fiscal, telefono? }`
- **Response 201:** `{ success: true, data: { user } }`

### POST `/auth/login`
Inicia sesión y devuelve tokens de acceso.
- **Body:** `{ email, password }`
- **Response 200:** `{ success: true, data: { accessToken, refreshToken } }`

---

## 👥 Clientes

### GET `/clients`
Lista los clientes del usuario autenticado (paginado).
- **Response 200:** `{ success: true, data: Client[], meta: { total } }`

### POST `/clients`
Crea un nuevo cliente asociado al usuario.
- **Body:** `{ nombre, email, cif_nif, direccion, telefono? }`
- **Response 201:** `{ success: true, data: Client }`

### PUT `/clients/:id`
Actualiza los datos de un cliente.
- **Response 200:** `{ success: true, data: Client }`

---

## 🛠️ Servicios (Catálogo)

### GET `/services`
Lista el catálogo de servicios del autónomo.
- **Response 200:** `{ success: true, data: Service[] }`

### POST `/services`
Crea un nuevo servicio (IVA por defecto 21%).
- **Body:** `{ nombre, descripcion?, precio_base }`
- **Response 201:** `{ success: true, data: Service }`

---

## 📄 Presupuestos (Quotes)

### GET `/quotes`

Lista presupuestos con filtros opcionales.

* **Query Params:** `estado` (borrador|enviado), `client_id`, `desde` (date), `hasta` (date).
* **Response 200:** `{ success: true, data: Quote[] }`

### POST `/quotes`
Crea un presupuesto en estado `borrador`.
- **Body:** ```json
  {
    "client_id": "UUID",
    "fecha": "YYYY-MM-DD",
    "notas": "string",
    "lines": [
      { "service_id": "UUID", "descripcion": "string", "cantidad": number, "precio_unitario": number, "iva_porcentaje": 21 }
    ]
  }

```

* **Nota:** Debe realizar **snapshot** de los datos del servicio en las líneas.

### PUT `/quotes/:id`

Edita un presupuesto en estado `borrador` (reemplazo completo de cabecera y líneas).

* **Body:** Igual que `POST /quotes`.
* **Response 200:** `{ success: true, data: Quote }`
* **Response 400:** Error de validación.
* **Response 404:** Presupuesto no encontrado.
* **Response 409:** `{ success: false, error: { message: "...", code: "ALREADY_SENT" } }` — el presupuesto ya fue enviado.

### DELETE `/quotes/:id`

Elimina un presupuesto en estado `borrador`. Las líneas se eliminan en cascada.

* **Response 200:** `{ success: true }`
* **Response 404:** Presupuesto no encontrado.
* **Response 409:** `{ success: false, error: { message: "...", code: "ALREADY_SENT" } }` — el presupuesto ya fue enviado.

### PATCH `/quotes/:id/send`

Marca como `enviado`. Bloquea futuras ediciones. Si las variables SMTP están configuradas, envía un email HTML al cliente con el resumen del presupuesto (líneas, totales, notas). El fallo en el envío de email no afecta a la respuesta HTTP.

* **Response 200:** `{ success: true, data: Quote }`
* **Response 409:** `{ success: false, error: { message: "...", code: "ALREADY_SENT" } }` — el presupuesto ya fue enviado.

### POST `/quotes/:id/convert`

Convierte un presupuesto (en cualquier estado) en una nueva factura en estado `borrador`. El presupuesto original no se modifica.

* **Body (opcional):** `{ "fecha_emision": "YYYY-MM-DD" }` — si se omite, se usa la fecha actual.
* **Response 201:** `{ success: true, data: Invoice }`
* **Response 400:** `{ success: false, error: { message: "...", code: "VALIDATION_ERROR" } }` — formato de `fecha_emision` inválido.
* **Response 404:** `{ success: false, error: { message: "...", code: "NOT_FOUND" } }` — presupuesto no encontrado.

---

## 🧾 Facturas (Invoices)

### GET `/invoices`

Lista facturas con filtros.

* **Query Params:** `estado` (borrador|enviada), `client_id`, `desde` (date), `hasta` (date).
* **Response 200:** `{ success: true, data: Invoice[] }`

### POST `/invoices`

Crea una factura en `borrador`. El campo `numero` será `null`.

* **Body:** Igual que `/quotes` pero con `fecha_emision` en lugar de `fecha`.
* **Response 201:** `{ success: true, data: Invoice }`

### PUT `/invoices/:id`

Edita una factura en estado `borrador` (reemplazo completo de cabecera y líneas).

* **Body:** Igual que `POST /invoices`.
* **Response 200:** `{ success: true, data: Invoice }`
* **Response 400:** Error de validación.
* **Response 404:** Factura no encontrada.
* **Response 409:** `{ success: false, error: { message: "...", code: "ALREADY_SENT" } }` — la factura ya fue enviada.

### DELETE `/invoices/:id`

Elimina una factura en estado `borrador`. Las líneas se eliminan en cascada.

* **Response 200:** `{ success: true }`
* **Response 404:** Factura no encontrada.
* **Response 409:** `{ success: false, error: { message: "...", code: "ALREADY_SENT" } }` — la factura ya fue enviada.

### PATCH `/invoices/:id/send`

**Acción Crítica:** Genera número legal `YYYY/NNN` y cambia estado a `enviada`. Si las variables SMTP están configuradas, envía un email HTML al cliente con el número de factura, líneas, totales y notas. El fallo en el envío de email no afecta a la respuesta HTTP.

* **Regla:** Solo si la factura actual es `borrador`. Una vez enviada, es inmutable.
* **Response 200:** `{ success: true, data: Invoice }`
* **Response 409:** `{ success: false, error: { message: "Factura ya enviada", code: "ALREADY_SENT" } }`

### GET `/invoices/:id/pdf`

Genera el documento legal en PDF.

* **Response 200:** Archivo binario (Application/pdf).

---

## ⚠️ Errores Comunes

* **400 (Bad Request):** Error de validación de Zod (ej: campo requerido ausente o formato incorrecto).
* **401 (Unauthorized):** Token JWT ausente, expirado o inválido.
* **404 (Not Found):** El recurso no existe o no pertenece al `user_id` del token.
* **409 (Conflict):** Intento de modificar o eliminar un documento ya enviado (`ALREADY_SENT`), o de reenviar una factura ya emitida.

```


Este documento asegura que **Cursor** respete la estructura de carpetas de tu backend (rutas -> controladores -> servicios) y no intente realizar operaciones prohibidas como editar facturas ya emitidas.

```