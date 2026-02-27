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

### PATCH `/quotes/:id/send`

Marca como `enviado`. Bloquea futuras ediciones.

* **Response 200:** `{ success: true, data: Quote }`

---

## 🧾 Facturas (Invoices)

### GET `/invoices`

Lista facturas con filtros.

* **Query Params:** `estado` (borrador|enviada), `client_id`, `desde` (date), `hasta` (date).
* **Response 200:** `{ success: true, data: Invoice[] }`

### POST `/invoices`

Crea una factura en `borrador`. El campo `numero` será `null`.

* **Body:** Igual que `/quotes`.
* **Response 201:** `{ success: true, data: Invoice }`

### PATCH `/invoices/:id/send`

**Acción Crítica:** Genera número legal `YYYY/NNN` y cambia estado a `enviada`.

* **Regla:** Solo si la factura actual es `borrador`. Una vez enviada, es inmutable.
* **Response 200:** `{ success: true, data: Invoice }`
* **Response 409:** `{ success: false, error: { message: "Factura ya enviada", code: "ALREADY_SENT" } }`

### GET `/invoices/:id/pdf`

Genera el documento legal en PDF.

* **Response 200:** Archivo binario (Application/pdf).

---

## ⚠️ Errores Comunes

* **400 (Bad Request):** Error de validación de Zod (ej: email inválido).
* **401 (Unauthorized):** Token JWT ausente, expirado o inválido.
* **404 (Not Found):** El recurso no existe o no pertenece al `user_id` del token.
* **422 (Unprocessable Entity):** Intento de modificar una factura `enviada`.

```


Este documento asegura que **Cursor** respete la estructura de carpetas de tu backend (rutas -> controladores -> servicios) y no intente realizar operaciones prohibidas como editar facturas ya emitidas.

```