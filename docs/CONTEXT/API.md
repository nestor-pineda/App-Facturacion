Aquí tienes el archivo **`API.md`** consolidado para tu proyecto. Este documento define los contratos técnicos de todos los endpoints basándose en la arquitectura de capas y las reglas de negocio de tu Fase 0.

Copia el siguiente bloque de código para crear tu archivo:

```markdown
# API Reference — Sistema de Facturación MVP

**Base URL:** `/api/v1`  
**Auth:** httpOnly Cookie (`accessToken`) enviada automáticamente por el browser. No se usa `Authorization` header.  
**Formato de Respuesta:** Siempre `{ success: boolean, data?: any, error?: { message, code, details } }`

**Convención de nombres (obligatoria):** Todos los cuerpos de petición (request body) y de respuesta (response body) usan **snake_case** (ej: `fecha_emision`, `total_iva`, `client_id`, `precio_unitario`). El frontend debe mapear a camelCase al enviar y al leer. Ver `docs/CONTEXT/NAMING-CONVENTIONS.md`.

---

## 🔐 Autenticación

### POST `/auth/register`
Registra un nuevo autónomo en el sistema.
- **Body:** `{ email, password, nombre_comercial, nif, direccion_fiscal, telefono? }`
- **Response 201:** `{ success: true, data: { user } }`

### POST `/auth/login`
Inicia sesión. Los tokens se envían como httpOnly cookies, nunca en el body.
- **Body:** `{ email, password }`
- **Response 200:** `{ success: true, data: { user } }`
- **Set-Cookie:** `accessToken` (httpOnly, maxAge 1h) + `refreshToken` (httpOnly, maxAge 7d)

### POST `/auth/refresh`
Renueva el accessToken usando el refreshToken de la cookie.
- **Body:** vacío
- **Cookie requerida:** `refreshToken`
- **Response 200:** `{ success: true, data: { message: "Token renovado correctamente" } }`
- **Set-Cookie:** nuevo `accessToken` (httpOnly, maxAge 1h)
- **Response 401:** Cookie ausente o token inválido/expirado.

### POST `/auth/logout`
Cierra la sesión eliminando ambas cookies del browser.
- **Body:** vacío
- **Response 200:** `{ success: true, data: { message: "Sesión cerrada correctamente" } }`
- **Set-Cookie:** `accessToken` y `refreshToken` con `maxAge=0` (borradas)

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

### POST `/quotes/:id/send-confirmation`

Prepara el envío de un presupuesto en estado `borrador`. Devuelve un **token de confirmación** de corta duración (JWT HS256 firmado con `SEND_CONFIRMATION_SECRET`, independiente de `JWT_SECRET`) que debe enviarse en el siguiente paso. El asistente IA **no** expone esta acción; el flujo completo debe hacerse desde la app o un cliente que replique las dos peticiones.

* **Body:** ninguno.
* **Response 200:** `{ success: true, data: { confirmationToken: string } }`
* **Response 404:** Presupuesto no encontrado.
* **Response 409:** `{ success: false, error: { message: "...", code: "ALREADY_SENT" } }` — el presupuesto ya fue enviado.

### PATCH `/quotes/:id/send`

Marca como `enviado`. Requiere haber obtenido antes un token con `POST .../send-confirmation`. Bloquea futuras ediciones. Si las variables SMTP están configuradas, envía un email HTML al cliente con el resumen del presupuesto (líneas, totales, notas). El fallo en el envío de email no afecta a la respuesta HTTP.

* **Body:** `{ "confirmationToken": "string" }` — el valor devuelto por `POST .../send-confirmation` para **este mismo** `:id` y usuario autenticado.
* **Response 200:** `{ success: true, data: Quote }`
* **Response 400:** `{ success: false, error: { code: "VALIDATION_ERROR", ... } }` — falta o es inválido `confirmationToken`.
* **Response 403:** `{ success: false, error: { code: "INVALID_SEND_CONFIRMATION", ... } }` — token caducado, manipulado o no coincide con el documento.
* **Response 409:** `{ success: false, error: { message: "...", code: "ALREADY_SENT" } }` — el presupuesto ya fue enviado.

### POST `/quotes/:id/resend`

Reenvia por email un presupuesto ya `enviado` sin modificar su estado ni su contenido.

* **Response 200:** `{ success: true, data: Quote }`
* **Response 404:** `{ success: false, error: { message: "...", code: "NOT_FOUND" } }` — presupuesto no encontrado.
* **Response 409:** `{ success: false, error: { message: "...", code: "NOT_SENT" } }` — solo se puede reenviar un presupuesto enviado.

### POST `/quotes/:id/copy`

Copia un presupuesto `enviado` y crea un nuevo presupuesto en estado `borrador` con los mismos datos (cliente, notas y lineas).

* **Response 201:** `{ success: true, data: Quote }`
* **Response 404:** `{ success: false, error: { message: "...", code: "NOT_FOUND" } }` — presupuesto no encontrado.
* **Response 400:** `{ success: false, error: { message: "...", code: "INTERNAL_ERROR" } }` — solo se puede copiar un presupuesto enviado.

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

### POST `/invoices/:id/send-confirmation`

Prepara el envío de una factura en estado `borrador`. Devuelve un **token de confirmación** de corta duración (firmado con `SEND_CONFIRMATION_SECRET`) que debe usarse en `PATCH .../send`. El asistente IA **no** expone esta acción.

* **Body:** ninguno.
* **Response 200:** `{ success: true, data: { confirmationToken: string } }`
* **Response 404:** Factura no encontrada.
* **Response 409:** `{ success: false, error: { message: "...", code: "ALREADY_SENT" } }` — la factura ya fue enviada.

### PATCH `/invoices/:id/send`

**Acción crítica:** Genera número legal `YYYY/NNN` y cambia estado a `enviada`. Requiere `confirmationToken` obtenido con `POST .../send-confirmation` para el mismo `:id` y usuario. Si las variables SMTP están configuradas, envía un email HTML al cliente con el número de factura, líneas, totales y notas. El fallo en el envío de email no afecta a la respuesta HTTP.

* **Regla:** Solo si la factura actual es `borrador`. Una vez enviada, es inmutable.
* **Body:** `{ "confirmationToken": "string" }`
* **Response 200:** `{ success: true, data: Invoice }`
* **Response 400:** `{ success: false, error: { code: "VALIDATION_ERROR", ... } }` — falta o es inválido `confirmationToken`.
* **Response 403:** `{ success: false, error: { code: "INVALID_SEND_CONFIRMATION", ... } }` — token caducado, manipulado o no coincide con el documento.
* **Response 409:** `{ success: false, error: { message: "Factura ya enviada", code: "ALREADY_SENT" } }` (u otros códigos de conflicto de numeración según implementación).

### POST `/invoices/:id/resend`

Reenvia por email una factura en estado `enviada` sin cambiar su estado.

* **Response 200:** `{ success: true, data: Invoice }`
* **Response 404:** `{ success: false, error: { message: "...", code: "NOT_FOUND" } }` — factura no encontrada.

### POST `/invoices/:id/copy`

Copia una factura `enviada` y crea una nueva factura en estado `borrador` con los mismos datos.

* **Response 201:** `{ success: true, data: Invoice }`
* **Response 404:** `{ success: false, error: { message: "...", code: "NOT_FOUND" } }` — factura no encontrada.
* **Response 400:** `{ success: false, error: { message: "...", code: "INTERNAL_ERROR" } }` — solo se puede copiar una factura enviada.

### GET `/invoices/:id/pdf`

Genera y descarga el PDF de una factura. Disponible en ambos estados (`borrador` y `enviada`).

* **Auth:** Requiere cookie `accessToken`
* **Response 200:** Archivo binario (`application/pdf`). Header `Content-Disposition: attachment; filename="factura-YYYY-NNN.pdf"` (o `factura-{id}.pdf` si la factura es borrador sin numero)
* **Response 404:** `{ success: false, error: { message: "...", code: "NOT_FOUND" } }` — factura no encontrada o no pertenece al usuario.
* **Response 401:** Token JWT ausente, expirado o inválido.

### GET `/quotes/:id/pdf`

Genera y descarga el PDF de un presupuesto. Disponible en ambos estados (`borrador` y `enviado`).

* **Auth:** Requiere cookie `accessToken`
* **Response 200:** Archivo binario (`application/pdf`). Header `Content-Disposition: attachment; filename="presupuesto-YYYY-NNN.pdf"` (o `presupuesto-{id}.pdf` si el presupuesto es borrador sin número)
* **Response 404:** `{ success: false, error: { message: "...", code: "NOT_FOUND" } }` — presupuesto no encontrado o no pertenece al usuario.
* **Response 401:** Token JWT ausente, expirado o inválido.

---

## 🤖 Agente IA (chat)

### POST `/agent/chat`

Orquesta el asistente de facturación (Genkit + modelo Gemini). El usuario autenticado se determina **solo** desde el JWT (`req.userId`); no debe enviarse `user_id` en el cuerpo.

* **Auth:** Requiere cookie `accessToken` (mismo patrón que el resto de la API).
* **Body (JSON):**
  * `message` (string, obligatorio): texto del usuario, longitud **1–2000** caracteres.
  * `history` (array, opcional; por defecto `[]`): hasta **20** mensajes previos de la conversación. Cada elemento:
    * `role`: `"user"` \| `"model"`
    * `content` (string, obligatorio, no vacío): contenido del turno.
* **Response 200:** `{ success: true, data: { reply: string, toolsUsed: string[] } }`
  * `reply`: respuesta en lenguaje natural.
  * `toolsUsed`: nombres de las herramientas invocadas durante la petición (puede ser `[]`).
* **Response 400:** `{ success: false, error: { message: string, code: "VALIDATION_ERROR" } }` — validación Zod (mensaje vacío, historial con más de 20 entradas, `role` no permitido, `content` vacío, etc.).
* **Response 401:** Token JWT ausente, expirado o inválido (formato de error estándar de autenticación).
* **Response 500:** `{ success: false, error: { message: "El agente no pudo procesar la solicitud", code: "AGENT_ERROR" } }` — error al ejecutar el flujo (modelo, Genkit o servicios internos), salvo el caso de clave inválida (ver siguiente).
* **Response 503:** `{ success: false, error: { message: string, code: string } }` — servicio del asistente no disponible temporalmente:
  * `AGENT_MISCONFIGURED` — Google AI rechazó `GOOGLE_GENAI_API_KEY` (clave inválida o mal configurada).
  * `AGENT_RATE_LIMITED` — cuota o límite de peticiones de Google AI (p. ej. 429 / free tier agotado, *spending cap*, etc.).
  * `AGENT_MODEL_UNAVAILABLE` — el modelo configurado en el backend no está disponible para el proyecto o ha sido retirado (p. ej. 404 de la API de modelos); actualizar el ID de modelo en el servidor.

**Nota de convención:** El cuerpo de este endpoint usa los nombres de campo del schema Zod del agente (`message`, `history`, `role`, `content`), alineados con el cliente web. El resto de recursos de dominio de la API sigue **snake_case** en request/response según `docs/CONTEXT/NAMING-CONVENTIONS.md`.

---

## ⚠️ Errores Comunes

* **400 (Bad Request):** Error de validación de Zod (ej: campo requerido ausente o formato incorrecto).
* **401 (Unauthorized):** Token JWT ausente, expirado o inválido.
* **404 (Not Found):** El recurso no existe o no pertenece al `user_id` del token.
* **409 (Conflict):** Intento de modificar o eliminar un documento ya enviado (`ALREADY_SENT`), o de reenviar una factura ya emitida.
* **503 (Service Unavailable):** En el endpoint del agente (`POST /agent/chat`), indica clave inválida (`AGENT_MISCONFIGURED`), cuota o tope de uso (`AGENT_RATE_LIMITED`) o modelo no disponible para el proyecto (`AGENT_MODEL_UNAVAILABLE`).

```


Este documento asegura que **Cursor** respete la estructura de carpetas de tu backend (rutas -> controladores -> servicios) y no intente realizar operaciones prohibidas como editar facturas ya emitidas.

```