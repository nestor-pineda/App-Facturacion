# Convenciones de Nomenclatura

Este documento establece el **sistema de nomenclatura** del proyecto para evitar fallos entre **snake_case** (backend/API) y **camelCase** (frontend). Es obligatorio respetarlo al implementar o modificar endpoints, tipos y formularios.

---

## Regla de oro

| Capa | Convención | Ejemplo |
|------|------------|--------|
| **Backend: base de datos, Prisma, API (cuerpos de petición y respuesta)** | **snake_case** | `fecha_emision`, `total_iva`, `client_id`, `precio_unitario` |
| **Frontend: TypeScript, React, estado, formularios, tipos** | **camelCase** | `fechaEmision`, `totalIva`, `clientId`, `precioUnitario` |

La API **nunca** devuelve camelCase. El frontend **nunca** envía snake_case en los tipos de la aplicación: convierte en el límite (al llamar a la API y al leer respuestas).

---

## Backend y API

### Base de datos y Prisma

- Nombres de tablas, columnas y relaciones en **snake_case**.
- El schema de Prisma y las respuestas que construye el backend siguen este formato.

Ejemplos:

- `fecha_emision`, `total_iva`, `client_id`, `precio_unitario`, `iva_porcentaje`, `service_id`, `created_at`, `nombre_comercial`.

### Contratos de la API REST

- **Cuerpos de petición (request body):** todos los campos en **snake_case**.
- **Cuerpos de respuesta (response body):** todos los campos en **snake_case** (incluido `data` cuando es un objeto o array de entidades).
- **Query params:** **snake_case** cuando representan campos del dominio (ej: `client_id`, `fecha_emision`).

Ejemplo de body de creación/actualización de factura:

```json
{
  "client_id": "uuid",
  "fecha_emision": "2026-03-10",
  "notas": "...",
  "lines": [
    {
      "service_id": "uuid",
      "descripcion": "...",
      "cantidad": 1,
      "precio_unitario": 100,
      "iva_porcentaje": 21
    }
  ]
}
```

Ejemplo de objeto en respuesta:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "fecha_emision": "2026-03-10",
    "total_iva": 21,
    "client": { "id": "...", "nombre": "..." },
    "lines": [{ "precio_unitario": 100, "iva_porcentaje": 21 }]
  }
}
```

---

## Frontend

### Tipos, estado y formularios

- Interfaces, tipos y estado (Zustand, React state, React Hook Form) en **camelCase**.
- Nombres de campos en formularios y esquemas Zod del frontend en **camelCase**.

Ejemplos:

- `fechaEmision`, `totalIva`, `clientId`, `precioUnitario`, `ivaPorcentaje`, `serviceId`, `createdAt`.

### Punto de conversión (boundary)

El frontend debe **mapear explícitamente** en dos sitios:

1. **Al enviar datos a la API (request):** convertir de camelCase → snake_case justo antes de la petición (por ejemplo en `api/endpoints/*.ts` con una función `toApiPayload` o equivalente).
2. **Al leer datos de la API (response):** la respuesta viene en snake_case; hay que leer **snake_case** (o ambos por compatibilidad) al construir valores para formularios, detalle o listas (por ejemplo en `*ToFormInput`, mappers de listado o vista de detalle).

No asumir que el backend devuelve camelCase. Si un tipo del frontend usa camelCase (p. ej. `Invoice` con `fechaEmision`), en tiempo de ejecución el JSON de la API tendrá `fecha_emision`. Por tanto:

- En **páginas de edición** y donde se rellenen formularios desde la API, usar mappers que lean `fecha_emision` / `total_iva` / `precio_unitario` / etc. y escriban en el formato del formulario (camelCase).
- En **vistas de detalle** y listas, al mostrar totales o fechas, usar también los nombres snake_case de la respuesta (o un mapper único) para evitar `undefined` y valores NaN.

Ejemplo de mapper en página de edición (recibe respuesta API en snake_case):

```typescript
function invoiceToFormInput(invoice: Invoice): CreateInvoiceInput {
  const raw = invoice as Invoice & { fecha_emision?: string; total_iva?: number };
  const fechaValue = raw.fecha_emision ?? invoice.fechaEmision;
  // ...
  return {
    fechaEmision: normalizeDate(fechaValue),
    lines: invoice.lines.map((l) => {
      const line = l as InvoiceLine & { precio_unitario?: number; service_id?: string | null };
      return {
        precioUnitario: Number(line.precio_unitario ?? l.precioUnitario) ?? 0,
        serviceId: line.service_id ?? l.serviceId ?? null,
        // ...
      };
    }),
  };
}
```

Ejemplo de payload hacia la API (camelCase → snake_case):

```typescript
const toApiPayload = (data: CreateInvoiceInput) => ({
  client_id: data.clientId,
  fecha_emision: data.fechaEmision,
  notas: data.notas,
  lines: data.lines.map((l) => ({
    ...(l.serviceId != null && l.serviceId !== '' && { service_id: l.serviceId }),
    descripcion: l.descripcion,
    cantidad: Number(l.cantidad),
    precio_unitario: Number(l.precioUnitario),
    iva_porcentaje: Number(l.ivaPorcentaje),
  })),
});
```

---

## Resumen de comprobación

Antes de implementar o tocar integración frontend–backend:

1. **Nuevos campos en la API:** ¿están en snake_case en body y en respuestas?
2. **Nuevos tipos en el frontend:** ¿usan camelCase?
3. **Llamadas a la API desde el frontend:** ¿existe `toApiPayload` (o equivalente) que pase de camelCase a snake_case?
4. **Uso de datos de la API en el frontend:** ¿los mappers y vistas leen snake_case (o ambos) al rellenar formularios y mostrar detalle/listas?

Documentos relacionados: `docs/CONTEXT/API.md`, `.cursor/rules/general.md`, `docs/decisions.md` (decisión sobre snake_case vs camelCase en la frontera).
