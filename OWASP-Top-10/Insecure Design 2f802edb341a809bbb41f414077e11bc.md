# Insecure Design

## ¿Qué es Insecure Design?

El **Diseño Inseguro** es una vulnerabilidad que **NO proviene del código**, sino de decisiones incorrectas tomadas durante el diseño y la arquitectura del sistema. Aunque el código esté perfectamente implementado, el sistema es vulnerable por diseño.

**Diferencia clave:** No es un bug de programación, es una **omisión o mala decisión arquitectónica**.

---

## Conceptos fundamentales

El diseño inseguro ocurre cuando:

- **No se realiza modelado de amenazas** (threat modeling)
- Los requisitos **no incluyen criterios de seguridad**
- La arquitectura **amplifica riesgos** innecesariamente
- Faltan principios básicos como:
    - **Least Privilege** (mínimo privilegio): dar solo los permisos estrictamente necesarios
    - **Defense in Depth** (defensa en profundidad): múltiples capas de seguridad
- No hay **trazabilidad** ni **separación de funciones**

**Resultado:** Cada componente individual puede funcionar correctamente, pero el sistema completo es inseguro.

---

## Ejemplos típicos con casos prácticos

### 1. **Enlaces compartidos sin expiración**

**Ejemplo:** Compartes un documento mediante un enlace. Ese enlace funciona para siempre, incluso después de que ya no necesites compartirlo.

- **Problema:** Si alguien guarda el enlace, puede acceder indefinidamente.

### 2. **Roles mal definidos**

**Ejemplo:** Un sistema solo tiene dos roles: "usuario" y "admin". Un editor de contenido necesita publicar artículos, pero no debería poder borrar usuarios.

- **Problema:** Al no tener granularidad, o le das privilegios de admin (excesivos) o no puede hacer su trabajo.

### 3. **Sin rate limiting en APIs**

**Ejemplo:** Una API de login que permite intentos ilimitados de contraseña.

- **Problema:** Un atacante puede probar millones de contraseñas automáticamente (fuerza bruta).

### 4. **Autenticación opcional en funciones críticas**

**Ejemplo:** Una app bancaria que permite consultar el saldo sin autenticación "para mejorar la experiencia de usuario".

- **Problema:** Priorizas UX sobre seguridad en un contexto crítico.

### 5. **Dependencias sin plan de actualización**

**Ejemplo:** Usas 20 librerías de terceros pero no tienes proceso para actualizarlas cuando descubren vulnerabilidades.

- **Problema:** Tu sistema queda expuesto a riesgos conocidos.

---

## ¿Qué puede hacer un atacante?

- **Acceder a datos sensibles** usando flujos legítimos del sistema
- **Escalar privilegios** aprovechando reglas de negocio mal definidas
- **Abusar de integraciones** con terceros que tienen permisos excesivos
- **Hacer scraping masivo** o ataques automatizados sin limitaciones
- **Actuar sin dejar rastro** si no hay logs de auditoría

**El impacto es amplio:** No solo compromete la seguridad, también dificulta detectar y responder a incidentes.

---

## ¿Cómo detectarlo?

### Durante requisitos

- Buscar decisiones que **ignoren la seguridad**
- Verificar si se hizo **threat modeling** (o si fue superficial)

### Durante desarrollo

- Las **mitigaciones improvisadas** son señales de alarma de diseño débil

### Durante testing

- Validar **lógica de negocio** y combinaciones de flujos indebidas

### En producción

- Monitorear **accesos anómalos** y **abuso de permisos**

---

## ¿Cómo prevenirlo?

### Principios de diseño seguro

1. **Threat modeling** desde el inicio y de forma continua
2. **Incluir seguridad en los requisitos** (no como "extra")
3. **Mínimo privilegio:** dar solo los permisos necesarios
4. **Denegar por defecto:** todo prohibido excepto lo explícitamente permitido
5. **Trazabilidad y auditoría** desde el diseño

### Prácticas concretas

- **Historias de usuario** con criterios de seguridad
    - *Ejemplo:* "Como usuario, quiero compartir documentos **con expiración configurable y revocación**"
- **Definir scopes y límites** para APIs
- **Plan de rotación** de claves y actualización de dependencias
- **Automatizar tests** de lógica de negocio
- **Revisiones de arquitectura** con foco en seguridad

---

## ¿Cómo mitigarlo en producción?

Si ya está desplegado con diseño inseguro:

1. **Evaluar el riesgo** y alcance del problema
2. **Controles temporales:** WAF, rate limiting, listas de control de acceso
3. **Parches rápidos** en validación o autorización
4. **Revocar permisos excesivos** y rotar secretos comprometidos
5. **Invalidar recursos inseguros** (enlaces, tokens antiguos)
6. **Planificar rediseño progresivo** (no todo a la vez)
7. **Monitorear** comportamiento tras cambios

**Clave:** Contener el impacto mientras trabajas en el rediseño correcto.

---

## Para equipos pequeños

No necesitas procesos complejos. Pequeñas acciones marcan la diferencia:

- **Mini threat modeling** de 15-30 minutos por funcionalidad
- **Checklists simples** en la "Definition of Done"
- **Tests que validen** reglas de negocio críticas
- **Ser "security champion":** compartir patrones seguros en el equipo
- **Documentar decisiones** sobre permisos y scopes
- **Aplicar expiraciones** y logging básico

---

## Checklist práctico

Antes de lanzar una funcionalidad, pregúntate:

1. ☑ ¿Hicimos threat modeling (aunque sea mini)?
2. ☑ ¿Roles y permisos tienen granularidad suficiente?
3. ☑ ¿Hay límites de acceso (rate limit, paginación)?
4. ☑ ¿Los recursos compartidos expiran o se pueden revocar?
5. ☑ ¿Integraciones externas con scopes mínimos?
6. ☑ ¿Hay logs en funciones críticas?
7. ☑ ¿Plan de rotación de claves y dependencias?
8. ☑ ¿Tests que validen seguridad del negocio?
9. ☑ ¿Plan B si falla una suposición de diseño?

---

## Conclusiones clave

1. **Insecure Design no se arregla con parches**, se previene pensando críticamente desde el inicio
2. **Como desarrollador junior:** Tu rol es cuestionar, proponer y validar seguridad desde el diseño
3. **Pequeñas decisiones evitan grandes incidentes:** Una expiración automática o un test de permisos pueden prevenir brechas masivas

**Diseñar con seguridad = pensar a largo plazo:** Crear software que resista el cambio y el abuso.