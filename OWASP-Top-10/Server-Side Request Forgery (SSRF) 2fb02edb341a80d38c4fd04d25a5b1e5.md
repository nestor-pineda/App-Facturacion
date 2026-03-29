# Server-Side Request Forgery (SSRF)

El SSRF es una vulnerabilidad de seguridad que ocurre cuando un atacante logra que el servidor realice solicitudes HTTP (u otros protocolos) en su nombre. Básicamente, el servidor se convierte en un **proxy involuntario** o un "portero confiado" que accede a lugares restringidos a los que el atacante no tiene acceso directo desde Internet.

### 1. ¿Qué es exactamente el SSRF?

Es la **falsificación de solicitudes del lado del servidor**. El atacante utiliza al servidor como intermediario para atacar o extraer información de otros sistemas internos o externos.

- **¿Dónde ocurre?** Es común en funciones que aceptan URLs, como:
    - Carga de imágenes desde un enlace externo.
    - Verificadores de enlaces.
    - Integraciones con APIs de terceros.

> Ejemplo Conceptual:* Uso normal: Una app pide https://app.com/fetch?url=https://web.com/foto.jpg para mostrar una imagen.
* Uso malicioso: El atacante cambia la URL a https://app.com/fetch?url=http://127.0.0.1:8080/admin.
* Resultado: El servidor accede a su propio panel de administración (interno) y le devuelve la información sensible al atacante.
> 

---

### 2. ¿Por qué ocurre esta vulnerabilidad?

El problema principal es un **error de diseño** donde no se previó que las funciones de red podrían ser abusadas. Las causas técnicas incluyen:

- Falta de validación o filtrado de las URLs que introduce el usuario.
- Servidores que no tienen restricciones para acceder a direcciones locales o privadas (como `localhost`, `10.x.x.x` o `192.168.x.x`).
- Permitir protocolos peligrosos más allá de HTTP/HTTPS, como `file://` (para leer archivos del servidor) o `ftp://`.
- Frameworks que siguen automáticamente redirecciones sin validar el destino final.

---

### 3. ¿Qué peligros representa?

Un atacante con SSRF puede causar un impacto muy alto mediante el **movimiento lateral** dentro de una red:

- **Acceso a redes internas:** Descubrir y atacar bases de datos o paneles privados que no están expuestos a Internet.
- **Robo de metadatos en la nube:** En servicios como AWS, un atacante puede consultar la IP interna `http://169.254.169.254` para obtener credenciales de seguridad del servidor.
- **Escaneo de puertos:** Identificar qué servicios están corriendo dentro de la infraestructura de la empresa.
- **Encadenar ataques:** Puede ser el primer paso para lograr una ejecución remota de código (RCE) o el control total del sistema.

---

### 4. Estrategias de Detección

Para encontrar fallos de SSRF se deben monitorizar las funciones sospechosas y el tráfico:

- **Identificar funciones de riesgo:** Cualquier parte de la app que haga previsualizaciones, webhooks o carga de recursos externos.
- **Pruebas con direcciones internas:** Intentar cargar recursos de `127.0.0.1` o IPs de metadatos de la nube.
- **Análisis de tiempos:** Si el servidor tarda más de lo normal en responder a una solicitud interna, puede indicar que está intentando conectar con un servicio protegido.
- **Monitoreo de tráfico saliente:** Observar si el servidor contacta con destinos inesperados o internos.
- **Herramientas especializadas:** Usar utilidades como **Burp Collaborator** para detectar llamadas externas realizadas por el servidor.

---

### 5. Cómo Prevenir y Mitigar

La prevención debe basarse en el **Security by Design** (seguridad desde el diseño):

- **Listas blancas (Whitelists):** Permitir únicamente dominios o rutas de confianza conocidos.
- **Bloqueo de IPs privadas:** Rechazar cualquier solicitud dirigida a rangos locales o privados (10.x.x.x, 169.254.x.x, etc.).
- **Restricción de protocolos:** Deshabilitar protocolos innecesarios y limitar la app solo a HTTP/HTTPS.
- **Firewalls de salida:** Configurar políticas de red que limiten estrictamente a qué lugares puede conectarse el servidor.
- **Sandboxing:** Aislar los procesos que realizan solicitudes externas para que no tengan acceso a la red interna.
- **Desactivar redirecciones:** Evitar que las librerías de red sigan redirecciones automáticas de forma ilimitada.

---

### 💡 Conclusión

El SSRF demuestra que **no se debe confiar en la entrada del usuario** ni asumir que el servidor siempre actuará de forma segura. La seguridad efectiva consiste en anticipar escenarios de abuso antes de que ocurran, limitando los permisos de red del servidor al mínimo necesario.