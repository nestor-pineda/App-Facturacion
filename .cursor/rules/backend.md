---
globs: ["src/routes/**", "src/controllers/**", "src/services/**", "src/middlewares/**"]
---

# Backend - Sistema de Facturación MVP

Este documento describe la arquitectura completa del backend, incluyendo la estructura de carpetas, flujo de datos, reglas de desarrollo y mejores prácticas.

---

## 🏗️ Tipo de Arquitectura

**Monolito de Capas (N-Tier)**

El sistema separa la lógica de transporte (HTTP), la lógica de negocio y el acceso a datos para facilitar el mantenimiento y la escalabilidad.

**Decisión:** Monolito sobre microservicios por:
- Equipo de 1 persona
- Transacciones atómicas simples (factura + líneas)
- No hay beneficio operacional en esta fase
- Ver `decisions.md` para más detalles

---

## 📁 Estructura de Carpetas

```
src/
├── api/
│   ├── routes/          # Definición de endpoints y routers
│   ├── controllers/     # Manejo de request/response
│   └── middlewares/     # Auth, validación, error handling
├── services/            # Lógica de negocio pura
├── prisma/              # Esquema de base de datos y migraciones
├── models/              # Tipos de TypeScript y definiciones
├── lib/                 # Utilidades genéricas (PDF, formateo)
├── config/              # Variables de entorno y constantes
└── index.ts             # Punto de entrada de la aplicación
```

**Convenciones:**
- Archivos en `kebab-case`: `invoice.controller.ts`, `auth.middleware.ts`
- Carpetas en plural: `routes/`, `services/`, `controllers/`
- Un archivo por entidad principal (no archivos gigantes)

---

## 🔄 Flujo de Datos

El sistema sigue un flujo unidireccional estricto para garantizar la integridad:

```
Cliente HTTP
    ↓
[Middleware Auth] → Valida JWT y extrae user_id
    ↓
[Middleware Validación] → Valida input con Zod
    ↓
[Controller] → Extrae parámetros y llama al Service
    ↓
[Service] → Ejecuta lógica de negocio
    ↓
[Prisma/DB] → Persistencia en PostgreSQL
    ↓
[Controller] → Formatea respuesta
    ↓
Cliente HTTP (JSON response)
```

**Regla de Oro:** La lógica de negocio NUNCA debe estar en controllers. Los controllers son "tontos" y delegan todo a services.

---

## 🛠️ Servicios Críticos y Abstracciones

### 1. Gestión de Documentos (`/services/documentService.ts`)

**Responsabilidades:**
- Crear, leer, actualizar presupuestos y facturas
- Validar reglas de negocio antes de persistir
- Aplicar snapshots de servicios a líneas de documentos

**Snapshots:**
Cuando se añade un servicio a una línea (QuoteLine o InvoiceLine), se debe copiar:
```typescript
{
  descripcion: service.nombre,          // Snapshot
  precio_unitario: service.precio_base, // Snapshot
  iva_porcentaje: service.iva_porcentaje // Snapshot
}
```

**Inmutabilidad:**
```typescript
// Ejemplo de validación antes de editar
export const update = async (userId: string, invoiceId: string, data: any) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, user_id: userId }
  });

  if (!invoice) throw new Error('Factura no encontrada');
  
  // CRÍTICO: Bloquear edición si está enviada
  if (invoice.estado === 'enviada') {
    throw new Error('No se puede editar una factura enviada');
  }

  // Proceder con actualización...
};
```

---

### 2. Numeración Correlativa (`/services/numberingService.ts`)

Genera automáticamente el número legal con formato `YYYY/NNN`.

**Implementación:**
```typescript
export const generateInvoiceNumber = async (userId: string): Promise<string> => {
  const year = new Date().getFullYear();
  
  // Buscar última factura del año
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      user_id: userId,
      numero: { startsWith: `${year}/` }
    },
    orderBy: { numero: 'desc' }
  });

  let nextNumber = 1;
  if (lastInvoice) {
    const lastNum = parseInt(lastInvoice.numero.split('/')[1]);
    nextNumber = lastNum + 1;
  }

  return `${year}/${String(nextNumber).padStart(3, '0')}`;
};
```

**Cuándo se dispara:**
- Solo al cambiar estado de factura de `borrador` a `enviada`
- Debe hacerse dentro de una transacción para evitar duplicados

---

### 3. Generación de PDF (`/lib/pdfGenerator.ts`)

**Decisión:** Backend con Puppeteer (no frontend con jsPDF)

**Ventajas:**
- Consistencia: mismo PDF para todos los usuarios
- Seguridad: validación server-side antes de generar
- Layout complejo usando HTML/CSS

**Implementación futura (Fase 6)**

---

## 📐 Arquitectura de Capas

### 1. Routes (Rutas)

**Responsabilidad:** Definir endpoints y asociarlos a controladores

```typescript
// src/api/routes/invoice.routes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as invoiceController from '../controllers/invoice.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.post('/', invoiceController.create);
router.get('/', invoiceController.list);
router.get('/:id', invoiceController.getById);
router.put('/:id', invoiceController.update);
router.patch('/:id/send', invoiceController.markAsSent);
router.delete('/:id', invoiceController.remove);

export default router;
```

**Reglas:**
- Una ruta por línea (no encadenar)
- Usar middlewares específicos cuando sea necesario
- Verbos HTTP correctos (POST=crear, PUT=reemplazar, PATCH=actualizar parcial)

---

### 2. Controllers (Controladores)

**Responsabilidad:** Manejar request/response, validar inputs, llamar servicios

```typescript
// src/api/controllers/invoice.controller.ts
import { Request, Response } from 'express';
import { createInvoiceSchema } from '../schemas/invoice.schema';
import * as invoiceService from '../../services/invoice.service';

export const create = async (req: Request, res: Response) => {
  // 1. Validar input con zod
  const parsed = createInvoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Datos de entrada inválidos',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten()
      }
    });
  }

  try {
    // 2. Llamar al servicio (lógica de negocio)
    const invoice = await invoiceService.create(
      req.user.id, // user_id del token JWT
      parsed.data
    );

    // 3. Responder con éxito
    return res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    // 4. Manejar errores
    return res.status(500).json({
      success: false,
      error: {
        message: 'Error al crear la factura',
        code: 'INTERNAL_ERROR'
      }
    });
  }
};
```

**Reglas para controladores:**
- ✅ Siempre validar con zod antes de procesar
- ✅ Nunca incluir lógica de negocio (delegar a services)
- ✅ Siempre capturar errores y devolver respuestas consistentes
- ✅ Usar códigos HTTP correctos (201 para crear, 200 para éxito, etc.)
- ❌ Nunca devolver 200 con error dentro del JSON

---

### 3. Services (Servicios)

**Responsabilidad:** Lógica de negocio, interacción con base de datos

```typescript
// src/services/invoice.service.ts
import { prisma } from '../config/database';
import { calculateInvoiceTotals } from '../lib/calculations';

export const create = async (userId: string, data: CreateInvoiceData) => {
  // Verificar que el cliente pertenece al usuario
  const client = await prisma.client.findFirst({
    where: { id: data.clientId, user_id: userId }
  });

  if (!client) {
    throw new Error('Cliente no encontrado');
  }

  // Crear factura con sus líneas en transacción
  return await prisma.$transaction(async (tx) => {
    // Crear la factura
    const invoice = await tx.invoice.create({
      data: {
        user_id: userId,
        client_id: data.clientId,
        estado: 'borrador',
        fecha_emision: new Date(),
        notas: data.notas,
        subtotal: 0,
        total_iva: 0,
        total: 0
      }
    });

    // Crear las líneas
    const lines = await Promise.all(
      data.lines.map(line => 
        tx.invoiceLine.create({
          data: {
            invoice_id: invoice.id,
            service_id: line.serviceId,
            descripcion: line.descripcion,
            cantidad: line.cantidad,
            precio_unitario: line.precioUnitario,
            iva_porcentaje: line.ivaPorcentaje,
            subtotal: line.cantidad * line.precioUnitario
          }
        })
      )
    );

    // Calcular totales
    const totals = calculateInvoiceTotals(lines);

    // Actualizar factura con totales
    return await tx.invoice.update({
      where: { id: invoice.id },
      data: totals,
      include: {
        invoice_lines: true,
        client: true
      }
    });
  });
};
```

**Reglas para servicios:**
- ✅ Toda la lógica de negocio vive aquí
- ✅ Usar transacciones para operaciones que modifican múltiples tablas
- ✅ Siempre filtrar por `user_id` para aislar datos entre usuarios
- ✅ Lanzar errores descriptivos que el controlador pueda capturar
- ❌ Nunca acceder directamente a `req` o `res` (eso es del controlador)

---

### 4. Middlewares

**Responsabilidad:** Autenticación, autorización, validación, error handling

#### Autenticación
```typescript
// src/api/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token no proporcionado',
        code: 'NO_TOKEN'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token inválido o expirado',
        code: 'INVALID_TOKEN'
      }
    });
  }
};
```

#### Error Handler Global
```typescript
// src/api/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Errores conocidos
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Error de validación',
        code: 'VALIDATION_ERROR',
        details: error.message
      }
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'No autorizado',
        code: 'UNAUTHORIZED'
      }
    });
  }

  // Error genérico
  return res.status(500).json({
    success: false,
    error: {
      message: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    }
  });
};
```

---

## ✅ Validación con Zod

**Todos los inputs deben validarse con zod antes de procesarse.**

```typescript
// src/api/schemas/invoice.schema.ts
import { z } from 'zod';

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  lines: z.array(z.object({
    serviceId: z.string().uuid(),
    descripcion: z.string().min(1),
    cantidad: z.number().positive(),
    precioUnitario: z.number().positive(),
    ivaPorcentaje: z.number().min(0).max(100)
  })).min(1, 'La factura debe tener al menos una línea'),
  notas: z.string().optional()
});

export const updateInvoiceSchema = z.object({
  clientId: z.string().uuid().optional(),
  lines: z.array(z.object({
    serviceId: z.string().uuid(),
    descripcion: z.string().min(1),
    cantidad: z.number().positive(),
    precioUnitario: z.number().positive(),
    ivaPorcentaje: z.number().min(0).max(100)
  })).optional(),
  notas: z.string().optional()
});
```

---

## 📤 Estructura de Respuestas

### Respuesta exitosa
```typescript
{
  success: true,
  data: { ... }
}
```

### Respuesta con error
```typescript
{
  success: false,
  error: {
    message: string,      // Mensaje legible para el usuario
    code: string,         // Código de error para el frontend
    details?: any         // Detalles adicionales (ej: errores de validación)
  }
}
```

---

## 🔢 Códigos HTTP

**Usa estos códigos de forma consistente:**

- **200** OK → Operación exitosa (GET, PUT, PATCH)
- **201** Created → Recurso creado (POST)
- **204** No Content → Operación exitosa sin contenido (DELETE)
- **400** Bad Request → Error en datos del cliente (validación)
- **401** Unauthorized → No autenticado (sin token o token inválido)
- **403** Forbidden → Autenticado pero sin permisos
- **404** Not Found → Recurso no encontrado
- **409** Conflict → Conflicto (email duplicado, factura ya enviada)
- **422** Unprocessable Entity → Datos válidos pero acción no permitida
- **500** Internal Server Error → Error del servidor

---

## 🔐 Reglas de Seguridad

### Autenticación
- ✅ Todos los endpoints (excepto `/auth/*`) requieren JWT válido
- ✅ Tokens expiran en 1h (access) y 7d (refresh)
- ✅ Contraseñas hasheadas con bcrypt (nunca texto plano)

### Autorización y Aislamiento de Datos
- ✅ **SIEMPRE** filtrar por `user_id` en queries
- ✅ Verificar que el recurso pertenece al usuario antes de modificar/eliminar
- ✅ No confiar en IDs que llegan del cliente

```typescript
// ❌ INCORRECTO - No verifica ownership
const invoice = await prisma.invoice.findUnique({
  where: { id: invoiceId }
});

// ✅ CORRECTO - Verifica que pertenece al usuario
const invoice = await prisma.invoice.findFirst({
  where: { 
    id: invoiceId,
    user_id: userId  // Del token JWT
  }
});
```

### Validación
- ✅ Validar con zod ANTES de procesar datos
- ✅ Sanitizar inputs para evitar inyecciones
- ✅ Usar Prisma (previene SQL injection automáticamente)

---

## 🔄 Transacciones

**Usar transacciones cuando se modifican múltiples tablas relacionadas.**

```typescript
// Ejemplo: Crear factura con líneas
await prisma.$transaction(async (tx) => {
  const invoice = await tx.invoice.create({ ... });
  await tx.invoiceLine.createMany({ ... });
  await tx.invoice.update({ ... }); // Actualizar totales
  return invoice;
});
```

**Cuándo usar transacciones:**
- ✅ Crear factura + líneas
- ✅ Actualizar factura + líneas
- ✅ Marcar como enviada + generar número
- ✅ Cualquier operación donde fallo parcial deje datos inconsistentes

---

## 📏 Reglas de Negocio en Código

### Facturas - Inmutabilidad
```typescript
// ❌ No permitir editar factura enviada
export const update = async (userId: string, invoiceId: string, data: any) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, user_id: userId }
  });

  if (!invoice) {
    throw new Error('Factura no encontrada');
  }

  if (invoice.estado === 'enviada') {
    throw new Error('No se puede editar una factura enviada');
  }

  // Proceder con actualización...
};
```

### Generación de número de factura
```typescript
export const markAsSent = async (userId: string, invoiceId: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, user_id: userId }
  });

  if (!invoice) throw new Error('Factura no encontrada');
  if (invoice.estado === 'enviada') throw new Error('Factura ya enviada');

  // Generar número en transacción
  return await prisma.$transaction(async (tx) => {
    const numero = await generateInvoiceNumber(userId);
    
    return await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        estado: 'enviada',
        numero
      }
    });
  });
};
```

### Cálculos de totales
```typescript
// src/lib/calculations.ts
export const calculateInvoiceTotals = (lines: InvoiceLine[]) => {
  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const total_iva = lines.reduce((sum, line) => {
    return sum + (line.subtotal * line.iva_porcentaje / 100);
  }, 0);
  const total = subtotal + total_iva;

  return { subtotal, total_iva, total };
};
```

---

## 🧪 Testing

### Estructura de tests
```
src/
├── services/
│   ├── invoice.service.ts
│   └── invoice.service.test.ts
├── api/
│   ├── controllers/
│   │   ├── invoice.controller.ts
│   │   └── invoice.controller.test.ts
```

### Ejemplo de test
```typescript
// src/services/invoice.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import * as invoiceService from './invoice.service';

describe('Invoice Service', () => {
  beforeEach(async () => {
    // Limpiar base de datos de test
  });

  it('should create invoice in borrador state', async () => {
    const userId = 'test-user-id';
    const data = {
      clientId: 'test-client-id',
      lines: [
        {
          serviceId: 'test-service-id',
          descripcion: 'Test Service',
          cantidad: 1,
          precioUnitario: 100,
          ivaPorcentaje: 21
        }
      ]
    };

    const invoice = await invoiceService.create(userId, data);

    expect(invoice.estado).toBe('borrador');
    expect(invoice.numero).toBeNull();
    expect(invoice.total).toBe(121); // 100 + 21% IVA
  });

  it('should not allow editing sent invoice', async () => {
    const userId = 'test-user-id';
    const invoiceId = 'sent-invoice-id';

    await expect(
      invoiceService.update(userId, invoiceId, {})
    ).rejects.toThrow('No se puede editar una factura enviada');
  });
});
```

---

## ⚙️ Variables de Entorno

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/facturacion_db"

# JWT
JWT_SECRET="tu-secreto-super-seguro-aqui"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_SECRET="otro-secreto-para-refresh"
JWT_REFRESH_EXPIRES_IN="7d"

# Servidor
PORT=3000
NODE_ENV="development"

# CORS
ALLOWED_ORIGINS="http://localhost:5173"
```

**Acceso en código:**
Siempre a través de `src/config/env.ts` (nunca `process.env` directo):

```typescript
// src/config/env.ts
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  PORT: z.string().transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test'])
});

export const env = envSchema.parse(process.env);
```

---

## ✅ Checklist al crear un endpoint

- [ ] Ruta definida en `/routes` con método HTTP correcto
- [ ] Middleware de autenticación aplicado (si no es público)
- [ ] Schema de validación con zod creado
- [ ] Controlador valida input con el schema
- [ ] Servicio implementa la lógica de negocio
- [ ] Servicio filtra por `user_id` si aplica
- [ ] Usa transacciones si modifica múltiples tablas
- [ ] Respuestas siguen formato estándar `{ success, data/error }`
- [ ] Códigos HTTP correctos
- [ ] Test unitario creado
- [ ] Documentación en `API.md` actualizada

---

## 📚 Referencias

- **Arquitectura de capas:** Ver `decisions.md` - Decisión "Monolito sobre Microservicios"
- **Base de datos:** Ver `DATABASE.md` para esquema completo
- **API:** Ver `API.md` para contratos de endpoints
- **Dominio:** Ver `domain.md` para glosario de términos
- **Stack:** Ver `general.md` para convenciones y librerías
