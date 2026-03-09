# Base de Datos — Sistema de Facturación MVP

Este documento define la estructura de datos, tipos y restricciones de integridad para el desarrollo del sistema. Es la guía crítica para la generación de esquemas de Prisma y la lógica de los servicios.

## 🛠 Convenciones
- **Naming Tablas:** `snake_case` y en plural (ej: `invoice_lines`).
- **Naming Campos:** `snake_case` (ej: `precio_base`).
- **IDs:** Siempre `UUID` (v4), nunca autoincrementales.
- **Auditoría:** Todas las tablas deben incluir `created_at` y `updated_at` (Timestamp).
- **Precisión Decimal:** Los campos de moneda y porcentajes usan `Decimal(10,2)`.

---

## 📑 Esquema de Tablas

### 1. users (El autónomo)
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `email` | VARCHAR | Único, no nulo |
| `password` | VARCHAR | Hasheada con bcrypt |
| `nombre_comercial` | VARCHAR | Nombre del negocio |
| `nif` | VARCHAR | NIF/CIF fiscal |
| `direccion_fiscal` | TEXT | Dirección oficial |
| `telefono` | VARCHAR | Opcional |

### 2. clients
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id` (Propiedad) |
| `nombre` | VARCHAR | Razón social o nombre |
| `email` | VARCHAR | Email de contacto |
| `cif_nif` | VARCHAR | Identificación fiscal |
| `direccion` | TEXT | Dirección del cliente |

### 3. services (Catálogo)
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id` |
| `nombre` | VARCHAR | Nombre del servicio |
| `descripcion` | TEXT | Opcional |
| `precio_base` | DECIMAL | Precio sin IVA |
| `iva_porcentaje` | DECIMAL | Por defecto 21.00 |

### 4. quotes (Presupuestos)
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id` |
| `client_id` | UUID | FK → `clients.id` |
| `numero` | VARCHAR | Opcional |
| `estado` | ENUM | 'borrador', 'enviado' |
| `fecha` | DATE | Fecha de emisión |
| `subtotal` | DECIMAL | Suma líneas (base) |
| `total_iva` | DECIMAL | Suma de cuotas de IVA |
| `total` | DECIMAL | Subtotal + total_iva |

### 5. quote_lines
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `quote_id` | UUID | FK → `quotes.id` (ON DELETE CASCADE) |
| `service_id` | UUID | FK → `services.id` (Nullable) |
| `descripcion` | VARCHAR | **Snapshot** del servicio |
| `cantidad` | DECIMAL | Unidades |
| `precio_unitario`| DECIMAL | **Snapshot** del precio_base |
| `iva_porcentaje` | DECIMAL | **Snapshot** del IVA |
| `subtotal` | DECIMAL | cantidad * precio_unitario |

### 6. invoices (Facturas)
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id` |
| `client_id` | UUID | FK → `clients.id` |
| `numero` | VARCHAR | Único. Formato `YYYY/NNN` (al enviar) |
| `estado` | ENUM | 'borrador', 'enviada' |
| `fecha_emision` | DATE | Fecha legal |
| `subtotal` | DECIMAL | Suma líneas (base) |
| `total_iva` | DECIMAL | Suma de cuotas de IVA |
| `total` | DECIMAL | Subtotal + total_iva |

### 7. invoice_lines
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `invoice_id` | UUID | FK → `invoices.id` (ON DELETE CASCADE) |
| `service_id` | UUID | FK → `services.id` (Nullable) |
| `descripcion` | VARCHAR | **Snapshot** del servicio |
| `cantidad` | DECIMAL | Unidades |
| `precio_unitario`| DECIMAL | **Snapshot** del precio_base |
| `iva_porcentaje` | DECIMAL | **Snapshot** del IVA |
| `subtotal` | DECIMAL | cantidad * precio_unitario |

---

## 🧠 Reglas de Negocio en Datos

### 1. Concepto de Snapshot (Crítico)
- Al añadir un servicio a una línea (QuoteLine o InvoiceLine), se deben copiar (`snapshot`) los valores actuales de `descripcion`, `precio_unitario` e `iva_porcentaje`.
- El `service_id` es referencial; si el servicio original se borra, el ID queda en `NULL` pero los datos de la línea persisten para integridad histórica.

### 2. Estados e Inmutabilidad
- **Documento en Borrador:** Editable y eliminable. El `numero` de factura es `null`.
- **Documento Enviado/a:** Inmutable. No se permite editar campos ni líneas. No se puede eliminar (excepto presupuestos, según política).
- **Numeración Correlativa:** Se genera automáticamente al pasar factura a `'enviada'`. Formato `YYYY/001` incremental por año y usuario.

### 3. Aislamiento de Datos
- **Filtrado por Usuario:** Toda consulta (`SELECT`, `UPDATE`, `DELETE`) debe estar restringida por `user_id`.
- **Roles:** Solo existe el rol de autónomo (dueño de sus datos).

### 4. Lógica de Cálculos
- El `subtotal` de línea es siempre `cantidad * precio_unitario`.
- El IVA de línea es `subtotal_linea * (iva_porcentaje / 100)`.
- Los totales del documento se calculan sumando los subtotales e IVAs de todas sus líneas.