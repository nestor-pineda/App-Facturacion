# Configuración Insegura

## ¿Qué es Security Misconfiguration?

**Security Misconfiguration** ocurre cuando una aplicación o sistema se despliega con **configuraciones inseguras o por defecto** que no han sido modificadas.

**Punto clave:** No es un bug en el código, es el **entorno o sus ajustes** los que facilitan el abuso.

> Recuerda: La configuración forma parte del producto. Si la configuración es insegura, el producto completo es inseguro.
> 

---

## Conceptos fundamentales

La configuración insegura se manifiesta cuando:

- **Defaults inseguros:** Cuentas, puertos o servicios que vienen por defecto y nunca se cambian
- **Exposición involuntaria:** Endpoints o paneles de administración accesibles públicamente
- **Cabeceras de seguridad ausentes:** Sin CSP, HSTS o X-Frame-Options
- **Entornos mal configurados:** Permisos excesivos, buckets públicos en la nube
- **Inconsistencias entre entornos:** Staging seguro pero producción no
- **Falta de parches:** Versiones con vulnerabilidades conocidas sin actualizar
- **Exposición de información sensible:** Rutas internas, claves o stack traces visibles

---

## Ejemplos típicos con casos reales

### 1. **Credenciales por defecto**

**Ejemplo:** Una base de datos MongoDB se despliega con usuario "admin" y contraseña "admin123" (valores por defecto), y es accesible desde internet.

- **Problema:** Cualquiera puede conectarse y robar toda la base de datos.

### 2. **Buckets S3 públicos**

**Ejemplo:** Subes backups de tu aplicación a un bucket de Amazon S3 configurado como "público" por error.

- **Problema:** Cualquiera puede listar y descargar tus archivos, incluyendo datos de clientes.
- **Caso real:** Capital One sufrió una brecha en 2019 que expuso datos de 100 millones de clientes por un bucket mal configurado.

### 3. **Panel de administración expuesto**

**Ejemplo:** Tu aplicación tiene una ruta `/admin` accesible sin autenticación, solo "oculta" porque no está enlazada.

- **Problema:** Los atacantes escanean rutas comunes automáticamente. Encontrarán `/admin` en minutos.

### 4. **Mensajes de error detallados**

**Ejemplo:** Cuando falla una consulta SQL, tu app muestra: `"Error: SELECT * FROM users WHERE id='abc' - Table 'production.users' doesn't exist"`

- **Problema:** Revelas que usas SQL, el nombre de tu base de datos y la estructura de tablas.

### 5. **CORS mal configurado**

**Ejemplo:** Tu API acepta peticiones desde cualquier origen (`Access-Control-Allow-Origin: *`)

- **Problema:** Sitios maliciosos pueden hacer peticiones a tu API desde el navegador del usuario.

### 6. **Contenedores Docker con herramientas de debugging**

**Ejemplo:** Tu imagen de Docker incluye herramientas como `curl`, `wget`, `netcat` para facilitar el desarrollo.

- **Problema:** Si un atacante compromete tu contenedor, tiene herramientas listas para moverse lateralmente.

### 7. **TLS no forzado**

**Ejemplo:** Tu sitio web acepta tanto HTTP como HTTPS.

- **Problema:** Los atacantes pueden interceptar el tráfico HTTP y robar cookies/contraseñas.

---

## ¿Qué puede hacer un atacante?

- **Acceder a datos sin autorización** (bases de datos, paneles admin)
- **Exponer backups y datos personales** (buckets públicos)
- **Ejecutar código remotamente** desde servicios mal configurados
- **Moverse lateralmente** dentro de la red aprovechando permisos excesivos
- **Automatizar ataques** al detectar patrones de configuración débil
- **Reducir costos de ataque:** Las configuraciones débiles son fáciles de explotar

**Resultado:** Aumenta masivamente la superficie de ataque.

---

## ¿Cómo detectarlo?

### Durante despliegue/CI

- **Escanear configuraciones** con herramientas de Infrastructure as Code (IaC)
- **Revisar imágenes** de contenedor antes de subirlas

### Durante pruebas/auditoría

- Revisar **puertos abiertos**
- Verificar **permisos** de archivos y servicios
- Comprobar **cabeceras HTTP** de seguridad
- Validar **versiones** de software

### En producción

- **Alertas de IAM** (Identity and Access Management)
- **Logs de acceso anómalo**
- Herramientas **CSPM** (Cloud Security Posture Management)

### Señales típicas de alerta

- Endpoints administrativos accesibles públicamente
- Buckets listables desde internet
- Headers de seguridad ausentes
- Versiones obsoletas de software

---

## ¿Cómo prevenirlo?

### Principios fundamentales

1. **Security by Default:** Instalar siempre con configuración segura desde el inicio
2. **Automatizar IaC:** Revisar políticas en Pull Requests
3. **Mínimo privilegio:** En permisos y roles
4. **Separar entornos:** dev/staging/prod con configuraciones distintas

### Buenas prácticas operativas

**Servicios y accesos:**

- Deshabilitar servicios innecesarios
- Cambiar **todas** las credenciales por defecto
- Usar **vaults** (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault) para secretos

**Comunicaciones:**

- Forzar **TLS/HTTPS** en todas las conexiones
- Configurar **cabeceras seguras:**
    - `Strict-Transport-Security` (HSTS)
    - `Content-Security-Policy` (CSP)
    - `X-Frame-Options`
    - `X-Content-Type-Options`
- Revisar **CORS** en recursos sensibles

**Contenedores:**

- Escanear y **endurecer** imágenes de contenedor
- Eliminar herramientas innecesarias
- Usar imágenes base mínimas (Alpine, distroless)

**Mantenimiento:**

- Automatizar **parches** y monitoreo de CVEs
- Integrar escáneres de:
    - IaC (Terraform, CloudFormation)
    - Secretos (git-secrets, TruffleHog)
    - Dependencias (Dependabot, Snyk)
- Centralizar logs
- Segmentar redes

**Operación continua:**

- **Rotar claves y tokens** regularmente
- Implementar acceso **just-in-time** (solo cuando se necesita)
- **Backups cifrados** y privados
- Documentar hardening en playbooks

---

## ¿Cómo mitigarlo en producción?

Si descubres una configuración insegura ya desplegada:

### Contención inmediata (primeras horas)

1. **Identificar** qué recursos y datos están expuestos
2. **Cerrar acceso:** ACLs, restricción de IPs, WAF, desactivar servicios
3. **Rotar** cuentas, claves y secretos afectados
4. **Aplicar parches** o medidas temporales de bloqueo

### Remediación (días siguientes)

1. **Eliminar** backups públicos y datos filtrados
2. **Implementar controles compensatorios:** WAF, autenticación adicional
3. **Auditar logs** para medir el impacto real
4. **Notificar** incidentes según política de la empresa

### Prevención futura

1. **Corregir IaC** para que no vuelva a ocurrir
2. **Mejorar procesos** de revisión y deployment

**Mantra:** Contener primero, remediar después, mejorar proceso siempre.

---

## Checklist operativo rápido

Antes de cada despliegue, verifica:

1. ☑ ¿Eliminamos **credenciales por defecto**?
2. ☑ ¿El almacenamiento **NO es público** (a menos que haya justificación documentada)?
3. ☑ ¿Endpoints sensibles están **protegidos** y no expuestos?
4. ☑ ¿**TLS forzado** y cabeceras seguras activas?
5. ☑ ¿Imágenes de contenedor **endurecidas**?
6. ☑ ¿Permisos IAM son **mínimos** necesarios?
7. ☑ ¿Hay **escaneos automáticos** en CI/repos/IaC?
8. ☑ ¿Actualizaciones y **CVEs monitoreados**?
9. ☑ ¿**Logs y alertas** de cambios activos?

---

## Herramientas útiles

### Escaneo de configuración

- **Checkov, tfsec:** Para Terraform/IaC
- **Trivy, Clair:** Para imágenes de contenedor
- **ScoutSuite, Prowler:** Para auditoría cloud

### Gestión de secretos

- **git-secrets, TruffleHog:** Detectar secretos en código
- **Vault, AWS Secrets Manager:** Almacenar secretos

### Monitoreo

- **CSPM tools:** Prisma Cloud, AWS Security Hub
- **SIEM:** Splunk, ELK Stack

---

## Conclusiones clave

1. **Configuración segura = seguridad real.** No basta con código seguro si el entorno es vulnerable.
2. **Son errores fáciles de evitar** con disciplina de revisión y automatización.
3. **Como desarrollador junior:** Impulsa checks automáticos y hardening previo a cada despliegue. No necesitas ser experto para proponer mejoras.
4. **Añadir un escáner de secretos o verificador de cabeceras ya es un gran paso.** Pequeñas acciones tienen gran impacto.

**Cada configuración segura reduce riesgos y demuestra responsabilidad profesional.**

---

## Diferencia clave: Insecure Design vs Security Misconfiguration

| Aspecto | Insecure Design | Security Misconfiguration |
| --- | --- | --- |
| **Origen** | Decisiones de arquitectura | Errores de configuración |
| **Momento** | Fase de diseño | Fase de despliegue/operación |
| **Ejemplo** | Sistema sin rate limiting diseñado | Rate limiting existe pero está desactivado |
| **Solución** | Rediseñar el sistema | Corregir la configuración |