# Broken Access Control

### ¿Qué es Broken Access Control?

Broken Access Control ocurre cuando una aplicación **no controla correctamente quién puede hacer qué sobre un recurso**.

Esto permite que un usuario acceda, modifique o ejecute acciones **para las que no tiene permiso**.

Es una de las **vulnerabilidades más frecuentes y críticas** en aplicaciones web.

---

### ¿Por qué ocurre?

No suele ser un solo error puntual, sino un **problema de diseño o implementación** del sistema de permisos.

Las causas más comunes son:

- No validar permisos en el **servidor**.
- Confiar en datos enviados desde el **cliente**.
- Reglas de acceso distintas entre endpoints.
- Roles demasiado amplios o mal definidos.
- Manejo inseguro de sesiones.

📌 **Importante:** Autenticación (login) **no es lo mismo** que autorización (permisos).

---

### Ejemplos típicos

Algunos escenarios muy comunes son:

- **IDOR:** acceder a datos de otro usuario cambiando un ID en la URL.
- **Rutas administrativas sin protección:** endpoints accesibles sin validar rol.
- **Escalada de privilegios:** un usuario obtiene permisos de administrador.
- **Solo se valida el login:** el sistema no revisa si el usuario tiene permiso real.
- **Confianza en parámetros del cliente:** por ejemplo, usar `isAdmin=true`.

---

### ¿Qué puede lograr un atacante?

Si alguien explota Broken Access Control, puede:

- Ver datos privados de otros usuarios.
- Modificar información sin autorización.
- Convertirse en administrador.
- Ejecutar acciones críticas del sistema.
- Comprometer **confidencialidad, integridad y disponibilidad**.

---

### ¿Cómo detectarlo?

### Durante el desarrollo

- Revisar código buscando recursos sin control de permisos.
- Crear pruebas que validen accesos según el tipo de usuario.
- Usar escáneres automáticos y threat modeling.

### En producción

- Analizar logs y accesos sospechosos.
- Configurar alertas por uso anómalo.
- Realizar pentests y auditorías periódicas.

---

### ¿Cómo prevenirlo?

### Principios clave

- **Mínimo privilegio:** solo los permisos necesarios.
- **Denegar por defecto:** permitir solo lo explícito.
- **Autorización centralizada:** no repartir la lógica por toda la app.

### Buenas prácticas

- Validar siempre en el servidor.
- No confiar en datos del cliente.
- Definir bien roles y permisos (RBAC o ABAC).
- Verificar tokens y sesiones.
- Separar endpoints administrativos.

---

### ¿Qué hacer si ya está en producción?

Cuando la falla ya existe:

- Bloquear temporalmente el endpoint afectado.
- Revisar logs para medir el impacto.
- Rotar credenciales si hubo exposición.
- Aplicar parches y pruebas de regresión.
- Auditar y comunicar según políticas internas.

---

### ✅ Checklist rápido para desarrolladores

Antes de desplegar, revisa:

1. ¿Validas autenticación y autorización en el servidor?
2. ¿Aplicas mínimo privilegio?
3. ¿Evitas usar parámetros del cliente para permisos?
4. ¿Tienes tests para accesos no autorizados?
5. ¿Registras quién accede a qué?
6. ¿Revisas rutas y endpoints expuestos?

---

### Conclusiones

- Broken Access Control es **muy común**, pero **evitable**.
- Buenas prácticas y validaciones previenen incidentes graves.
- La seguridad de acceso es responsabilidad directa del desarrollador.

---