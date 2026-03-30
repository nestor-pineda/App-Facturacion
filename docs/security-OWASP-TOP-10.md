# Security Checks — OWASP Top 10

Documento de referencia para auditar la seguridad del sistema de facturación. Cada punto está extraído de las categorías del OWASP Top 10 y consolidado para evitar duplicados. Cuando un control aplica a más de una categoría, se describen ambos usos bajo el mismo punto.

---

## 1. Control de Acceso y Autorización

### 1.1 Validar autenticación y autorización en el servidor para cada request
**Categorías:** Broken Access Control · Identification and Authentication Failures

Verifica que todos los endpoints protegidos aplican el middleware `authenticate` y filtran siempre por `user_id` extraído del JWT (nunca del body). Prueba accediendo directamente a rutas como `GET /api/v1/invoices` sin cookie `accessToken` → debe devolver **401**. Prueba también con el token de un usuario distinto intentando acceder a recursos de otro usuario → debe devolver **404** (no **403**, para no revelar existencia del recurso).

### 1.2 Aplicar el principio de mínimo privilegio
**Categorías:** Broken Access Control · Insecure Design · Security Misconfiguration

Comprueba que cada usuario solo puede leer, modificar y eliminar sus propios registros. Crea dos usuarios de prueba (A y B), crea una factura con A, e intenta obtenerla con el token de B → debe devolver **404**. Verifica también que las cuentas de base de datos tienen solo los permisos estrictamente necesarios (no `SUPERUSER`).

### 1.3 Evitar el uso de parámetros del cliente para determinar permisos
**Categorías:** Broken Access Control · Injection

Comprueba que el backend nunca lee `user_id` del body o de query params para decisiones de autorización. Envía una petición con un `user_id` falso en el body y verifica que el sistema usa siempre el `userId` del JWT decodificado.

### 1.4 No exponer rutas administrativas o paneles sin protección
**Categorías:** Broken Access Control · Security Misconfiguration

Escanea rutas conocidas como `/admin`, `/debug`, `/health` con herramientas como `curl` o un escáner de rutas. Verifica que no existe ningún endpoint sin autenticación salvo los explícitamente públicos (`/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`).

### 1.5 Registrar quién accede a qué y generar alertas ante accesos anómalos
**Categorías:** Broken Access Control · Security Logging and Monitoring Failures

Revisa que los logs registran el `user_id`, la ruta, el método HTTP y el resultado para cada request. Simula 20 peticiones fallidas consecutivas a un endpoint protegido y verifica que se genera una entrada de log por cada intento. Comprueba que existe algún mecanismo de alerta (log entry de nivel `warn` o `error`) ante patrones sospechosos.

---

## 2. Autenticación y Gestión de Sesiones

### 2.1 Eliminar credenciales por defecto y prohibir contraseñas débiles
**Categorías:** Identification and Authentication Failures · Security Misconfiguration

Intenta registrar un usuario con contraseñas como `123456`, `password` o `admin`. El schema Zod debe rechazarlas si se ha configurado longitud mínima. Verifica que no existen cuentas de servicio con credenciales por defecto en la base de datos ni en los archivos de configuración.

### 2.2 Almacenar contraseñas con hashing seguro (bcrypt / Argon2) y sal única
**Categorías:** Identification and Authentication Failures · Cryptographic Failures

Crea un usuario y consulta directamente la base de datos (`prisma studio` o `psql`). Verifica que el campo `password` contiene un hash que empieza por `$2b$` (bcrypt) y **nunca** el texto plano. Verifica que el cost factor es al menos 10.

### 2.3 Implementar límite de intentos de login y bloqueo temporal
**Categorías:** Identification and Authentication Failures

Envía 10 peticiones seguidas a `POST /auth/login` con credenciales incorrectas y verifica que las respuestas son consistentes en tiempo (no más rápidas ni más lentas que el primer intento, para evitar timing attacks). Si existe rate limiting, verifica que después del umbral configurado el endpoint devuelve **429**.

### 2.4 Gestionar sesiones con tokens seguros, expiración y revocación
**Categorías:** Identification and Authentication Failures · Cryptographic Failures

Verifica que el `accessToken` tiene expiración de 1 hora y el `refreshToken` de 7 días inspeccionando el payload del JWT (decodificando en base64 sin verificar la firma). Llama a `POST /auth/logout` y comprueba que las cookies se borran (`Set-Cookie` con `Max-Age=0`). Espera a que expire el `accessToken` y verifica que el refresh automático genera una nueva cookie correctamente.

### 2.5 Configurar las cookies de sesión con los flags de seguridad correctos
**Categorías:** Identification and Authentication Failures · Security Misconfiguration

Tras hacer login, inspecciona los headers `Set-Cookie` de la respuesta. Verifica que `accessToken` y `refreshToken` tienen los flags `HttpOnly`, `SameSite=Strict` y `Secure` (en entorno de producción con HTTPS). Intenta leer `document.cookie` desde la consola del navegador → no debe contener ninguno de los tokens.

### 2.6 Proteger la recuperación de contraseñas para no revelar si un email existe
**Categorías:** Identification and Authentication Failures

Si existe un endpoint de recuperación, verifica que el mensaje de respuesta es idéntico tanto si el email existe como si no existe en el sistema (por ejemplo: *"Si el email está registrado, recibirás un enlace"*).

---

## 3. Validación de Inputs e Inyección

### 3.1 Validar con Zod todas las entradas antes de procesarlas
**Categorías:** Injection · Insecure Design

Envía peticiones con campos faltantes, tipos incorrectos o valores vacíos a cada endpoint (`POST /clients`, `POST /invoices`, etc.) y verifica que devuelven **400** con `code: "VALIDATION_ERROR"` antes de llegar a la capa de servicio. Revisa el código para confirmar que `schema.safeParse(req.body)` se ejecuta antes de cualquier lógica de negocio.

### 3.2 Usar Prisma ORM para todas las consultas a base de datos (prevención de SQL Injection)
**Categorías:** Injection

Verifica que no existe ningún uso de `$queryRaw` o concatenación manual de strings SQL en los servicios. Prueba enviando payloads de SQL injection en campos de texto libre (`nombre`, `descripcion`, `notas`) como `' OR 1=1 --` y verifica que la respuesta es un error de validación o que el dato se guarda literalmente (sin ejecutarse como SQL).

### 3.3 Escapar el contenido del usuario antes de renderizarlo en HTML (prevención de XSS)
**Categorías:** Injection · Software and Data Integrity Failures

Si la aplicación genera HTML (templates de email o PDF), verifica que los campos de usuario pasan por la función `escapeHtml()` antes de insertarse en el template. Guarda una descripción de servicio con el valor `<script>alert('xss')</script>` y verifica que en el PDF o email generado aparece escapado como `&lt;script&gt;` y no se ejecuta.

### 3.4 No usar `eval()` ni ejecución dinámica de código
**Categorías:** Injection

Busca en el código fuente usos de `eval`, `Function()`, `setTimeout(string)` o `vm.runInNewContext`. No debe existir ninguno en la lógica de negocio.

---

## 4. Criptografía

### 4.1 Usar algoritmos criptográficos modernos y descartar los obsoletos
**Categorías:** Cryptographic Failures

Verifica que no hay uso de MD5, SHA-1, DES o RC4 en el código. Busca en `package.json` y en el código cualquier librería o llamada que use estos algoritmos. Las únicas operaciones criptográficas deben ser: bcrypt para contraseñas, JWT con HS256 o RS256, y TLS 1.2+ para el transporte.

### 4.2 No incrustar claves ni secretos en el código fuente
**Categorías:** Cryptographic Failures · Security Misconfiguration

Busca en el repositorio cadenas que parezcan secrets (`JWT_SECRET`, `DATABASE_URL`, `API_KEY`, `password`) fuera de los archivos `.env*`. Verifica que `.env` está en `.gitignore` y que el repositorio no tiene histórico con valores reales. Usa herramientas como `git-secrets` o `TruffleHog` para escanear el historial de commits.

### 4.3 Forzar TLS/HTTPS en producción
**Categorías:** Cryptographic Failures · Security Misconfiguration

Verifica que el servidor en producción responde con `Strict-Transport-Security` (HSTS) en los headers. Comprueba que las cookies tienen el flag `Secure: true` cuando `NODE_ENV === 'production'`. Intenta acceder al backend por HTTP → debe redirigir a HTTPS o rechazar la conexión.

### 4.4 Rotar claves y tokens periódicamente
**Categorías:** Cryptographic Failures

Verifica que existe un proceso documentado para rotar `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SEND_CONFIRMATION_SECRET` y `GOOGLE_GENAI_API_KEY`. Comprueba que al cambiar el `JWT_SECRET`, los tokens anteriores dejan de ser válidos (devuelven **401**). Al rotar `SEND_CONFIRMATION_SECRET`, los tokens de confirmación de envío pendientes caducan en la práctica (los nuevos `POST .../send-confirmation` emiten firmas con la clave nueva).

---

## 5. Configuración Segura

### 5.1 Configurar CORS con origen exacto y `credentials: true`
**Categorías:** Security Misconfiguration

Verifica que el backend no usa `Access-Control-Allow-Origin: *`. Envía una petición desde un origen no autorizado y comprueba que el servidor rechaza la petición CORS. Verifica en el código que `origin` está configurado con `process.env.FRONTEND_URL` (sin wildcards).

### 5.2 No exponer información sensible en mensajes de error
**Categorías:** Security Misconfiguration · Security Logging and Monitoring Failures

Provoca errores intencionados (rutas inexistentes, IDs malformados, errores de DB) y verifica que las respuestas nunca exponen stack traces, nombres de tablas, versiones de librerías ni rutas internas del servidor. Los errores del servidor deben devolver siempre el formato estándar `{ success: false, error: { message, code } }`.

### 5.3 Validar variables de entorno al arrancar el servidor
**Categorías:** Security Misconfiguration

Arranca el servidor sin `JWT_SECRET` o sin `DATABASE_URL` y verifica que la aplicación falla inmediatamente con un error claro y no arranca en un estado parcialmente configurado. El schema Zod en `src/config/env.ts` debe bloquear el arranque si falta alguna variable obligatoria. Comprueba también que, si `JWT_SECRET` y `JWT_REFRESH_SECRET` son la misma cadena (aunque cumplan longitud mínima), el arranque falla: deben ser **dos valores distintos** de al menos 32 caracteres. Lo mismo aplica a `SEND_CONFIRMATION_SECRET`: no puede coincidir con ninguno de los dos JWT.

### 5.4 Agregar cabeceras de seguridad HTTP
**Categorías:** Security Misconfiguration

Inspecciona los headers de respuesta del servidor e instala `helmet` si no está. Verifica la presencia de: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy` y `Strict-Transport-Security` en producción.

### 5.5 Separar configuraciones entre entornos (desarrollo, producción, test)
**Categorías:** Security Misconfiguration · Insecure Design

Verifica que `NODE_ENV` está correctamente configurado en cada entorno. Comprueba que el flag `secure` de las cookies es `false` en desarrollo y `true` en producción. Verifica que la base de datos de test es diferente a la de producción.

---

## 6. Diseño Seguro

### 6.1 Aplicar threat modeling antes de implementar nuevas funcionalidades
**Categorías:** Insecure Design

Para cada nueva feature (agente IA, envío de emails, etc.), documenta en un Design Doc los posibles vectores de ataque antes de escribir código. Verifica que el directorio `docs/designs/` contiene un documento por cada feature compleja implementada.

### 6.2 Implementar expiración y revocación en todos los recursos compartibles
**Categorías:** Insecure Design

Verifica que los enlaces de recuperación de contraseña (si existen) tienen un TTL corto. Verifica que los tokens JWT tienen `exp` en su payload. Si se generan URLs temporales para descarga de PDFs en el futuro, deben incluir expiración.

### 6.3 Implementar rate limiting en endpoints críticos
**Categorías:** Insecure Design · Identification and Authentication Failures

Verifica si existe rate limiting en `POST /auth/login` y `POST /auth/register`. Envía 50 peticiones en 10 segundos a estos endpoints y comprueba si hay throttling. Si no existe, evalúa instalar `express-rate-limit`.

### 6.4 Registrar logs en operaciones críticas del negocio
**Categorías:** Insecure Design · Security Logging and Monitoring Failures

Verifica que las siguientes acciones quedan registradas en los logs: login exitoso y fallido, creación y envío de facturas, eliminación de registros, y errores de autenticación. Revisa que los logs incluyen timestamp, `user_id` (cuando aplica), acción realizada y resultado.

---

## 7. Componentes y Dependencias

### 7.1 Mantener las dependencias actualizadas y sin vulnerabilidades conocidas
**Categorías:** Vulnerable and Outdated Components · Software and Data Integrity Failures

Ejecuta `npm audit` en los directorios `backend/` y `frontend/`. Verifica que no existen vulnerabilidades de severidad **high** o **critical** sin resolver. Configura Dependabot en GitHub para recibir alertas automáticas de nuevas CVEs.

### 7.2 Eliminar dependencias innecesarias
**Categorías:** Vulnerable and Outdated Components

Revisa `package.json` y elimina librerías que ya no se usan. Menos dependencias equivale a menor superficie de ataque. Verifica que no se instala `moment.js` (prohibido por `general.md`) ni librerías marcadas como obsoletas.

### 7.3 Usar versiones exactas (`--save-exact`) para dependencias críticas
**Categorías:** Vulnerable and Outdated Components · Software and Data Integrity Failures

Verifica que las dependencias de seguridad críticas (`genkit`, `@genkit-ai/google-genai`, `jsonwebtoken`, `bcrypt`) están fijadas con versión exacta en `package.json`. Esto previene actualizaciones automáticas que podrían introducir código malicioso.

### 7.4 Verificar la integridad de los artefactos y dependencias en el pipeline CI/CD
**Categorías:** Software and Data Integrity Failures

Verifica que existe un `package-lock.json` (o `yarn.lock`) en el repositorio y que no ha sido modificado manualmente. En el pipeline de CI/CD, verifica que se usa `npm ci` (instalación reproducible) en lugar de `npm install`.

### 7.5 Usar imágenes base de contenedor seguras y actualizadas
**Categorías:** Vulnerable and Outdated Components · Software and Data Integrity Failures

Si la aplicación usa Docker, verifica que la imagen base usa una versión LTS activa (no EOL). Ejecuta `trivy image <nombre-imagen>` para detectar CVEs en la imagen. Verifica que la imagen no incluye herramientas de debugging (`curl`, `wget`, `netcat`) innecesarias en producción.

---

## 8. Logging y Monitoreo

### 8.1 Registrar intentos de login exitosos y fallidos con contexto suficiente
**Categorías:** Security Logging and Monitoring Failures · Identification and Authentication Failures

Realiza un login exitoso y uno fallido. Verifica que ambos quedan registrados con: timestamp, IP de origen (si está disponible), email intentado y resultado. Verifica que los logs **no** contienen contraseñas ni tokens en texto plano.

### 8.2 Proteger los logs contra manipulación y almacenarlos de forma centralizada
**Categorías:** Security Logging and Monitoring Failures

Verifica que los logs no se almacenan únicamente en el mismo servidor que la aplicación (un atacante podría borrarlos). En producción (Render/Railway), verifica que los logs están disponibles en el panel de control del proveedor y son independientes del filesystem del contenedor.

### 8.3 Configurar alertas para patrones de acceso anómalos
**Categorías:** Security Logging and Monitoring Failures

Verifica que existen alertas configuradas (o están planificadas) para: múltiples fallos de login desde la misma IP, acceso a endpoints no existentes en ráfagas, y errores 500 en endpoints críticos. Documenta el umbral a partir del cual se considera anómalo.

---

## 9. SSRF (Server-Side Request Forgery)

### 9.1 Validar y restringir las URLs que el servidor puede solicitar externamente
**Categorías:** Server-Side Request Forgery (SSRF)

Identifica en el código funciones que realizan peticiones HTTP salientes (generación de PDFs con Puppeteer, llamadas a la API de Google AI, envío de emails SMTP). Para cada una, verifica que la URL de destino está fijada en el código o en variables de entorno controladas, y no se construye a partir de input del usuario.

### 9.2 Bloquear acceso a IPs privadas y de metadatos desde peticiones iniciadas por el servidor
**Categorías:** Server-Side Request Forgery (SSRF)

Si el servidor realiza peticiones HTTP basadas en input del usuario (no aplica en el MVP actual, pero verificar en el agente IA), añade validación para rechazar URLs que apunten a `127.0.0.1`, `10.x.x.x`, `192.168.x.x` o `169.254.169.254` (metadatos de cloud).

### 9.3 Configurar firewalls de salida para limitar las conexiones externas del servidor
**Categorías:** Server-Side Request Forgery (SSRF)

Verifica que el servidor de producción solo puede conectarse a los servicios externos necesarios: base de datos PostgreSQL, API de Google AI, servidor SMTP. Cualquier otra conexión saliente debe estar bloqueada o registrada.

---

## Checklist rápido antes de cada despliegue

- [ ] `npm audit` sin vulnerabilidades high/critical en backend y frontend
- [ ] No hay secretos en el código fuente (`.env` en `.gitignore`, histórico limpio)
- [ ] Cookies configuradas con `HttpOnly`, `SameSite=Strict` y `Secure` (en producción)
- [ ] CORS configurado con origen exacto y sin wildcard `*`
- [ ] Todas las rutas protegidas requieren cookie `accessToken` válida
- [ ] Todos los queries filtran por `user_id` del JWT
- [ ] Variables de entorno obligatorias validadas al arrancar el servidor
- [ ] Los mensajes de error no exponen información interna (stack traces, nombres de tablas)
- [ ] Los logs registran acciones de autenticación y operaciones críticas
- [ ] Las contraseñas están hasheadas con bcrypt (verificable en DB)
- [ ] `package-lock.json` presente y se usa `npm ci` en CI/CD
- [ ] Los tokens JWT tienen expiración (`exp`) en su payload