---
globs: ["**/*.test.ts", "**/*.spec.ts", "tests/**"]
---

# 🔴 METODOLOGÍA TDD (Test-Driven Development)

## ⚠️ OBLIGATORIO: Este proyecto sigue TDD estricto

**Cada nueva funcionalidad DEBE seguir este ciclo en orden:**

### 1️⃣ RED - Escribir el test primero
Antes de escribir cualquier código de producción, escribe el test que define el comportamiento esperado.

```typescript
// ❌ El test DEBE fallar porque la función aún no existe
it('should create an invoice with correct totals', async () => {
  const invoice = await invoiceService.create(userId, data);
  expect(invoice.total).toBe(242);
});
```

### 2️⃣ Verificar que el test FALLA
Ejecuta `npm run test` y confirma que el test falla por la razón correcta (función no existe, retorna undefined, etc.).

### 3️⃣ GREEN - Escribir el código mínimo para que pase
Implementa solo lo necesario para que el test pase.

```typescript
export const create = async (userId: string, data: any) => {
  // Implementación mínima
  return { total: 242 };
};
```

### 4️⃣ Verificar que el test PASA
Ejecuta `npm run test` y confirma que el test pasa.

### 🛑 SI EL TEST NO PASA DESPUÉS DE IMPLEMENTAR:

**El agente DEBE:**
1. Ejecutar los tests y capturar el output completo
2. Generar un informe con:
   - ❌ Qué test falló
   - 📋 Output del error
   - 🔍 Análisis de por qué falló
   - 💡 Posible causa (función incorrecta, lógica errónea, datos mal preparados)
3. **DETENERSE y esperar instrucciones**

**Nunca continuar si un test falla. Nunca modificar el test para que pase.**

---

## Workflow TDD - Ejemplo Completo

```
Usuario: "Necesito crear el servicio para calcular totales de factura"

Agente:
1. Escribe el test primero:
   ✅ tests/unit/utils/calculations.test.ts

2. Ejecuta: npm run test
   ❌ FAIL - calculateInvoiceTotals is not defined

3. Implementa la función:
   ✅ src/utils/calculations.ts

4. Ejecuta: npm run test
   ✅ PASS - Test pasa correctamente

5. Confirma al usuario: "✅ Funcionalidad implementada con TDD. Test pasa."
```

---

## 🚨 Reglas Estrictas TDD

- ❌ **NUNCA escribas código de producción sin un test que falle primero**
- ❌ **NUNCA modifiques un test para que pase** (solo si requisitos cambian)
- ❌ **NUNCA continues si un test falla** después de implementar
- ✅ **SIEMPRE ejecuta los tests después de escribir el test** (debe fallar)
- ✅ **SIEMPRE ejecuta los tests después de implementar** (debe pasar)
- ✅ **SIEMPRE informa al usuario si algo falla** y detente

---

# Estrategia de Testing

**Framework:** Vitest + Supertest  
**Cobertura mínima:** 80% en servicios y utilidades  
**Estructura:** Arrange / Act / Assert con comentarios explícitos  
**Metodología:** TDD - Test primero, código después

---

# Tipos de Tests

## 1. Tests Unitarios
**Objetivo:** Probar funciones y servicios en aislamiento

**Ubicación:** `tests/unit/`

**Qué testear:**
- ✅ Servicios (`services/`)
- ✅ Utilidades (`utils/`)
- ✅ Middlewares (`middlewares/`)
- ✅ Validaciones con zod (`schemas/`)

**Qué NO testear:**
- ❌ Controllers (son testeados en integración)
- ❌ Routes (son testeados en integración)
- ❌ Código trivial (getters/setters simples)

## 2. Tests de Integración
**Objetivo:** Probar endpoints completos (ruta → controlador → servicio → DB)

**Ubicación:** `tests/integration/`

**Qué testear:**
- ✅ Flujos completos de endpoints
- ✅ Autenticación y autorización
- ✅ Validación de inputs
- ✅ Respuestas y códigos HTTP
- ✅ Interacción real con base de datos de prueba

---

# Estructura de Tests Unitarios

## Template básico (Arrange / Act / Assert)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import * as invoiceService from '../../src/services/invoice.service';
import { prisma } from '../../src/config/database';

describe('invoiceService.create', () => {
  beforeEach(async () => {
    // Limpiar base de datos antes de cada test
    await prisma.invoice.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should create an invoice with lines', async () => {
    // Arrange - Preparar datos
    const user = await prisma.user.create({
      data: {
        email: 'test@test.com',
        password: 'hashed',
        nombre_comercial: 'Test',
        nif: '12345678A',
        direccion_fiscal: 'Calle Test 1'
      }
    });

    const client = await prisma.client.create({
      data: {
        user_id: user.id,
        nombre: 'Cliente Test',
        email: 'cliente@test.com',
        cif_nif: 'B87654321',
        direccion: 'Calle Cliente 1'
      }
    });

    const invoiceData = {
      clientId: client.id,
      lines: [
        {
          serviceId: null,
          descripcion: 'Servicio 1',
          cantidad: 2,
          precioUnitario: 100,
          ivaPorcentaje: 21
        }
      ]
    };

    // Act - Ejecutar acción
    const invoice = await invoiceService.create(user.id, invoiceData);

    // Assert - Verificar resultado
    expect(invoice).toBeDefined();
    expect(invoice.user_id).toBe(user.id);
    expect(invoice.client_id).toBe(client.id);
    expect(invoice.estado).toBe('borrador');
    expect(invoice.subtotal).toBe(200); // 2 * 100
    expect(invoice.total_iva).toBe(42);  // 200 * 0.21
    expect(invoice.total).toBe(242);     // 200 + 42
  });

  it('should throw error if client does not belong to user', async () => {
    // Arrange
    const user1 = await prisma.user.create({ /* ... */ });
    const user2 = await prisma.user.create({ /* ... */ });
    const clientOfUser2 = await prisma.client.create({
      data: { user_id: user2.id, /* ... */ }
    });

    const invoiceData = {
      clientId: clientOfUser2.id,
      lines: [/* ... */]
    };

    // Act & Assert
    await expect(
      invoiceService.create(user1.id, invoiceData)
    ).rejects.toThrow('Cliente no encontrado');
  });
});
```

---

# Estructura de Tests de Integración

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import jwt from 'jsonwebtoken';

describe('POST /invoices', () => {
  let authToken: string;
  let userId: string;
  let clientId: string;

  beforeAll(async () => {
    // Crear usuario de prueba
    const user = await prisma.user.create({
      data: {
        email: 'test@test.com',
        password: 'hashed',
        nombre_comercial: 'Test',
        nif: '12345678A',
        direccion_fiscal: 'Calle Test 1'
      }
    });
    userId = user.id;

    // Generar token
    authToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Crear cliente
    const client = await prisma.client.create({
      data: {
        user_id: user.id,
        nombre: 'Cliente Test',
        email: 'cliente@test.com',
        cif_nif: 'B87654321',
        direccion: 'Calle Cliente 1'
      }
    });
    clientId = client.id;
  });

  afterAll(async () => {
    // Limpiar datos
    await prisma.invoice.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should create invoice with 201 status', async () => {
    // Arrange
    const invoiceData = {
      clientId,
      lines: [
        {
          serviceId: null,
          descripcion: 'Servicio 1',
          cantidad: 1,
          precioUnitario: 100,
          ivaPorcentaje: 21
        }
      ]
    };

    // Act
    const response = await request(app)
      .post('/invoices')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invoiceData);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.estado).toBe('borrador');
  });

  it('should return 401 without auth token', async () => {
    // Act
    const response = await request(app)
      .post('/invoices')
      .send({ clientId, lines: [] });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should return 400 with invalid data', async () => {
    // Arrange - líneas vacías (inválido)
    const invalidData = {
      clientId,
      lines: []
    };

    // Act
    const response = await request(app)
      .post('/invoices')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidData);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

---

# Tests de Utilidades

```typescript
// tests/unit/utils/calculations.test.ts
import { describe, it, expect } from 'vitest';
import { calculateInvoiceTotals } from '../../src/utils/calculations';

describe('calculateInvoiceTotals', () => {
  it('should calculate totals correctly with single line', () => {
    // Arrange
    const lines = [
      {
        cantidad: 2,
        precio_unitario: 100,
        iva_porcentaje: 21,
        subtotal: 200
      }
    ];

    // Act
    const result = calculateInvoiceTotals(lines);

    // Assert
    expect(result.subtotal).toBe(200);
    expect(result.total_iva).toBe(42);   // 200 * 0.21
    expect(result.total).toBe(242);      // 200 + 42
  });

  it('should calculate totals with multiple lines and different IVA', () => {
    // Arrange
    const lines = [
      { cantidad: 1, precio_unitario: 100, iva_porcentaje: 21, subtotal: 100 },
      { cantidad: 2, precio_unitario: 50, iva_porcentaje: 10, subtotal: 100 }
    ];

    // Act
    const result = calculateInvoiceTotals(lines);

    // Assert
    expect(result.subtotal).toBe(200);
    expect(result.total_iva).toBe(31);   // (100 * 0.21) + (100 * 0.10)
    expect(result.total).toBe(231);
  });
});
```

---

# Tests de Reglas de Negocio

```typescript
describe('invoiceService.markAsSent', () => {
  it('should generate sequential invoice numbers', async () => {
    // Arrange
    const user = await createTestUser();
    const client = await createTestClient(user.id);
    
    const invoice1 = await invoiceService.create(user.id, {
      clientId: client.id,
      lines: [/* ... */]
    });
    
    const invoice2 = await invoiceService.create(user.id, {
      clientId: client.id,
      lines: [/* ... */]
    });

    // Act
    const sent1 = await invoiceService.markAsSent(user.id, invoice1.id);
    const sent2 = await invoiceService.markAsSent(user.id, invoice2.id);

    // Assert
    const year = new Date().getFullYear();
    expect(sent1.numero).toBe(`${year}/001`);
    expect(sent2.numero).toBe(`${year}/002`);
  });

  it('should not allow editing sent invoice', async () => {
    // Arrange
    const user = await createTestUser();
    const client = await createTestClient(user.id);
    const invoice = await invoiceService.create(user.id, {
      clientId: client.id,
      lines: [/* ... */]
    });
    await invoiceService.markAsSent(user.id, invoice.id);

    // Act & Assert
    await expect(
      invoiceService.update(user.id, invoice.id, { notas: 'Nueva nota' })
    ).rejects.toThrow('No se puede editar una factura enviada');
  });

  it('should throw error if invoice already sent', async () => {
    // Arrange
    const user = await createTestUser();
    const client = await createTestClient(user.id);
    const invoice = await invoiceService.create(user.id, {
      clientId: client.id,
      lines: [/* ... */]
    });
    await invoiceService.markAsSent(user.id, invoice.id);

    // Act & Assert
    await expect(
      invoiceService.markAsSent(user.id, invoice.id)
    ).rejects.toThrow('Factura ya enviada');
  });
});
```

---

# Helpers y Factories

```typescript
// tests/helpers/factories.ts
import { prisma } from '../../src/config/database';
import bcrypt from 'bcrypt';

export const createTestUser = async (overrides = {}) => {
  return await prisma.user.create({
    data: {
      email: 'test@test.com',
      password: await bcrypt.hash('password123', 10),
      nombre_comercial: 'Test User',
      nif: '12345678A',
      direccion_fiscal: 'Calle Test 1',
      ...overrides
    }
  });
};

export const createTestClient = async (userId: string, overrides = {}) => {
  return await prisma.client.create({
    data: {
      user_id: userId,
      nombre: 'Cliente Test',
      email: 'cliente@test.com',
      cif_nif: 'B87654321',
      direccion: 'Calle Cliente 1',
      ...overrides
    }
  });
};

export const createTestService = async (userId: string, overrides = {}) => {
  return await prisma.service.create({
    data: {
      user_id: userId,
      nombre: 'Servicio Test',
      descripcion: 'Descripción del servicio',
      precio_base: 100,
      iva_porcentaje: 21,
      ...overrides
    }
  });
};
```

---

# Integridad de los Tests

## 🚨 REGLA CRÍTICA

**Los tests definen el comportamiento esperado del sistema, NO al revés.**

### ❌ NUNCA hagas esto:
- Modificar un test para que el código existente pase
- Cambiar aserciones porque el código no las cumple
- Eliminar tests que fallan sin investigar por qué

### ✅ SIEMPRE haz esto:
- Si un test falla, **corrige el código**, no el test
- Si crees que un test está mal escrito, **señálalo y espera confirmación** antes de modificarlo
- La única razón válida para modificar un test es que **los requisitos de negocio hayan cambiado**, y debe haber **confirmación explícita**

---

# Base de Datos en Tests

## Configuración de DB de prueba

```typescript
// tests/setup.ts
import { prisma } from '../src/config/database';

beforeAll(async () => {
  // Conectar a base de datos de prueba
  await prisma.$connect();
});

afterAll(async () => {
  // Desconectar después de todos los tests
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Limpiar datos antes de cada test
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quoteLine.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.client.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();
});
```

## Variable de entorno para tests

```env
# .env.test
DATABASE_URL="postgresql://user:password@localhost:5432/facturacion_test"
JWT_SECRET="test-secret"
JWT_EXPIRES_IN="1h"
```

---

# Cobertura de Tests

## Objetivo mínimo: 80% en servicios y utilidades

```bash
npm run test:coverage
```

## Qué debe tener cobertura alta:
- ✅ Servicios (`services/`) → 80%+
- ✅ Utilidades (`utils/`) → 90%+
- ✅ Middlewares (`middlewares/`) → 80%+

## Qué puede tener menor cobertura:
- Routes (testeadas en integración)
- Controllers (testeadas en integración)
- Config files

---

# Casos de Prueba Críticos

## Para cada entidad principal (Client, Service, Invoice, Quote):

### CRUD básico
- [ ] Crear recurso con datos válidos
- [ ] Crear recurso con datos inválidos (debe fallar)
- [ ] Listar recursos del usuario (solo los suyos)
- [ ] Obtener recurso por ID (solo si le pertenece)
- [ ] Actualizar recurso (solo si le pertenece)
- [ ] Eliminar recurso (solo si le pertenece)

### Seguridad
- [ ] No permitir acceso sin autenticación
- [ ] No permitir acceso a recursos de otro usuario
- [ ] Validar todos los inputs

### Reglas de negocio específicas

**Facturas:**
- [ ] No permitir editar factura enviada
- [ ] Generar número correlativo al enviar
- [ ] Calcular totales correctamente
- [ ] No permitir eliminar factura enviada

**Presupuestos:**
- [ ] Permitir editar solo en estado borrador
- [ ] Convertir presupuesto en factura (opcional)

---

# Comandos de Testing

```bash
# Ejecutar todos los tests
npm run test

# Tests en modo watch (desarrollo)
npm run test:watch

# Tests con cobertura
npm run test:coverage

# Tests unitarios solamente
npm run test:unit

# Tests de integración solamente
npm run test:integration
```

---

# Checklist antes de hacer commit

- [ ] Todos los tests pasan (`npm run test`)
- [ ] Cobertura cumple mínimo 80% en servicios
- [ ] Tests unitarios para nueva lógica de negocio
- [ ] Tests de integración para nuevos endpoints
- [ ] Tests siguen estructura Arrange/Act/Assert
- [ ] No hay tests comentados o skipeados sin justificación
- [ ] Helpers/factories actualizados si es necesario
- [ ] **Toda funcionalidad nueva se implementó siguiendo TDD (test → fallo → código → pasa)**

---

# Template de Informe de Error TDD

**Cuando un test falla después de implementar, el agente DEBE generar este informe:**

```markdown
## ❌ Test Fallido - Requiere Atención

### Test que falló:
`tests/unit/services/invoice.service.test.ts > invoiceService.create > should create invoice with correct totals`

### Output del error:
```
AssertionError: expected 0 to equal 242
  at tests/unit/services/invoice.service.test.ts:45:30
```

### Análisis:
- El test espera que `invoice.total` sea 242
- La función está devolviendo 0
- Posible causa: Los totales no se están calculando correctamente en el servicio

### Código actual (invoice.service.ts):
```typescript
export const create = async (userId: string, data: any) => {
  const invoice = await prisma.invoice.create({
    data: {
      user_id: userId,
      client_id: data.clientId,
      estado: 'borrador',
      subtotal: 0,  // ⚠️ Hardcodeado en 0
      total_iva: 0,
      total: 0
    }
  });
  return invoice;
}
```

### Problema identificado:
Los totales están hardcodeados en 0. Falta calcular los totales a partir de las líneas de la factura.

### Siguiente paso:
Por favor, revisa la lógica de cálculo de totales o confirma cómo deseas que se calculen.

🛑 **Detenido hasta recibir instrucciones.**
```
```
