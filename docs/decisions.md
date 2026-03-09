# Decisiones de Arquitectura

Registro cronológico de decisiones técnicas importantes y las razones detrás de ellas.

---

## [2026-02-26] Express.js sobre Fastify o NestJS

### Decisión
Usar **Express.js 4.x** como framework web del backend.

### Contexto
Necesitábamos elegir el framework para el MVP de facturación. Las opciones evaluadas fueron:
- Express.js (clásico, estable, comunidad enorme)
- Fastify (moderno, rápido, menos maduro)
- NestJS (enterprise, muy estructurado, curva de aprendizaje alta)

### Razones
- Express tiene documentación y recursos infinitos (crucial para un desarrollador trabajando solo)
- El MVP no requiere el rendimiento extremo que ofrece Fastify
- NestJS añade complejidad arquitectónica innecesaria para un proyecto de 1 persona
- Prisma se integra perfectamente con Express
- Más fácil encontrar ayuda en Stack Overflow para Express

### Consecuencias
✅ Desarrollo más rápido por familiaridad y recursos  
✅ Menos bugs por ser tecnología madura  
⚠️ Si en el futuro necesitamos rendimiento extremo, podríamos migrar a Fastify (la arquitectura en capas lo permite)

### Revisión
Se revisará si el proyecto supera los 10,000 usuarios activos o necesitamos optimizaciones críticas de rendimiento.

---

## [2026-02-26] PostgreSQL sobre MongoDB

### Decisión
Usar **PostgreSQL 15+** como base de datos principal.

### Contexto
Sistema de facturación requiere relaciones complejas entre usuarios, clientes, servicios, facturas y líneas de factura.

### Razones
- Las facturas tienen relaciones estrictas y bien definidas (User → Invoice → InvoiceLine → Service)
- Necesitamos **transacciones ACID** para evitar:
  - Números de factura duplicados
  - Facturas sin líneas o líneas sin factura (integridad referencial)
  - Cálculos inconsistentes si falla a mitad de operación
- La numeración correlativa requiere **queries atómicas** para evitar race conditions
- Prisma ORM funciona mejor con bases de datos relacionales
- Los datos tienen estructura fija y conocida (perfecto para esquemas relacionales)

### Alternativa descartada
**MongoDB** fue descartado porque:
- Las facturas NO son documentos independientes, son datos altamente relacionados
- Sin foreign keys, mantener integridad sería manual y propenso a errores
- Las transacciones en MongoDB son más complejas y menos maduras

### Consecuencias
✅ Integridad de datos garantizada por la base de datos  
✅ Queries eficientes con JOINs  
✅ Prisma genera tipos TypeScript automáticamente desde el schema  
⚠️ Requiere servidor PostgreSQL (no puede usar MongoDB Atlas gratuitamente)

---

## [2026-02-26] Prisma ORM sobre TypeORM o SQL puro

### Decisión
Usar **Prisma 5.x** como ORM.

### Contexto
Necesitábamos una forma de interactuar con PostgreSQL desde TypeScript.

### Razones
- **Migraciones automáticas:** Prisma genera y aplica migraciones desde el schema
- **Type-safety completo:** Los tipos TypeScript se generan automáticamente
- **Developer Experience:** Autocompletado perfecto en VSCode
- **Simplicidad:** Menos boilerplate que TypeORM
- **Schema como única fuente de verdad:** Un solo archivo `schema.prisma` define todo
- Documentación excelente y comunidad activa

### Alternativa descartada
**TypeORM:** Más complejo, basado en decoradores, requiere más configuración manual  
**SQL puro:** Máximo control pero sin type-safety y mucho código repetitivo

### Consecuencias
✅ Desarrollo más rápido con menos errores  
✅ Migraciones versionadas automáticamente  
✅ Prisma Studio para inspeccionar datos visualmente  
⚠️ Menos control sobre queries SQL complejas (pero no las necesitamos en MVP)

---

## [2026-02-26] Monolito sobre Microservicios

### Decisión
Construir el backend como un **monolito modular** (single Express app).

### Contexto
Evaluar si separar en microservicios (servicio de auth, servicio de facturas, servicio de clientes...).

### Razones
- **Equipo de 1 persona:** Microservicios añaden complejidad operacional (deployment, logs, networking)
- **MVP temprano:** No conocemos los límites de escala aún
- **Transacciones simples:** Crear factura + líneas debe ser una transacción atómica (imposible entre microservicios)
- **Sin beneficio real:** No hay equipos separados trabajando en módulos diferentes
- **Deployment más simple:** Un solo proceso, un solo servidor

### Alternativa descartada
**Microservicios:** Sobreingeniería para esta fase. Revisaremos cuando:
- Tengamos más de 3 desarrolladores en el equipo
- Diferentes partes del sistema escalen de forma diferente
- Tengamos evidencia real de cuellos de botella de rendimiento

### Consecuencias
✅ Deployment trivial (un solo contenedor)  
✅ Debugging sencillo (logs en un solo lugar)  
✅ Transacciones nativas de PostgreSQL  
⚠️ Si crece mucho, podríamos necesitar separar módulos (pero la arquitectura en capas lo permite)

---

## [2026-02-26] JWT sobre Sessions

### Decisión
Usar **JWT (JSON Web Tokens)** para autenticación.

### Contexto
Sistema de autenticación stateless vs stateful.

### Razones
- **Stateless:** El servidor no necesita almacenar sesiones en memoria o Redis
- **Escalabilidad horizontal simple:** Cualquier instancia puede validar tokens sin estado compartido
- **Deploy simple:** No necesitamos Redis o session store en MVP
- **Expiraciones claras:** Access token (1h) + Refresh token (7d) bien definidos
- Frontend puede guardar token en localStorage/cookies y enviarlo en cada request

### Alternativa descartada
**Sessions con cookies:** Requiere Redis/Memcached o DB para almacenar sesiones. Más complejo para un MVP.

### Consecuencias
✅ Backend sin estado (stateless)  
✅ Fácil de escalar horizontalmente  
⚠️ Los tokens no se pueden invalidar antes de expirar (aceptable para MVP)  
⚠️ Si en el futuro necesitamos invalidación inmediata, podemos añadir una blacklist

---

## [2026-02-26] Zod sobre Class-Validator

### Decisión
Usar **Zod 3.x** para validación de schemas.

### Contexto
Necesitábamos validar inputs de API antes de procesarlos.

### Razones
- **TypeScript-first:** Zod genera tipos automáticamente desde los schemas
- **Runtime validation:** Valida datos reales del usuario en runtime
- **Composición simple:** Fácil de componer schemas complejos
- **Mensajes de error personalizables**
- **Sin decoradores:** Código más limpio que class-validator

### Alternativa descartada
**class-validator:** Requiere clases y decoradores. Más verboso. Tipos TypeScript separados de la validación.

### Consecuencias
✅ Un solo lugar para definir tipos + validación  
✅ Errores de validación claros y estructurados  
✅ Menos código boilerplate

---

## [2026-02-26] TDD (Test-Driven Development) obligatorio

### Decisión
Seguir **TDD estricto** para toda funcionalidad nueva: Test → Fallo → Código → Pasa.

### Contexto
Decidir si escribir tests después del código o antes (TDD).

### Razones
- **Reglas de negocio críticas:** Numeración de facturas, cálculos de IVA, inmutabilidad de facturas enviadas
- **Prevenir regresiones:** Cambios futuros no deben romper comportamiento existente
- **Documentación viva:** Los tests describen el comportamiento esperado del sistema
- **Confianza al refactorizar:** Si los tests pasan, el comportamiento no cambió
- **Evita sobre-ingeniería:** Solo escribes el código necesario para pasar el test

### Metodología
1. Escribir test que define comportamiento esperado (debe fallar)
2. Implementar código mínimo para pasar el test
3. Refactorizar si es necesario (manteniendo tests en verde)
4. Si test falla después de implementar → DETENER y reportar

### Consecuencias
✅ Código con alta cobertura de tests desde el inicio  
✅ Menos bugs en producción  
✅ Refactors seguros  
⚠️ Desarrollo inicial puede sentirse más lento (pero ahorra tiempo a largo plazo)

---

## [2026-02-26] No usar Redux/Zustand en frontend (futuro)

### Decisión
**No usar gestores de estado global** en el frontend cuando se implemente.

### Contexto
Decidir cómo manejar estado en el futuro frontend React.

### Razones
- **Server state vs UI state:**
  - Server state (facturas, clientes) → React Query / TanStack Query
  - UI state (modales abiertos, formularios) → useState / Context
- **Redux es overkill:** El estado global es mínimo (solo auth user)
- **React Query ya cachea datos del servidor**
- **Menos boilerplate:** No necesitamos actions, reducers, selectors

### Alternativa descartada
**Redux/Zustand:** Añaden complejidad innecesaria. El 90% del estado viene del servidor y React Query ya lo gestiona.

### Consecuencias
✅ Menos código de gestión de estado  
✅ React Query maneja cache, loading, errors automáticamente  
⚠️ Si el estado global crece significativamente, reconsideraremos Zustand (más simple que Redux)

---

## [2026-03-09] Zustand adoptado para estado de autenticación — Revisión de decisión anterior

### Decisión
Usar **Zustand** con middleware `persist` exclusivamente para el estado de autenticación (`user`, `isAuthenticated`).

### Contexto
Al implementar la integración frontend-backend, la sesión del usuario (datos del perfil) necesita persistirse entre recargas de página. React Context no persiste automáticamente; requería solución manual (localStorage + re-hidratación).

### Razones
- Los tokens JWT viajan en httpOnly cookies (el frontend no los gestiona), pero el objeto `User` (nombre, email) sí necesita persistencia en cliente para mostrar datos en la UI sin un round-trip al servidor en cada carga.
- Zustand con `persist` resuelve esto en ~20 líneas sin boilerplate de Redux.
- El alcance es mínimo: **solo** `authStore.ts`. El resto del estado sigue en TanStack Query.

### Consecuencias
✅ Sesión persiste entre recargas sin llamada adicional al servidor  
✅ Alcance acotado — no se usa Zustand para datos de dominio  
✅ Coherente con la decisión original de evitar gestores de estado globales para server state

---

## [2026-02-26] Solo IVA 21% en MVP

### Decisión
Soportar **únicamente IVA del 21%** en el MVP.

### Contexto
España tiene múltiples tipos de IVA: 21% (general), 10% (reducido), 4% (superreducido), 0% (exento).

### Razones
- **Simplificación del MVP:** La mayoría de servicios profesionales usan IVA del 21%
- **Evitar complejidad prematura:** Múltiples IVAs requieren UI más compleja (selects, validaciones)
- **Validación de mercado primero:** Confirmar que el producto funciona antes de añadir features
- **Arquitectura lista:** El campo `iva_porcentaje` ya existe en DB, solo es agregar opciones en el futuro

### Plan futuro
En Fase 2 post-MVP, añadir selector de IVA con opciones:
- 21% (General)
- 10% (Reducido)
- 4% (Superreducido)
- 0% (Exento)

### Consecuencias
✅ MVP más rápido de desarrollar  
✅ UX más simple  
⚠️ Usuarios que facturen con otros IVAs deberán esperar a Fase 2  
✅ Base de datos ya soporta cualquier porcentaje (campo flexible)

---

## [2026-02-26] PDF generado en backend, no en frontend

### Decisión
Cuando se implemente generación de PDF (Fase 6), hacerlo en **backend con Puppeteer o PDFKit**.

### Contexto
Los PDFs de facturas se pueden generar en frontend (jsPDF) o backend (Puppeteer/PDFKit).

### Razones
- **Consistencia:** El PDF generado será idéntico para todos los usuarios
- **Seguridad:** El backend valida que el usuario puede acceder a esa factura antes de generar PDF
- **Layout complejo:** Puppeteer permite usar HTML/CSS para el layout (más fácil que PDFKit)
- **Server-side rendering:** No depende del navegador del usuario
- **Caché posible:** Podemos cachear PDFs ya generados

### Alternativa descartada
**Frontend (jsPDF):** Más fácil de implementar pero inconsistente entre navegadores y sin validación server-side.

### Consecuencias
✅ PDFs profesionales y consistentes  
✅ Validación de permisos server-side  
⚠️ Puppeteer consume más recursos (pero solo se usa bajo demanda)

---

## [2026-03-06] Puppeteer para generación de PDFs — Implementación

### Decisión
Implementado **Puppeteer** para la generación on-demand de PDFs de facturas y presupuestos.

### Contexto
Necesitamos entregar facturas en formato PDF para cumplimiento legal en España (Real Decreto 1619/2012). Además, los autónomos necesitan PDFs para enviar a clientes e imprimir.

### Implementación
- Templates HTML con CSS embebido en `src/templates/pdf/` (subcarpeta separada de templates de email)
- Generación on-demand sin almacenamiento en disco ni S3 (stream directo HTTP)
- Validación de permisos mediante `userId` del JWT antes de generar
- Facturas: solo se pueden descargar en estado `enviada` (con número asignado)
- Presupuestos: descarga disponible en ambos estados (`borrador` y `enviado`)
- Browser de Puppeteer siempre se cierra en bloque `finally` para evitar memory leaks
- Puppeteer lanzado con `--no-sandbox` y `--disable-setuid-sandbox` para compatibilidad con entornos PaaS (Railway/Render)

### Nuevos endpoints
- `GET /api/v1/invoices/:id/pdf` — devuelve `application/pdf` o 422 si es borrador
- `GET /api/v1/quotes/:id/pdf` — devuelve `application/pdf` en cualquier estado

### Alternativas descartadas
- **PDFKit:** API imperativa más verbosa, sin preview HTML durante desarrollo
- **Servicios externos (DocRaptor, PDFShift):** Costos recurrentes y privacidad de datos
- **jsPDF en frontend:** Inconsistente entre navegadores y sin validación server-side
- **Almacenar PDFs en S3:** Complejidad de sincronización e invalidación de caché innecesaria en MVP

### Consecuencias
✅ Cumplimiento legal de facturación española  
✅ PDFs visuales consistentes con HTML/CSS estándar  
✅ Sin costos externos de terceros  
✅ Control total sobre el contenido y formato  
⚠️ Puppeteer consume ~150MB RAM por generación (liberada al cerrar el browser)  
⚠️ Tiempo de generación de 2-5 segundos (acceptable para uso ocasional)  
⚠️ Requiere Chromium en el servidor de producción (~300MB, descargado una vez)

---

## [2026-03-09] i18n + Dark/Light theme — Patrones de implementación

### Decisión
Implementar internacionalización (es/en) con `react-i18next` y tema oscuro/claro con Tailwind `darkMode: 'class'`, usando los siguientes patrones específicos.

### Patrones adoptados

**1. Traducciones con importación estática (no HTTP backend)**  
Los JSON de `src/locales/{lng}/common.json` se importan directamente en `src/i18n.ts` con ES imports. Vite los incluye en el bundle.  
Descartado: `i18next-http-backend` añade una petición HTTP en arranque sin beneficio real en un bundle de cliente estático.

**2. ThemeProvider con `useEffect` en `App.tsx` (no DOM en store)**  
El store `themeStore.ts` gestiona solo estado puro (`theme: 'light' | 'dark'`). La aplicación de la clase `dark` al `<html>` se realiza en un `ThemeProvider` como `useEffect` en `App.tsx`.  
Razón: `App.tsx` es ancestro común de todas las rutas, incluyendo Login y Register (fuera de `AppLayout`). Si el DOM se manipulase en el store, la rehidratación sería imperativa y dependiente del orden de inicialización.

**3. Zod schemas como factory functions**  
Todos los schemas de validación de formularios se exportan como `createXSchema = () => z.object(...)` en lugar de objetos estáticos. Los formularios llaman a la factory dentro del `resolver`, capturando el idioma activo en cada render.  
Razón: `i18next.t()` en un objeto estático se evalúa una sola vez al importar el módulo; si el usuario cambia de idioma, los mensajes de validación no se actualizarían.

**4. `i18next.t()` global en hooks de mutación**  
Los custom hooks de TanStack Query usan `i18next` (instancia global) en lugar de `useTranslation()` (hook) para los mensajes de toast, ya que los callbacks `onSuccess`/`onError` se ejecutan fuera del árbol de componentes React.

**5. Zustand extendido a locale y theme**  
Revisión de la decisión "[2026-02-26] No usar Redux/Zustand". Se añaden `localeStore.ts` y `themeStore.ts` exclusivamente para estado de UI global que requiere persistencia en `localStorage`. El estado de dominio (facturas, clientes…) sigue en TanStack Query.

### Consecuencias
✅ Mensajes de validación Zod reactivos al cambio de idioma  
✅ Tema aplicado globalmente incluyendo páginas de auth  
✅ Sin peticiones HTTP adicionales para cargar traducciones  
✅ Idioma y tema persistidos entre sesiones vía `localStorage`  
⚠️ Las factory functions suponen que los forms se re-montan (o se pasa `key`) al cambiar idioma para que el resolver capture el nuevo idioma

---

## [2026-02-26] Sin caché en MVP

### Decisión
**No implementar caché** de datos en el MVP.

### Contexto
Redis, Memcached o caché en memoria podrían acelerar queries frecuentes.

### Razones
- **Premature optimization:** No sabemos qué queries serán lentas hasta tener datos reales
- **Simplicidad operacional:** Sin Redis que configurar, mantener o monitorear
- **PostgreSQL es rápido:** Para volumen del MVP (<1000 usuarios), PG con índices es suficiente
- **Complejidad de invalidación:** El caché debe invalidarse correctamente al editar facturas, clientes, etc.

### Plan futuro
Revisaremos caché cuando:
- Tengamos >10,000 usuarios activos
- Queries específicas tarden >500ms consistentemente
- Tengamos evidencia con herramientas de profiling

### Consecuencias
✅ Arquitectura más simple  
✅ Sin bugs de caché stale  
✅ Deployment más fácil  
⚠️ Si crece mucho, podríamos necesitar caché (pero lo añadiremos con datos reales)

---

## [2026-02-26] Deployment en Railway o Render

### Decisión
Desplegar en **Railway** o **Render** (plataformas PaaS).

### Contexto
Decidir entre VPS (DigitalOcean, Linode), PaaS (Railway, Render) o serverless (Vercel, AWS Lambda).

### Razones
- **Simplicidad de deployment:** Git push → automáticamente en producción
- **PostgreSQL gestionado incluido:** No gestionar backups, updates, replicación manualmente
- **Escalado vertical simple:** Upgrade de plan sin cambiar configuración
- **Logs centralizados:** Ver logs sin SSH al servidor
- **HTTPS y dominios incluidos:** Sin configurar Nginx/Certbot manualmente
- **Free tier para desarrollo:** Railway ofrece $5/mes gratis

### Alternativa descartada
**AWS/DigitalOcean VPS:** Más control pero requiere gestión manual de servidor, backups, seguridad, actualizaciones.  
**Serverless (Vercel):** No es ideal para backend con PostgreSQL y procesos largos.

### Consecuencias
✅ Deployment en minutos, no horas  
✅ Menos tiempo en DevOps, más en features  
⚠️ Más caro a escala muy grande (pero aún falta mucho para eso)

---

## Plantilla para Nuevas Decisiones

```markdown
## [YYYY-MM-DD] Título de la Decisión

### Decisión
Qué se decidió.

### Contexto
Por qué necesitábamos tomar esta decisión.

### Razones
- Razón 1
- Razón 2
- Razón 3

### Alternativa descartada
Qué otras opciones consideramos y por qué no las elegimos.

### Consecuencias
✅ Beneficios
⚠️ Trade-offs
❌ Limitaciones aceptadas

### Revisión
Cuándo reconsideraremos esta decisión.
```

---

## Instrucciones para el Agente

1. **Antes de proponer cambios arquitectónicos**, revisar este archivo para ver si ya fue decidido
2. **Si encuentras una decisión aquí**, no propongas la alternativa descartada sin justificación nueva
3. **Al tomar una decisión técnica importante**, añade una entrada siguiendo la plantilla
4. **Si los requisitos cambian**, actualiza la decisión correspondiente con fecha y razón del cambio
