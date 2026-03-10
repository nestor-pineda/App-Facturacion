---
alwaysApply: true
---

# Reglas Globales del Proyecto

Este documento contiene las convenciones y reglas que se aplican a **todo el proyecto**, sin importar la capa o el módulo en el que se esté trabajando.

---

## 📚 Estructura de Documentación

**Para información específica, consulta estos documentos:**

- **`backend.md`** → Arquitectura de capas, flujo de datos, estructura de carpetas
- **`API.md`** → Contratos de endpoints, request/response, errores
- **`DATABASE.md`** → Esquema de base de datos, tipos, restricciones
- **`ENVIRONMENT.md`** → Variables de entorno requeridas
- **`CONTEXT/product.md`** → Definición del producto, alcance del MVP
- **`CONTEXT/domain.md`** → Glosario de términos del dominio
- **`CONTEXT/decisions.md`** → Decisiones arquitectónicas y sus justificaciones

**Este documento (general.md) contiene solo las reglas transversales.**

---

## 🛠️ Stack Tecnológico

### Backend
- **Node.js:** v20 LTS
- **Framework:** Express.js 4.x
- **Lenguaje:** TypeScript 5.x
- **ORM:** Prisma 5.x
- **Base de datos:** PostgreSQL 15+
- **Autenticación:** JWT (jsonwebtoken 9.x) + bcrypt 5.x
- **Validación:** zod 3.x
- **Testing:** Vitest + Supertest
- **Gestión de entorno:** dotenv 16.x

### Generación de documentos (futuro)
- **PDF:** Puppeteer (Fase 6)

### Utilidades
- **Fechas:** date-fns
- **Formateo de moneda:** Intl.NumberFormat

---

## ❌ Librerías Prohibidas

- ❌ No usar **moment.js** → usar **date-fns**
- ❌ No usar **class-validator** → usamos **zod**
- ❌ No usar **Sequelize** u otros ORMs → usamos **Prisma**
- ❌ No guardar contraseñas en texto plano → siempre usar **bcrypt**
- ❌ No usar **lodash** para operaciones simples que JavaScript ya tiene nativas

**Antes de instalar una nueva librería:**
1. Verifica si ya existe funcionalidad nativa en JS/TS
2. Consulta `decisions.md` para ver si fue evaluada y descartada
3. Actualiza la sección "Stack Tecnológico" de este archivo si la instalas

---

## 📝 Convenciones de Naming

### Base de datos (snake_case)
```sql
user_id, nombre_comercial, created_at, total_iva, fecha_emision
```

### TypeScript/JavaScript (camelCase)
```typescript
userId, nombreComercial, createdAt, totalIva, fechaEmision
```

### Archivos y carpetas (kebab-case)
```
auth.routes.ts
invoice.controller.ts
quote.service.ts
invoice-line.schema.ts
```

### Constantes (UPPER_SNAKE_CASE)
```typescript
const DEFAULT_IVA_PERCENTAGE = 21;
const MAX_INVOICE_LINES = 100;
```

### Enums (PascalCase para tipo, UPPER_CASE para valores)
```typescript
enum InvoiceStatus {
  BORRADOR = 'borrador',
  ENVIADA = 'enviada'
}

enum DocumentType {
  QUOTE = 'quote',
  INVOICE = 'invoice'
}
```

### Tipos e Interfaces (PascalCase)
```typescript
interface CreateInvoiceData {
  clientId: string;
  lines: InvoiceLine[];
}

type UserId = string;
```

---

## 🎯 Comportamiento General del Agente

### Antes de programar
- ✅ **Lee el documento relevante primero**
  - ¿Es un endpoint? → Lee `API.md` y `backend.md`
  - ¿Modificas la DB? → Lee `DATABASE.md`
  - ¿No estás seguro de un término? → Lee `domain.md`
  - ¿Feature nueva compleja? → Busca o solicita Design Doc en `CONTEXT/designs/`

### Al programar
- ✅ Nunca elimines archivos sin confirmación explícita del usuario
- ✅ Siempre crea el test unitario junto al código nuevo (TDD)
- ✅ Si modificas una función pública, actualiza su JSDoc/TSDoc
- ✅ Ante la duda, **pregunta antes de asumir**
- ✅ Todos los endpoints protegidos deben verificar `user_id` para aislar datos
- ✅ Usa transacciones para operaciones que modifican múltiples tablas
- ✅ Valida TODOS los inputs con zod antes de procesarlos
- ✅ Nunca pongas lógica de negocio en controladores (va en services)

### Después de programar
- ✅ Ejecuta los tests para verificar que no rompiste nada
- ✅ Actualiza documentación si es necesario (ver sección "Actualización de Documentación")

---

## 🧪 Testing (TDD obligatorio)

**Metodología Test-Driven Development:**

1. **Escribir test primero** (debe fallar)
2. Implementar código mínimo para pasarlo
3. Refactorizar manteniendo tests en verde
4. Si test falla después de implementar → **DETENER y reportar**

**Cobertura mínima:**
- Servicios: 80%
- Controladores: 70%
- Utilidades: 90%

**Qué testear:**
- ✅ Lógica de negocio crítica (numeración, cálculos, inmutabilidad)
- ✅ Validaciones de entrada
- ✅ Reglas de autorización (user_id)
- ✅ Casos edge (factura sin líneas, números duplicados, etc.)

**Qué NO testear:**
- ❌ Getters/setters simples
- ❌ Configuración de Prisma
- ❌ Archivos de tipos/interfaces

**Ver `testing.md` para guías detalladas de testing**

---

## ⚙️ Comandos Principales

### Desarrollo
```bash
npm run dev          # Levantar servidor en modo desarrollo (con hot reload)
npm run build        # Compilar TypeScript a JavaScript
npm start            # Ejecutar versión compilada (producción)
npm run lint         # Ejecutar ESLint
npm run format       # Formatear código con Prettier
```

### Base de datos
```bash
npx prisma migrate dev --name <nombre>  # Crear y aplicar migración en desarrollo
npx prisma migrate deploy               # Aplicar migraciones en producción
npx prisma studio                       # Abrir GUI de base de datos
npx prisma generate                     # Regenerar cliente de Prisma
npx prisma db seed                      # Ejecutar seeds (datos de prueba)
```

### Testing
```bash
npm run test             # Ejecutar todos los tests
npm run test:watch       # Tests en modo watch (útil durante desarrollo)
npm run test:coverage    # Tests con reporte de cobertura
npm run test:unit        # Solo tests unitarios
npm run test:integration # Solo tests de integración
```

### Utilidades
```bash
npm run typecheck        # Verificar tipos de TypeScript sin compilar
npm run clean            # Limpiar archivos compilados y cache
```

---

## 🔐 Reglas de Seguridad Globales

Estas reglas se aplican **siempre**, sin excepción:

1. **Contraseñas:** Siempre hasheadas con bcrypt (cost factor 10)
2. **Tokens JWT:** 
   - Access: 1h de expiración
   - Refresh: 7d de expiración
3. **Aislamiento de datos:** 
   - Filtrar SIEMPRE por `user_id` en queries
   - Verificar ownership antes de modificar/eliminar
4. **Variables sensibles:** 
   - Nunca commitear `.env`
   - Acceder solo a través de `src/config/env.ts` (validado con zod)
5. **Validación de inputs:** 
   - Validar con zod ANTES de procesar
   - No confiar en datos del cliente
6. **CORS:** 
   - Solo dominios permitidos en `ALLOWED_ORIGINS`
7. **Rate limiting:** 
   - Endpoints de auth limitados (futuro)

---

## 📋 Design Docs

Para **features complejas** (ej: generación de PDF, envío de emails, reportes):

1. **Antes de empezar**, verifica si existe un Design Doc en `CONTEXT/designs/`
2. Si **NO existe**:
   - **DETÉN** la implementación
   - Solicita al usuario que cree uno usando `CONTEXT/designs/_template.md`
3. Si **SÍ existe**:
   - Léelo completamente antes de escribir código
   - Síguelo estrictamente
   - Si encuentras problemas, repórtalos antes de improvisar

**Nunca tomes decisiones arquitectónicas importantes sin respaldo documental.**

### 📂 Design Docs activos

| Feature | Documento principal | Referencia técnica | Estado |
| :--- | :--- | :--- | :--- |
| Agente IA de lenguaje natural | `CONTEXT/designs/ai-agent/DESIGN_DOC_Agente_IA.md` | `CONTEXT/designs/ai-agent/GENKIT_Reference.md` | 🟡 Pendiente implementación |

**Regla adicional para el módulo `src/agent/`:** Cualquier trabajo dentro de esta carpeta requiere leer previamente **ambos** documentos del agente IA. El Design Doc define la arquitectura y contratos; la referencia técnica de Genkit define los imports, formatos y errores comunes. No empezar a escribir código sin haberlos leído.

---

## 📝 Actualización de Documentación

Al completar una tarea, **actualiza documentación solo si**:

### ✅ Debes actualizar:
- **`API.md`** → Añadiste o modificaste un endpoint
- **`DATABASE.md`** → Modificaste el esquema de Prisma (y ejecuta migración)
- **`CONTEXT/decisions.md`** → Tomaste una decisión técnica relevante
- **`general.md` (este archivo)** → Instalaste una nueva dependencia importante

### ❌ NO actualices para:
- Bugfixes menores
- Cambios internos de implementación que no afectan contratos
- Refactors que no cambian comportamiento
- Ajustes de estilos o UI triviales

**Formato de commits al actualizar docs:**
```
docs: actualizar API.md con endpoint POST /invoices/send
```

---

## 🚨 Señales de Alerta

**Detén y pregunta si:**
- Vas a eliminar código sin entender para qué sirve
- Encuentras lógica de negocio en un controlador (debería estar en service)
- Ves un query sin filtro `user_id` (violación de seguridad)
- Una factura `enviada` está siendo modificada (debe ser inmutable)
- Vas a instalar una librería nueva no documentada
- Un test falla después de tu cambio
- Necesitas más de 300 líneas de código para una sola feature

**Pregunta al usuario antes de:**
- Cambiar estructura de carpetas
- Modificar esquema de base de datos
- Cambiar formato de respuestas de API
- Eliminar funcionalidad existente

---

## 🎯 Principios de Diseño

1. **KISS (Keep It Simple, Stupid)**
   - Código simple y legible > código "inteligente"
   - Si necesitas un comentario para explicarlo, probablemente está muy complejo

2. **DRY (Don't Repeat Yourself)**
   - Extrae código duplicado a funciones/utilidades
   - Pero no obsesionarse: 2 repeticiones no son un patrón

3. **YAGNI (You Aren't Gonna Need It)**
   - No implementes funcionalidad "por si acaso"
   - Espera a que sea realmente necesaria

4. **Separation of Concerns**
   - Rutas → Controllers → Services → DB
   - Cada capa tiene una responsabilidad clara

5. **Fail Fast**
   - Validar inputs al inicio
   - Lanzar errores claros inmediatamente
   - No dejar que datos inválidos se propaguen

---

## 🗂️ Organización de Imports

**Orden estándar:**
```typescript
// 1. Librerías externas
import { Router } from 'express';
import { z } from 'zod';

// 2. Tipos de TypeScript
import type { Request, Response } from 'express';

// 3. Módulos internos (en orden alfabético)
import { authenticate } from '../middlewares/auth.middleware';
import * as invoiceService from '../../services/invoice.service';
import { createInvoiceSchema } from '../schemas/invoice.schema';

// 4. Utilidades y configuración
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
```

---

## 📦 Gestión de Dependencias

**Antes de instalar:**
```bash
# 1. Verifica si ya existe
npm list <paquete>

# 2. Revisa tamaño y dependencias
npm view <paquete>

# 3. Instala versión específica (evita breaking changes)
npm install <paquete>@<version> --save-exact
```

**Actualizar dependencias:**
```bash
# Ver outdated
npm outdated

# Actualizar con cuidado (una a la vez)
npm update <paquete>

# Ejecutar tests después de cada actualización
npm test
```

---

## 🔍 Debugging

**Console logs:**
- ✅ Permitidos en desarrollo (`NODE_ENV=development`)
- ❌ Elimínalos antes de commit a `main`
- ✅ Usa `logger` para logs permanentes

**Errores:**
```typescript
// ❌ MAL: Error genérico
throw new Error('Error');

// ✅ BIEN: Error descriptivo
throw new Error('No se puede editar factura enviada: estado=enviada, id=' + id);
```

---

## 📐 Límites de Código

**Para mantener legibilidad:**
- Funciones: máximo 50 líneas (ideal: 20)
- Archivos: máximo 300 líneas
- Parámetros de función: máximo 5 (usa objeto si necesitas más)
- Nivel de anidación: máximo 3 niveles de indentación

**Si excedes estos límites:**
- Extrae funciones auxiliares
- Divide en módulos más pequeños
- Revisa si hay lógica duplicada

---

## 🎨 Code Style

**Sigue configuración de ESLint y Prettier:**
```bash
# Formatear automáticamente
npm run format

# Ver errores de estilo
npm run lint

# Autofixear lo que se pueda
npm run lint:fix
```

**Reglas importantes:**
- Usar `const` por defecto, `let` solo si reasignas
- No usar `var` nunca
- Preferir arrow functions: `const fn = () => {}`
- Usar template strings: `` `Hola ${nombre}` ``
- No usar `any` en TypeScript (usa `unknown` si es necesario)

---

## ✅ Checklist General para Cualquier Feature

Antes de considerar una tarea como completada:

- [ ] Código implementado siguiendo arquitectura de capas
- [ ] Tests escritos y pasando (TDD)
- [ ] Validación con zod implementada
- [ ] Filtrado por `user_id` si aplica
- [ ] Códigos HTTP correctos
- [ ] Errores manejados apropiadamente
- [ ] Documentación actualizada si es necesario
- [ ] Sin console.logs olvidados
- [ ] ESLint sin errores
- [ ] TypeScript sin errores de tipos
- [ ] Commits descriptivos siguiendo convenciones

---

## 📖 Recursos Adicionales

- **Prisma Docs:** https://www.prisma.io/docs
- **Zod Docs:** https://zod.dev
- **Express Best Practices:** https://expressjs.com/en/advanced/best-practice-security.html
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/handbook

---

**Última actualización:** 2026-02-27
