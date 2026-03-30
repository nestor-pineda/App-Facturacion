# Glosario del Dominio - Sistema de Facturación

---

## Entidades Principales

### Usuario (User)
**Definición:** El autónomo o profesional que usa la aplicación para gestionar su facturación.

**Campos clave:** email, password (hasheada), nombre_comercial, NIF, dirección_fiscal

**Sinónimos aceptados:** Autónomo, Owner, Propietario

**Términos prohibidos:** ❌ No usar "admin" (todos los usuarios son iguales)

---

### Cliente (Client)
**Definición:** Persona física o jurídica a la que el autónomo factura sus servicios.

**Campos clave:** nombre, email, CIF/NIF, dirección

**Importante:** Los clientes NO tienen acceso a la aplicación. Son simplemente registros en la base de datos del usuario.

**Sinónimos aceptados:** Customer (solo en inglés técnico)

**Términos prohibidos:** ❌ No usar "user" para clientes

---

### Servicio (Service)
**Definición:** Entrada del catálogo de servicios que ofrece el autónomo. Incluye nombre, descripción, precio base (sin IVA) y porcentaje de IVA.

**Campos clave:** nombre, descripción, precio_base, iva_porcentaje

**Importante:** No es un producto físico. No tiene stock ni inventario.

**Sinónimos aceptados:** Concepto (en contexto de facturación)

**Términos prohibidos:** ❌ No usar "product" (es un servicio, no producto)

---

### Presupuesto (Quote)
**Definición:** Documento comercial que detalla servicios y precios ofrecidos a un cliente antes de realizar el trabajo. No tiene carácter legal vinculante.

**Estados:** `borrador` (editable) | `enviado` (inmutable)

**Campos clave:** numero (opcional), estado, fecha, subtotal, total_iva, total, notas

**Compuesto por:** QuoteLines (líneas de presupuesto)

**Sinónimos aceptados:** Proforma, Cotización

**Términos prohibidos:** ❌ No usar "estimate" (usamos Quote en código)

---

### Factura (Invoice)
**Definición:** Documento legal que certifica la prestación de servicios y el importe a cobrar. Tiene valor fiscal y contable.

**Estados:** `borrador` (editable) | `enviada` (inmutable)

**Campos clave:** numero (obligatorio al enviar, formato YYYY/NNN), estado, fecha_emision, subtotal, total_iva, total

**Compuesto por:** InvoiceLines (líneas de factura)

**Regla crítica:** Una vez en estado `enviada`, NO se puede modificar ni eliminar.

**Sinónimos aceptados:** Ninguno (siempre usar "factura" o "invoice")

**Términos prohibidos:** ❌ No usar "bill" (es factura, no recibo)

---

### Línea de Presupuesto (QuoteLine)
**Definición:** Cada fila dentro de un presupuesto que describe un servicio, cantidad, precio unitario e IVA.

**Campos clave:** quote_id, service_id (puede ser NULL), descripcion, cantidad, precio_unitario, iva_porcentaje, subtotal

**Concepto de Snapshot:** Guarda una **copia** (snapshot) de la descripción, precio e IVA del servicio en el momento de crear la línea. Si el servicio se modifica después, esta línea mantiene los valores originales.

**Términos prohibidos:** ❌ No usar "item" genérico (es QuoteLine)

---

### Línea de Factura (InvoiceLine)
**Definición:** Cada fila dentro de una factura que describe un servicio, cantidad, precio unitario e IVA.

**Campos clave:** invoice_id, service_id (puede ser NULL), descripcion, cantidad, precio_unitario, iva_porcentaje, subtotal

**Concepto de Snapshot:** Igual que QuoteLine, guarda valores en el momento de creación. Las facturas antiguas **nunca cambian** aunque modifiques el catálogo de servicios.

**Términos prohibidos:** ❌ No usar "lineItem" (es InvoiceLine)

---

## Conceptos Fiscales y Legales

### IVA (Impuesto sobre el Valor Añadido)
**Definición:** Impuesto indirecto español que se aplica sobre el precio base de los servicios.

**En este MVP:** Solo soportamos IVA del **21%** (IVA general)

**Cálculo:** `iva_importe = subtotal * (iva_porcentaje / 100)`

**Términos técnicos:**
- `precio_base` / `subtotal`: Precio sin IVA
- `total_iva`: Suma del IVA de todas las líneas
- `total`: Precio final con IVA incluido (subtotal + total_iva)

**Términos prohibidos:** ❌ No usar "tax" genérico (es IVA específicamente)

---

### Numeración Correlativa
**Definición:** Sistema legal obligatorio en España donde cada factura tiene un número único y secuencial por año fiscal.

**Formato:** `YYYY/NNN` (ej: 2026/001, 2026/002, 2026/003)

**Reglas:**
- Se genera **automáticamente** al marcar factura como `enviada`
- Debe ser **único** por usuario
- Debe ser **correlativo** dentro del año
- **No puede tener huecos** ni duplicados

**Términos técnicos:**
- `numero`: Campo String que almacena la numeración
- La factura en `borrador` tiene `numero = null`

**Términos prohibidos:** ❌ No usar "invoice_id" para el número legal (es el campo `numero`)

---

### Snapshot (Instantánea)
**Definición:** Copia de valores de un servicio en el momento de añadirlo a una factura o presupuesto.

**Por qué existe:** Si hoy facturas "Desarrollo Web" a 1200€ y mañana subes el precio a 1500€, las facturas emitidas ayer **deben seguir mostrando 1200€**.

**Campos que son snapshot:**
- `descripcion` (copia del nombre del servicio)
- `precio_unitario` (copia del precio_base)
- `iva_porcentaje` (copia del IVA)

**Importante:** `service_id` es referencia (puede ser NULL si borras el servicio), pero los campos snapshot son permanentes.

---

## Estados de Documentos

### Estado: `borrador`
**Definición:** Documento en proceso de creación o edición.

**Permisos:**
- ✅ Puede editarse
- ✅ Puede eliminarse
- ✅ Puede cambiar a estado `enviado/enviada`

**Para facturas:** No tiene número asignado (numero = null)

---

### Estado: `enviado` (presupuestos) | `enviada` (facturas)
**Definición:** Documento finalizado y entregado al cliente.

**Permisos:**
- ❌ NO puede editarse
- ❌ NO puede eliminarse
- ❌ NO puede volver a `borrador`

**Para facturas:** Tiene número legal asignado automáticamente

**Razón:** Integridad legal y fiscal. Una factura emitida es un documento legal.

---

## Cálculos

### Subtotal de línea
```
subtotal_linea = cantidad * precio_unitario
```

### IVA de línea
```
iva_linea = subtotal_linea * (iva_porcentaje / 100)
```

### Totales del documento (factura o presupuesto)
```
subtotal = suma de todos los subtotal_linea
total_iva = suma de todos los iva_linea
total = subtotal + total_iva
```

**Importante:** Los cálculos se hacen al crear/editar líneas y se **congelan** al marcar como enviado.

---

## Convenciones de Naming

### En Base de Datos (snake_case)
```sql
user_id, nombre_comercial, created_at, total_iva, precio_base
```

### En TypeScript/JavaScript (camelCase)
```typescript
userId, nombreComercial, createdAt, totalIva, precioBase
```

### En URLs (kebab-case)
```
/api/invoice-lines
/api/v1/quotes/:id/send-confirmation
/api/v1/quotes/:id/send
```

---

## Términos Prohibidos Globalmente

❌ **"admin"** → Usar "user" (no hay roles diferentes)  
❌ **"product"** → Usar "service" (son servicios, no productos)  
❌ **"tax"** → Usar "iva" (impuesto específico español)  
❌ **"bill"** → Usar "invoice" (factura legal)  
❌ **"customer"** en español → Usar "cliente"  
❌ **"orden"** → Usar "presupuesto" o "factura" (no hay órdenes)  
❌ **"sent"** para estado → Usar "enviado/enviada" (género correcto)  
❌ **"draft"** en español → Usar "borrador"

---

## Reglas de Negocio en Términos del Dominio

1. Un **Usuario** solo puede ver sus propios **Clientes**, **Servicios**, **Presupuestos** y **Facturas**
2. Una **Factura** en estado `enviada` es **inmutable**
3. El **número** de una **Factura** se genera al pasar de `borrador` a `enviada`
4. Las **líneas** (QuoteLine, InvoiceLine) guardan **snapshots** para inmutabilidad histórica
5. Los **cálculos** de IVA son siempre automáticos, nunca manuales
6. El **IVA** en el MVP es siempre **21%** (constante)
7. Un **Presupuesto** puede existir sin **Cliente** asignado (futuro), pero una **Factura** siempre requiere **Cliente**

---

## Referencias Rápidas

**Siglas:**
- CIF: Código de Identificación Fiscal (empresas)
- NIF: Número de Identificación Fiscal (personas físicas)
- IVA: Impuesto sobre el Valor Añadido

**Formatos:**
- NIF/CIF: 9 caracteres (8 números + 1 letra, o letra + 7 números + letra)
- Número de factura: YYYY/NNN (4 dígitos año + barra + 3 dígitos correlativos)
- Fechas: ISO 8601 (YYYY-MM-DD)
- Decimales: Precision 2 para precios y cálculos (ej: 1200.50)
