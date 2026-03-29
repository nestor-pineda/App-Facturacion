# Identification and Authentication Failures

## Introducción: La puerta de entrada de todo sistema

**Muchos ataques comienzan con un inicio de sesión débil.**

Esta vulnerabilidad aparece cuando la **autenticación o la gestión de identidad están mal implementadas**. Incluye todo el proceso: cómo se crean, almacenan y validan contraseñas, y cómo se gestionan las sesiones.

> Punto clave: Si la puerta de entrada es débil, no importa cuán seguro sea el resto del sistema.
> 

---

## ¿Qué significan Identificación y Autenticación?

**Identificación:** Proceso por el cual el sistema sabe quién eres (ej. email o usuario). Es decir "Soy Juan".

**Autenticación:** Confirma que realmente eres quien dices ser (contraseña, token, biometría). Es demostrar "Y aquí está la prueba de que soy Juan".

**Los fallos aparecen cuando:**

- Permiten acceder sin credenciales válidas
- Se reutilizan sesiones de otros usuarios
- Se puede evitar o eludir la autenticación

---

## Ejemplos comunes de fallos

### 1. **Contraseñas débiles o por defecto**

Panel de administración con "admin/admin" o "123456". Los atacantes prueban estas combinaciones primero.

### 2. **Políticas inseguras**

Permitir contraseñas como "12345", sin límites de intentos ni requisitos de complejidad.

### 3. **Almacenamiento inseguro**

- Contraseñas en texto plano en la base de datos
- Usar hash débil como MD5 o SHA1 (se rompen con tablas rainbow)
- **Solución:** bcrypt, scrypt o Argon2 con sal única

### 4. **Sesiones mal gestionadas**

Tokens que nunca expiran o son predecibles. Si roban el token, pueden usarlo indefinidamente.

### 5. **MFA ausente**

Aplicaciones críticas (bancarias, admin) sin segundo factor de autenticación.

### 6. **Recuperación insegura**

Enlaces de recuperación que nunca expiran, o que revelan si un email existe ("Este email no está registrado").

### 7. **JWT vulnerables**

Tokens sin fecha de expiración o con firma débil/ninguna.

---

## ¿Qué puede hacer un atacante?

- Acceso a cuentas ajenas y robo de datos
- Escalada de privilegios a cuentas administrativas
- Secuestro de sesiones (session hijacking)
- Acceso a paneles/APIs con credenciales por defecto
- **Ataques comunes:** Fuerza bruta, credential stuffing, session fixation

---

## ¿Cómo detectarlo?

**Durante desarrollo:**

- Revisión de código: buscar contraseñas hardcodeadas, algoritmos inseguros
- Pentesting: probar fuerza bruta, bypass de MFA
- Escaneos automáticos: OWASP ZAP, Nikto

**Durante operación:**

- Monitoreo de patrones anormales (100 intentos en 1 minuto, logins desde ubicaciones imposibles)
- Alertas automáticas ante intentos sospechosos

---

## ¿Cómo prevenirlo?

### 1. Contraseñas seguras

**Requisitos mínimos:**

- **Mínimo 12-16 caracteres** o passphrases: "Mi gato come pescado los martes"
- Verificar contra listas de contraseñas vulnerables (Have I Been Pwned)
- **NO permitir:** "123456", "password", "admin"

### 2. Almacenamiento seguro

**Usar algoritmos modernos:**

- **bcrypt** (sólido, ampliamente usado)
- **scrypt** (resistente a ataques de hardware)
- **Argon2** (estado del arte, recomendado)

**Con sal única por contraseña:**

- Sal = valor aleatorio añadido antes de hashear
- Previene ataques con tablas rainbow

**NUNCA usar:**

- ❌ Texto plano
- ❌ MD5 sin sal
- ❌ SHA1
- ❌ Cifrado reversible

### 3. Protección contra fuerza bruta

**Medidas esenciales:**

- **Limitar intentos:** 5 intentos por cuenta
- **Bloqueos progresivos:** 30seg → 5min → 15min → 1hora
- **CAPTCHA** después de X intentos fallidos
- **Rate limiting** por IP

### 4. Gestión de sesiones

**Tokens seguros:**

- Generar tokens **únicos y aleatorios** (no predecibles)
- **Expiración razonable:** 30 min inactividad, 24h máximo
- **Flags de seguridad:**
    - **HttpOnly:** JavaScript no puede leer la cookie (previene XSS)
    - **Secure:** Solo se envía por HTTPS
    - **SameSite:** Protege contra CSRF

**Prácticas adicionales:**

- Regenerar ID de sesión tras login exitoso
- Invalidar sesión al cerrar sesión

### 5. Autenticación multifactor (MFA)

**Implementar para:**

- **Administradores:** Obligatorio siempre
- **Usuarios normales:** Fuertemente recomendado
- **Operaciones sensibles:** Transferencias, cambios de contraseña

**Opciones:**

- App de autenticación (Google Authenticator, Authy) ← Recomendado
- SMS (menos seguro, pero mejor que nada)
- Llaves físicas (YubiKey - más seguro)
- Biometría (huella, Face ID)

### 6. Recuperación de contraseñas segura

**Buenas prácticas:**

- **Enlaces únicos y aleatorios**
- **Caducidad corta:** 15-30 minutos máximo
- **Invalidar tras primer uso**
- **No revelar** si el email existe

**Mensaje correcto:** "Si el email existe en nuestro sistema, recibirás un enlace"
**Mensaje incorrecto:** "Este email no está registrado" ← Revela información

### 7. Seguridad en APIs y JWT

**Para JSON Web Tokens:**

- Incluir **expiración** (exp claim)
- **Firma fuerte:** HS256 mínimo, RS256 mejor
- **Revocación rápida** (blacklist de tokens)
- **No incluir datos sensibles** en el payload

**Para API Keys:**

- Rotación periódica
- Scopes limitados (mínimo privilegio)
- Monitoreo de uso anómalo

### 8. Registro y monitoreo

**Loguear:**

- Intentos de login exitosos y fallidos
- Cambios de contraseña
- Activación/desactivación de MFA
- Accesos desde nuevos dispositivos/ubicaciones

**Alertar cuando:**

- Múltiples fallos de login
- Login desde ubicación inusual
- Cambio de contraseña sin MFA
- Acceso a cuentas de alto privilegio

---

## ¿Cómo mitigar si ya estás afectado?

**Plan de respuesta (primeras 24 horas):**

1. **Evaluación:** Revisar logs, detectar anomalías, identificar alcance
2. **Contención:** Forzar cambio de contraseñas, invalidar todas las sesiones, activar MFA obligatoria
3. **Corrección:** Auditar código, corregir flujos inseguros, actualizar algoritmos de hashing
4. **Comunicación:** Informar a usuarios afectados con instrucciones claras
5. **Refuerzo:** Aumentar monitoreo, implementar alertas adicionales
6. **Documentación:** Documentar incidente, actualizar políticas, capacitar al equipo

---

## Checklist rápido de seguridad

Antes de cada lanzamiento:

1. ☑ ¿Eliminamos **contraseñas por defecto** (admin/admin)?
2. ☑ ¿Las contraseñas están hasheadas con **bcrypt, scrypt o Argon2**?
3. ☑ ¿Las sesiones tienen **expiración y revocación** implementadas?
4. ☑ ¿**MFA activo** para usuarios críticos y administradores?
5. ☑ ¿Los tokens JWT están **firmados y con expiración corta**?
6. ☑ ¿La recuperación de contraseñas es **segura** (enlaces únicos, expiración)?
7. ☑ ¿Hay **límite de intentos** de login y bloqueo temporal?
8. ☑ ¿Los logs registran **intentos fallidos** y accesos exitosos?
9. ☑ ¿Las cookies de sesión tienen flags **HttpOnly, Secure y SameSite**?
10. ☑ ¿Hay **monitoreo activo** de patrones de login anormales?

---

## Herramientas útiles

**Para testing:** OWASP ZAP, Burp Suite, Hydra
**Para desarrollo:** bcrypt/Argon2 (librerías), Passport.js, Auth0, Have I Been Pwned API
**Para monitoreo:** fail2ban, Splunk, ELK, Datadog

---

## Conclusiones clave

1. **La autenticación es la primera línea de defensa.** Si falla, todo es vulnerable.
2. **Cada formulario o token es una puerta al sistema.** Debe ser resistente.
3. **No basta con que "funcione":** Debe ser confiable y resistente a ataques.
4. **Usa frameworks seguros:** Passport, Auth0, Spring Security ya resuelven muchos problemas.
5. **Integra MFA:** Es la defensa más efectiva contra robo de contraseñas.
6. **Proteger usuarios reales es proteger la reputación de tu software.**

**Aplicar autenticación segura te convierte no solo en buen desarrollador, sino en uno responsable.**