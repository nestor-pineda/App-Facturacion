# Informe ejecutivo de seguridad — Sistema de Facturación MVP

**Documento:** Informe ejecutivo orientado a clientes, inversores y evaluación técnica  
**Marco:** OWASP Top 10 (2021)  
**Fecha del informe:** 30 de marzo de 2026  
**Producto:** Sistema de Facturación MVP (monorepo backend + frontend)  
**Documentación relacionada:** [security-OWASP-TOP-10.md](./security-OWASP-TOP-10.md) (checklist de auditoría)

---

## 1. Portada y resumen ejecutivo

| Campo | Valor |
|--------|--------|
| **Producto** | Sistema de Facturación MVP |
| **Tipo de análisis** | Revisión de seguridad orientada a aplicación (código, configuración, reglas de negocio y dependencias) |
| **Metodología** | OWASP Top 10 (2021), revisión de implementación, pruebas automatizadas tras cambios, análisis de dependencias (`npm audit` / actualizaciones controladas) |
| **Alcance** | API REST (Express, Prisma, PostgreSQL), frontend (Vite/React), generación PDF (Puppeteer), asistente IA (Genkit + Google GenAI) |

### Resultado global (indicativo)

| Indicador | Valor |
|-----------|--------|
| **Puntuación de seguridad (sobre 10)** | **8,2 / 10** |
| **Nivel de madurez** | **Intermedio–alto** — adecuado para MVP con controles reforzados; **A01–A10** revisadas y reflejadas en este informe, con mejoras operativas y de madurez enterprise descritas en §5 |

### Resumen para lector no técnico

El producto se ha evaluado con el estándar internacional **OWASP Top 10**, que agrupa los riesgos más frecuentes en aplicaciones web. Se han abordado hallazgos relevantes en **control de acceso**, **validación de datos**, **diseño de reglas de negocio** (numeración, líneas de documento, envío de facturas y presupuestos), **configuración del servidor** y **actualización de componentes**. La aplicación incorpora **aislamiento de datos por usuario**, **autenticación basada en JWT y cookies con buenas prácticas**, **tres secretos criptográficos distintos** (sesión + confirmación de envío), **endurecimiento frente a inyecciones** (incluido el asistente IA) y **registro estructurado** con correlación de peticiones. Las mejoras pendientes típicas de una fase post-MVP (p. ej. MFA, CSP más fina, rotación avanzada de refresh o SBOM formal) están **identificadas como evolución planificada**, no como descuidos.

---

## 2. Tabla de resultados OWASP Top 10

### 2.1 Tabla resumen

| Código | Categoría | Riesgo ANTES | Riesgo DESPUÉS | Estado final | Síntesis (hallazgo + acción) |
|--------|-----------|--------------|----------------|--------------|------------------------------|
| **A01** | Broken Access Control | 🟡 Medio | 🟢 Bajo | ✅ Mitigado | Multi-tenant (`user_id`), propiedad de `client_id`/`service_id`, numeración por usuario, `userId` seguro en el agente. |
| **A02** | Cryptographic Failures | 🟡 Medio | 🟢 Bajo | ✅ Mitigado | Secretos ≥32 y mutuamente distintos (Zod); bcrypt cost 12; JWT solo en cookies httpOnly; refresh persistido como hash SHA-256; sin tokens en JSON de login. |
| **A03** | Injection | 🟡 Medio | 🟢 Bajo | ✅ Mitigado | Zod en body/query/params; SYSTEM_PROMPT anti–prompt-injection; escape en PDF; revisión Prisma. |
| **A04** | Insecure Design | 🟡 Medio | 🟢 Bajo | ✅ Mitigado | Numeración con reintentos ante `P2002`; snapshot de líneas con `service_id`; envío en dos pasos con token firmado (`SEND_CONFIRMATION_SECRET`). |
| **A05** | Security Misconfiguration | 🟡 Medio | 🟢 Bajo | ✅ Mitigado | CORS explícito (orígenes y métodos), Helmet, env validado, errores genéricos al cliente en producción + log en servidor. |
| **A06** | Vulnerable and Outdated Components | 🟡 Medio | 🟢 Bajo | ⚠️ Parcialmente mitigado | Actualización controlada; sin vulnerabilidades moderadas+ en umbral acordado en frontend; bajas residuales posibles en cadena transitiva (p. ej. Google/Genkit). |
| **A07** | Identification and Authentication Failures | 🟡 Medio | 🟢 Bajo | ✅ Mitigado | Política de contraseña (Zod), refresh con hash y revocación en logout, rate limit en auth, cookies httpOnly; mensajes de error sin filtrar existencia de cuenta de forma innecesaria. |
| **A08** | Software and Data Integrity Failures | 🟡 Medio | 🟢 Bajo | ✅ Mitigado (⚠️ cadena de suministro en A06) | Envío de documentos ya no depende de flags del LLM: flujo API en dos pasos + `SEND_CONFIRMATION_SECRET`; totales y snapshots server-side; Genkit con versiones fijadas en `package.json`. |
| **A09** | Security Logging and Monitoring Failures | 🟡 Medio | 🟢 Bajo | ✅ Mitigado | **Pino** + **auditLog** + **X-Request-Id**; eventos de auth, envío de documentos, 404 por ownership, agente; errores de controlador y arranque registrados; minimización de PII en logs de login fallido. |
| **A10** | Server-Side Request Forgery (SSRF) | 🟡 Medio | 🟢 Bajo | ✅ Mitigado | Sin `fetch`/`goto` a URL de usuario; PDF con **setContent** y **escapeHtml**; salidas HTTP solo a destinos fijos (Google AI, SMTP desde **env**, fuentes Google en CSS PDF); endurecimientos opcionales en §5. |

### 2.2 Detalle por categoría (A02, A07, A08, A09 y A10 consolidados)

Las categorías **A02, A07, A08, A09 y A10** están desarrolladas a continuación con el mismo nivel de detalle ejecutivo.

#### A02 — Cryptographic Failures (consolidado)

| Campo | Contenido |
|--------|-----------|
| **Riesgo ANTES** | 🟡 **Medio** — riesgo típico de MVP: secretos débiles o reutilizados, tokens expuestos en cuerpos JSON o almacenamiento inadecuado de hashes de sesión, o factor de coste bcrypt por debajo de buenas prácticas. |
| **Riesgo DESPUÉS** | 🟢 **Bajo** — algoritmos y parámetros alineados con OWASP; gestión de secretos en entorno validada al arranque; superficie de filtración de credenciales de sesión reducida. |
| **Estado** | ✅ **Mitigado** (con mejoras residuales operativas en §5: rotación avanzada de refresh, requisitos enterprise adicionales). |
| **Hallazgo principal** | Fortaleza criptográfica de **autenticación y tokens**: longitud mínima de secretos, **unicidad** entre claves de firma, **no exposición** de JWT en respuestas JSON, almacenamiento de refresh como **digest** irreversible. |
| **Evidencia** | `backend/src/config/env.ts` (Zod: `.min(32)`, `.refine` entre `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SEND_CONFIRMATION_SECRET`); `backend/src/services/auth.service.ts` (`SALT_ROUNDS = 12`, `hashToken` SHA-256 para refresh); `backend/src/api/utils/cookie-config.ts` + `auth.controller.ts` (cookies, sin tokens en `res.json` del login); `backend/scripts/seed.ts` (bcrypt alineado con servicio); README / `.env.example` / `docs/security-OWASP-TOP-10.md`. |

**Síntesis ejecutiva A02:** La auditoría revisó **bcrypt** en `src/` (factor de coste **12**, ≥ OWASP 10), ausencia de **password** en texto plano en respuestas API y uso de **dos secretos JWT distintos** para access y refresh, más un **tercer secreto** exclusivo para firmar el JWT de **confirmación de envío** de facturas y presupuestos — evitando que un único compromiso de clave unifique todos los usos. **Zod** impide arrancar con secretos &lt; 32 caracteres o iguales entre sí. Los tokens de sesión viajan en **cookies `httpOnly`**; el **login** devuelve JSON solo con datos de usuario, no con `accessToken`/`refreshToken`. El refresh token se persiste como **hash SHA-256** (`token_hash`), no en claro. En producción, cookies con **`Secure`** y **`SameSite=None`** (requisito del modelo SPA/API en dominios distintos) complementan la mitigación **anti-CSRF** documentada en A05 (origen permitido + cabecera en mutaciones). **TLS** en tránsito depende del despliegue (Render, Vercel, etc.); no sustituye los controles anteriores.

#### A07 — Identification and Authentication Failures

| Campo | Contenido |
|--------|-----------|
| **Riesgo ANTES** | 🟡 **Medio** — riesgos típicos de MVP: contraseñas débiles sin reglas explícitas, refresh token reutilizable o almacenado de forma reversible, ausencia de límites de velocidad en login/refresh, o exposición de pistas sobre existencia de cuentas en mensajes de error. |
| **Riesgo DESPUÉS** | 🟢 **Bajo** — autenticación alineada con buenas prácticas OWASP para el alcance del producto: derivación de contraseña robusta, sesión en cookies httpOnly, refresh persistido como hash y revocable, y **rate limiting** en rutas de autenticación. |
| **Estado** | ✅ **Mitigado** (evoluciones opcionales en §5: MFA, IdP, blacklist avanzada de refresh). |
| **Hallazgo principal** | **Registro y sesión:** validación Zod en registro con longitud mínima **12**, máximo **128** y requisito de **mayúsculas, minúsculas y dígito**; **bcrypt** (coste 12). **Refresh:** tabla `refresh_tokens` con `token_hash` (SHA-256), comprobación de revocación y caducidad en refresh; **logout** revoca filas activas y limpia cookies. **Protección de fuerza bruta / abuso:** `authLimiter` en middleware de rate limit aplicado a rutas de auth. **Cookies:** configuración centralizada (`cookie-config.ts`) con flags según entorno. **Mensajes:** coherencia revisada para no facilitar enumeración innecesaria de usuarios. |
| **Evidencia** | `backend/src/config/env.ts`; `backend/src/services/auth.service.ts`; `backend/src/api/controllers/auth.controller.ts`; `backend/src/api/middlewares/rate-limit.middleware.ts` (`authLimiter`); `backend/src/prisma/schema.prisma` / migración `refresh_tokens`; tests de integración de auth y refresh tras logout; `docs/security-OWASP-TOP-10.md`. |

**Síntesis ejecutiva A07:** La identificación y la gestión de sesión dejaron de ser el eslabón más débil del MVP: el atacante ya no puede apoyarse solo en contraseñas triviales, ni confiar en que un refresh robado de un backup de base de datos sea usable en claro, ni bombardear login sin un freno de velocidad básico. La revocación en **logout** cierra el ciclo operativo que muchos productos posponen. **MFA** y federación con proveedores enterprise permanecen como mejora de madurez, no como laguna ignorada.

#### A08 — Software and Data Integrity Failures

| Campo | Contenido |
|--------|-----------|
| **Riesgo ANTES** | 🟡 **Medio** — riesgo de que **decisiones de negocio críticas** (p. ej. marcar factura/presupuesto como enviado) dependan de datos controlados por el modelo de IA (`userConfirmed`) o de totales/líneas confiados al cliente; además, reutilizar el mismo material criptográfico para varios tipos de token reduce el aislamiento ante compromiso parcial. |
| **Riesgo DESPUÉS** | 🟢 **Bajo** para **integridad de datos y flujos críticos** en aplicación; la **cadena de suministro** de paquetes npm sigue siendo objeto de vigilancia continuada (traslape con **A06**). |
| **Estado** | ✅ **Mitigado** en el diseño de envío y cálculo de documentos; ⚠️ **Parcialmente mitigado** en sentido estricto OWASP A08 si se exige CI con `npm ci`, firma de artefactos o SBOM (recomendado en §5 para clientes regulados). |
| **Hallazgo principal** | **Integridad del “enviar”:** eliminación de tools `sendInvoice` / `sendQuote` del agente; el LLM **no puede** completar el envío. Solo la API REST: `POST …/send-confirmation` + `PATCH …/send` con `{ confirmationToken }` firmado con **`SEND_CONFIRMATION_SECRET`** (independiente de `JWT_SECRET`). **Integridad numérica:** totales recalculados en servidor; esquemas que no aceptan totales de cabecera arbitrarios del cliente. **Líneas de catálogo:** `applyCatalogSnapshotsToDocumentLines` fija precio/IVA/descripción cuando hay `service_id`. **Supply chain (parcial):** Genkit y plugin Google GenAI con versiones **exactas** en `package.json`; otras dependencias pueden seguir con `^` bajo política de revisión. |
| **Evidencia** | `backend/src/services/send-confirmation-token.service.ts`; `backend/src/api/controllers/invoice.controller.ts` / `quote.controller.ts` (issue + verify); `backend/src/agent/flows/billing.flow.ts`; `backend/src/agent/tools/invoice.tools.ts` / `quote.tools.ts`; `backend/src/agent/prompts/system.prompt.ts`; servicios de factura/presupuesto y tests de integración del flujo de envío; `package.json` (Genkit). |

**Síntesis ejecutiva A08:** El riesgo de que un atacante o un usuario induzca al asistente a “confirmar” un envío **sin un paso verificable por el backend** quedó eliminado: la integridad de la acción irreversible pasa por un **segundo factor criptográfico de aplicación** (token de corta vida con secreto dedicado). Esto es coherente con OWASP A08 en el sentido de **no confiar en componentes no fiables** (el output del LLM) para decisiones de integridad. La separación de secretos evita que filtrar solo la clave de sesión permita forjar confirmaciones de envío.

#### A09 — Security Logging and Monitoring Failures

| Campo | Contenido |
|--------|-----------|
| **Riesgo ANTES** | 🟡 **Medio** — uso predominante de `console.*`, ausencia de correlación estable entre peticiones, **500 silenciosos** en controladores, y **eventos de seguridad** (login fallido/exitoso, token inválido, accesos a recursos ajenos, envío irreversible de documentos, errores del agente IA) **no registrados de forma uniforme** ni explotable en monitorización. |
| **Riesgo DESPUÉS** | 🟢 **Bajo** — **logging estructurado** (JSON), **trazabilidad** por `requestId` / cabecera `X-Request-Id`, **auditoría** con eventos nombrados y payload acotado, y **errores** registrados antes de responder al cliente. |
| **Estado** | ✅ **Mitigado** a nivel de aplicación; ⚠️ **Mejoras operativas** en §5 (destino centralizado de logs, retención, alertas, SIEM) para entornos regulados o alta escala. |
| **Hallazgo principal** | Sustitución por **Pino** (`logger`), middleware de **request ID**, helper **`auditLog`** con constantes de evento (`AUDIT_EVENT`, `RESOURCE_KIND`), registro de **auth** (éxito con `userId`, fallo con dominio de email sin PII completa), **tokens** ausentes/inválidos, **404 por ownership**, **confirmación y envío** de facturas/presupuestos, **agente** (herramientas usadas, errores clasificados), **`logControllerError`** con mensaje legible y `context` estructurado, y manejo global de errores en **`app.ts`** con `logger`. |
| **Evidencia** | `backend/src/config/logger.ts`; `backend/src/constants/audit-events.constants.ts`; `backend/src/lib/audit-log.ts`; `backend/src/lib/log-controller-error.ts`; `backend/src/api/middlewares/request-id.middleware.ts`; `backend/src/app.ts`; `backend/src/api/middlewares/auth.middleware.ts`; controladores (`auth`, `invoice`, `quote`, `client`, `service`, `user`, `pdf`); `backend/src/agent/agent.controller.ts`; `backend/README.md` (sección Logger); `docs/security-OWASP-TOP-10.md`. |

**Síntesis ejecutiva A09:** El producto pasa de una postura “difícil de investigar y auditar” a una **traza forense mínima viable**: cada incidente de seguridad o fallo grave puede correlacionarse con una petición y, en muchos casos, con un **evento de auditoría** explícito. Queda fuera del MVP la **explotación** de esos datos (dashboards, alertas, retención legal), que es de **operaciones** y no de omisión en código.

#### A10 — Server-Side Request Forgery (SSRF)

| Campo | Contenido |
|--------|-----------|
| **Riesgo ANTES** | 🟡 **Medio** (en evaluación preventiva) — cualquier componente que renderice HTML con **navegador embebido** o que acepte **URLs** puede convertirse en vector SSRF si el atacante inyecta destinos internos o metadatos de red. En ausencia de revisión explícita, el riesgo se trata como **latente** hasta validar diseño. |
| **Riesgo DESPUÉS** | 🟢 **Bajo** — **no** hay endpoints que reciban una URL del cliente y la pasen a `fetch`/`axios`/`page.goto`. El PDF usa **`page.setContent(html)`** con HTML generado en servidor; el texto de usuario pasa por **`escapeHtml`** en plantillas. Las **salidas HTTP** restantes son **destinos fijos**: API de Google GenAI (clave solo en servidor), **SMTP** con `host`/`port` desde **variables de entorno validadas**, y carga **opcional** de **Google Fonts** vía `@import` en CSS de PDF (no elegible por el usuario). |
| **Estado** | ✅ **Mitigado** respecto al patrón clásico SSRF; ⚠️ **Endurecimientos opcionales** en §5 (fuentes locales, intercepción de peticiones en Puppeteer, políticas de egress en despliegue). |
| **Hallazgo principal** | Superficie de **SSRF por URL arbitraria** **no identificada** en `backend/src`. Riesgo residual acotado a **egress conocido** (fuentes remotas en CSS, APIs de terceros configuradas por el operador). |
| **Evidencia** | `backend/src/services/pdf.service.ts` (`setContent`, sin `goto`); `backend/src/templates/pdf/*.template.ts` + `escapeHtml`; `backend/src/templates/pdf/styles/document.styles.ts` (`fonts.googleapis.com`); `backend/src/services/email.service.ts` + `env.ts` (SMTP); `backend/src/agent/genkit.config.ts` + `billing.flow.ts`; ausencia de `fetch`/`axios` genéricos en `src/`; `docs/security-OWASP-TOP-10.md`. |

**Síntesis ejecutiva A10:** Para un evaluador técnico, el mensaje clave es **diseño bajo riesgo SSRF**: el servidor **no** actúa como proxy HTTP a destinos elegidos por el usuario. Las únicas salidas son **integraciones declaradas** (correo, IA, tipografía remota en PDF). Las mejoras futuras reducen aún más la dependencia de red en la generación de PDF y facilitan entornos con **egress restringido**.

---

## 3. Controles de seguridad implementados

### 3.1 Autenticación y sesión

- **JWT** con `JWT_SECRET` y `JWT_REFRESH_SECRET` **distintos**, longitud mínima validada al arranque (Zod en `src/config/env.ts`).
- **Secreto dedicado** `SEND_CONFIRMATION_SECRET` para firmar tokens de **confirmación de envío** de facturas y presupuestos; **no reutiliza** los secretos de sesión (comprometer solo el JWT de acceso no debe bastar para forjar el envío).
- **Cookies** para tokens de sesión con flags alineados a entorno (`HttpOnly`, `SameSite`, `Secure` en producción con HTTPS).
- **bcrypt** (12 rondas) y **política de contraseña** en registro (Zod: complejidad y longitud).
- **Refresh tokens** persistidos como hash; **logout** revoca sesiones de refresh y limpia cookies.
- **Rate limiting** dedicado en rutas de autenticación (`authLimiter`).
- **Backlog recomendado:** blacklist/rotación avanzada de refresh y MFA (§5).

### 3.2 Autorización

- Filtrado por **`user_id`** en consultas y servicios (multi-tenant).
- Verificación de **propiedad** de `client_id` y `service_id` en documentos.
- Comportamiento de API frente a recursos ajenos coherente con **no revelar existencia** donde aplica (p. ej. 404 frente a 403 en escenarios IDOR).

### 3.3 Protección de datos e integridad de negocio

- **Inmutabilidad** de facturas/presupuestos en estados enviados/emitidos según reglas de negocio.
- **Snapshot** de líneas cuando existe `service_id` (valores tomados del catálogo, no confiar en precio/IVA/descripción manipulables por el cliente).
- **Numeración correlativa** con manejo de carreras: reintentos ante violación de unicidad (`P2002`), respuesta **409** cuando corresponda tras agotar intentos.
- **Envío en dos pasos:** `POST …/send-confirmation` devuelve `confirmationToken`; `PATCH …/send` con cuerpo JSON `{ "confirmationToken": "…" }` completa la acción y dispara email si SMTP está configurado.

### 3.4 Validación de entrada

- **Zod** en cuerpos, query y parámetros de ruta (incl. UUIDs en `:id`).
- Cliente frontend con cabeceras consistentes (p. ej. `Content-Type: application/json` también en el flujo de refresh).

### 3.5 Infraestructura

- **CORS** con lista explícita de orígenes (sin comodín `*` con credenciales), métodos HTTP declarados.
- **Helmet** para cabeceras HTTP de endurecimiento.
- **Variables de entorno** obligatorias validadas; fallo rápido si faltan o son inválidas (`ALLOWED_ORIGINS` no vacío, sin `*`).
- **Browser mutation guard:** mutaciones bajo `/api` exigen origen/referer permitido y `X-Requested-With: XMLHttpRequest` (el cliente web lo envía).
- **Errores:** mensaje genérico al cliente en producción; registro completo en servidor.

### 3.6 Agente IA

- **userId** inyectado desde el contexto de servidor (JWT), no desde el mensaje del usuario.
- **Sin tools de envío** de factura/presupuesto: el envío irreversible solo por API REST con **token de confirmación** firmado (`SEND_CONFIRMATION_SECRET`); el asistente orienta al usuario hacia la UI.
- **SYSTEM_PROMPT** con sección explícita de defensa frente a **prompt injection** y reglas de no inventar datos ni saltarse confirmaciones humanas.

### 3.7 PDF / HTML

- **Escape HTML** de contenido procedente del usuario en plantillas.
- **Puppeteer** con **`setContent`** (HTML interno), sin **`page.goto`** a URLs de cliente; carga de red acotada a recursos definidos en plantilla (p. ej. fuentes Google en CSS); ver **A10** y §5 para endurecimientos opcionales.

### 3.8 Componentes (A06)

- Actualización planificada de dependencias críticas y funcionales; evitar `npm audit fix --force` cuando degrada el stack (p. ej. Genkit).
- Seguimiento de hallazgos **low** en cadenas transitivas.

### 3.9 Logging y auditoría (traslape con A09)

- **Pino:** JSON en stdout, niveles según `NODE_ENV` (p. ej. `silent` en tests).
- **auditLog** para eventos de seguridad y negocio con `type: "audit"` y `event` constantes.
- **Correlación** con `requestId` / `X-Request-Id`.

### 3.10 Pruebas

- Tests de integración actualizados para nuevas reglas (snapshots, CORS/guard, flujo de envío con confirmación).
- Validación con suite de tests y typecheck/build tras cambios relevantes en toolchain.

---

## 4. Vulnerabilidades identificadas y resueltas (consolidado)

### 4.1 A01 — Broken Access Control / IDOR

| Aspecto | Detalle |
|---------|---------|
| **Riesgo** | Acceso o modificación de datos de otro usuario mediante IDs enumerables sin comprobación de pertenencia. |
| **Fix** | Ownership de `client_id`/`service_id`; consultas acotadas por `user_id`; endurecimiento del agente. |
| **Impacto** | Menor riesgo de fuga horizontal de datos y fraude entre cuentas. |

### 4.2 A01 — Numeración por tenant

| Aspecto | Detalle |
|---------|---------|
| **Riesgo** | Correlativos incorrectos o conflictos entre usuarios del SaaS. |
| **Fix** | Modelo de numeración alineado con unicidad por usuario y reglas de servicio. |
| **Impacto** | Mayor coherencia legal-operativa por obligado tributario/cuenta. |

### 4.3 A03 — Injection

| Aspecto | Detalle |
|---------|---------|
| **Riesgo** | Entradas maliciosas, XSS en PDFs, abuso del LLM vía instrucciones embebidas. |
| **Fix** | Zod; escape en plantillas; prompt del sistema endurecido; revisión de Prisma. |
| **Impacto** | Superficie de abuso reducida; documentos y API más predecibles. |

### 4.4 A04 — Insecure Design

| Aspecto | Detalle |
|---------|---------|
| **Riesgo (numeración)** | Condiciones de carrera al emitir; colisiones `P2002`. |
| **Fix** | Reintentos controlados; manejo explícito de conflicto. |
| **Riesgo (líneas)** | Manipulación de precio/IVA en líneas ligadas al catálogo. |
| **Fix** | Snapshot desde servicio cuando hay `service_id`. |
| **Riesgo (envío)** | Acción irreversible con un solo paso. |
| **Fix** | Token de confirmación firmado con `SEND_CONFIRMATION_SECRET`; flujo en dos peticiones. |
| **Impacto** | Integridad fiscal y UX de seguridad en acciones críticas. |

### 4.5 A05 — Security Misconfiguration

| Aspecto | Detalle |
|---------|---------|
| **Riesgo** | CORS permisivo o desalineado con el frontend; fugas por stack trace; orígenes mal definidos. |
| **Fix** | Orígenes explícitos; métodos CORS listados; validación de `ALLOWED_ORIGINS`; Helmet; log interno de errores. |
| **Impacto** | Menor CSRF vía navegador; menor información útil para atacantes en respuestas HTTP. |

### 4.6 A06 — Componentes vulnerables u obsoletos

| Aspecto | Detalle |
|---------|---------|
| **Riesgo** | CVE conocidas en dependencias directas o transitivas. |
| **Fix** | Subidas de versión controladas; verificación con tests; no forzar downgrades destructivos. |
| **Impacto** | Reducción del riesgo de explotación pública documentada. |

### 4.7 Mejoras transversales

- Documentación de despliegue (secretos, CORS, puerto Vite 8080 vs 5173) para evitar incidentes por **mala configuración**.
- Tests que evitan regresiones de seguridad.

### 4.8 A07 — Identification and Authentication Failures

| Aspecto | Detalle |
|---------|---------|
| **Riesgo** | Autenticación frágil: contraseñas débiles, refresh reutilizable o en claro en BBDD, abuso de login sin límite de tasa, sesión no revocable de forma fiable al cerrar sesión. |
| **Fix** | Registro con Zod (mín. 12 caracteres, mayúscula/minúscula/dígito, máx. 128); bcrypt 12; refresh almacenado como SHA-256; revocación y cookies en logout; `authLimiter` en Express; cookies httpOnly centralizadas. |
| **Impacto** | Menor probabilidad de cuentas comprometidas por diccionario, menor valor de un volcado de BBDD para suplantar sesiones, y menor viabilidad de ataques automatizados contra el login. |

### 4.9 A08 — Software and Data Integrity Failures

| Aspecto | Detalle |
|---------|---------|
| **Riesgo** | Integridad de negocio subvertida: el modelo podía influir en el envío mediante flags; cliente o LLM podrían desalinear totales o líneas respecto al catálogo; un único secreto para varios usos criptográficos. |
| **Fix** | Eliminación de envío vía agente; flujo REST en dos pasos con JWT firmado por `SEND_CONFIRMATION_SECRET`; recálculo server-side de totales; snapshots de líneas con `service_id`; Genkit con versiones fijadas donde aplica. |
| **Impacto** | Acciones fiscales críticas acopladas a pruebas criptográficas del servidor; menor superficie de manipulación por prompts o payloads maliciosos; separación de secretos entre sesión y confirmación de envío. |

### 4.10 A02 — Cryptographic Failures

| Aspecto | Detalle |
|---------|---------|
| **Riesgo** | Uso de secretos JWT cortos o idénticos entre access/refresh/confirmación; contraseñas con poco coste de derivación; exposición de tokens en JSON o almacenamiento del refresh en claro en base de datos. |
| **Fix** | Validación Zod: cada secreto ≥32 caracteres y **emparejamientos prohibidos** entre `JWT_SECRET`, `JWT_REFRESH_SECRET` y `SEND_CONFIRMATION_SECRET` (`env.ts`). **bcrypt** con **12 rondas** en registro; **SHA-256** del refresh antes de persistir; cookies `httpOnly` + opciones por entorno (`cookie-config.ts`); respuestas de login sin cuerpos que incluyan JWT. |
| **Impacto** | Mayor resistencia frente a fuerza bruta offline sobre hashes, separación de **ámbitos criptográficos** (sesión vs. confirmación de envío) y menor riesgo de **robo de sesión** vía XSS leyendo respuestas JSON o filtración de BBDD con tokens en claro. |

### 4.11 A09 — Security Logging and Monitoring Failures

| Aspecto | Detalle |
|---------|---------|
| **Riesgo** | Imposibilidad de auditar incidentes de seguridad, depurar fallos sin correlación de peticiones, y **respuestas 500** sin registro, lo que retrasa detección y cumplimiento. |
| **Fix** | **Pino** con niveles por entorno; **requestIdMiddleware** y cabecera **X-Request-Id**; **`auditLog`** para logins, refresh, tokens, accesos sospechosos (404 por recurso ajeno), confirmación/envío de documentos y agente; **`logControllerError`** en capturas de controladores; **`logger`** en arranque, `env` y handler global en **`app.ts`**; reducción de PII en logs (p. ej. dominio de email en login fallido). |
| **Impacto** | Trazabilidad operativa y evidencia para revisiones de seguridad; base lista para integrar SIEM o agregadores de logs sin rediseñar la aplicación. |

### 4.12 A10 — Server-Side Request Forgery (SSRF)

| Aspecto | Detalle |
|---------|---------|
| **Riesgo** | Que el servidor realizara peticiones a **URLs controladas por el atacante** (red interna, metadatos cloud, escaneo vía PDF o integraciones). |
| **Fix** | Verificación de código: ausencia de **`fetch`/`axios`** a URL de usuario; PDF solo con **`setContent`** y plantillas con **escape**; **SMTP** y **Genkit** acoplados a **env** y SDK fijo; documentación del **egress** legítimo (Google Fonts en CSS de PDF). |
| **Impacto** | El vector SSRF clásico queda **desactivado por diseño**; el operador puede acotar aún más la red en despliegue (firewall de salida) con conocimiento de los destinos reales. |

---

## 5. Riesgos residuales y recomendaciones futuras

Estos puntos son **mejoras planificables** en el backlog; su inclusión aquí confirma que son **conocidos y gestionados**, no omisiones.

- **Afinado de rate limiting:** ya aplicado a **`/api/v1/auth`** (`authLimiter`); valorar umbrales por entorno y extensión selectiva a otros endpoints sensibles si la carga o el abuso lo exigen.
- **Rotación de refresh / familias de tokens** más allá de la revocación en logout (p. ej. detección de reutilización, rotación en cada refresh).
- **Requisitos de contraseña enterprise** (longitud mayor, caracteres especiales) y/o **MFA** e integración con IdP (SAML/OIDC) para clientes corporativos.
- **CSP** avanzada y afinada al frontend (fase report-only → enforce).
- **A10 / Puppeteer (endurecimiento):** incrustar fuentes o servirlas localmente para evitar `@import` remoto en PDF; valorar **intercepción de peticiones** en Chromium (allowlist) y timeouts explícitos; políticas de **egress** en infraestructura para entornos cerrados.
- **A08 (cadena de suministro):** CI con `npm ci`, política de dependencias, SBOM y firma de artefactos si lo exige el cliente o el sector.
- **A09 (operaciones):** envío de logs JSON a **SIEM**/agregador, **retención** alineada a normativa, **alertas** sobre picos de fallos de auth o patrones anómalos, revisión periódica de **PII** en campos de log.
- **A06:** revisión periódica de `npm audit` y parches en cadena Genkit/Google sin `--force` indiscriminado.

---

## 6. Declaración de seguridad (uso comercial, ≤150 palabras)

**Sistema de Facturación MVP** se ha evaluado según el **OWASP Top 10**. La plataforma combina **autenticación sólida** (cookies y tokens con **secretos separados** para sesión y confirmación de envíos), **cifrado en tránsito** mediante **HTTPS** en despliegue, **aislamiento de datos por usuario** y **validación de entradas**. La **emisión y el envío** de documentos siguen reglas de **integridad e irreversibilidad** alineadas con la **facturación en España**. Se aplican **CORS y cabeceras** endurecidas, **protección del asistente IA**, **registro estructurado** de eventos sensibles con **correlación de peticiones**, y un diseño que **no** expone peticiones salientes a **URLs arbitrarias** (riesgo **SSRF** típico). La **hoja de ruta** prevé madurar SIEM, sesión y controles enterprise.

---

## Anexo A — Criterio de puntuación (transparencia)

| Rango | Significado |
|-------|-------------|
| 8,5–10 | Excelente / enterprise-grade en la mayoría de dimensiones |
| 7,0–8,4 | Intermedio–alto: controles sólidos en aplicación; pendientes operativos (SIEM, cadena de suministro, CSP, etc.) |
| 5,0–6,9 | Funcional con deuda de seguridad priorizable |
| &lt;5,0 | Riesgo elevado para producción multi-tenant |

La nota **8,2/10** refleja mitigaciones verificables en **A01–A10** a nivel de aplicación, más controles transversales (logging estructurado, anti-CSRF), con **mejoras operativas** continuas en **A06** (cadena de suministro), **A09** (SIEM/retención) y endurecimientos opcionales **A10** (PDF sin red remota).

---

## Anexo B — Plantilla para completar huecos

```markdown
### A0X — [Nombre]
- **Riesgo antes:** 🔴/🟡/🟢 — [frase]
- **Riesgo después:** 🔴/🟡/🟢 — [frase]
- **Estado:** ✅ / ⚠️ / ❌
- **Evidencia:** [rutas, PRs, comandos]
- **Notas:** [limitaciones, terceros]
```

---

## Anexo C — Checklist rápido due diligence

- ✅ Multi-tenant y ownership en datos enlazados  
- ✅ Tres secretos distintos (JWT access, JWT refresh, confirmación de envío)  
- ✅ Inmutabilidad en documentos emitidos/enviados según reglas  
- ✅ Snapshots en líneas con `service_id`  
- ✅ Envío con confirmación firmada (dos pasos)  
- ✅ CORS + anti-CSRF alineados con el origen real del frontend  
- ✅ Validación Zod en API  
- ✅ Escape en PDF/HTML  
- ✅ Agente IA con controles de contexto y prompt hardening  
- ✅ Pino + auditLog + requestId  
- ⚠️ A06 — monitorizar dependencias transitivas  
- ✅ A02 — fallos criptográficos (secretos, bcrypt, cookies, hash de refresh)  
- ✅ A07 — identificación y autenticación (contraseña, refresh, rate limit, logout)  
- ✅ A08 — integridad de flujos críticos y del agente (envío fuera del LLM, snapshots, secretos separados)  
- ✅ A09 — logging y monitorización (eventos de seguridad, correlación, errores registrados)  
- ✅ A10 — SSRF (sin proxy a URL de usuario; PDF y salidas HTTP revisadas; mejoras opcionales §5)  

---

*Fin del informe ejecutivo. Revisar §5 periódicamente para madurez operativa y dependencias.*
