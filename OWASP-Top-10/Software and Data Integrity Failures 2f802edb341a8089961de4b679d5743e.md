# Software and Data Integrity Failures

Aquí tienes los apuntes completos y detallados, integrando todos los puntos clave del documento para que tengas una visión global y profunda del tema.

---

# 🛡️ Guía Completa: Software and Data Integrity Failures

Este fallo de seguridad ocurre cuando un sistema confía en software, datos o integraciones sin verificar previamente su integridad. En esencia, es el riesgo de que el "enemigo" entre por tu propia puerta al utilizar componentes de terceros comprometidos.

## 1. Conceptos Fundamentales

- **Integridad de Software:** Se basa en verificar que cualquier componente que se instale o ejecute no haya sido modificado maliciosamente.
- **Integridad de Datos:** Consiste en asegurar que la información no sea alterada mientras se transmite o cuando está almacenada.
- **El Problema:** El fallo aparece por un exceso de confianza en dependencias externas, actualizaciones o procesos de fabricación (pipelines).

---

## 2. Escenarios Comunes de Riesgo

- **Dependencias sin verificar:** Instalar paquetes desde repositorios públicos (npm, PyPI, Maven) sin validar quién es el autor o el origen.
- **Actualizaciones automáticas:** Descargas que no utilizan firmas digitales, lo que permite a un atacante suplantar el servidor de actualización.
- **Pipelines de CI/CD inseguros:** Usar imágenes de contenedores o scripts de internet sin comprobar su "hash" (huella digital), permitiendo que se cuele código malicioso en la creación del software.
- **Manipulación de configuración:** Alterar archivos JSON o YAML externos para cambiar permisos o claves de acceso.

---

## 3. Consecuencias de un Ataque

Si un atacante explota estas debilidades, puede lograr lo siguiente:

- **Ejecución remota de código (RCE):** Tomar el control del sistema a través de una librería infectada.
- **Ataques a la cadena de suministro:** Infectar un software legítimo para distribuir malware de forma masiva (como ocurrió con SolarWinds).
- **Persistencia oculta:** Mantener código dañino camuflado dentro de procesos que parecen normales para que no sea detectado.

---

## 4. Estrategias de Detección

Para identificar estas vulnerabilidades, es necesario auditar activamente el flujo de trabajo:

- **Revisión de Pipelines:** Identificar manualmente cualquier script o descarga que se realice desde Internet sin una validación de origen clara.
- **Uso de Lockfiles:** Emplear archivos de bloqueo para fijar las versiones de las dependencias y monitorizar cambios sospechosos en los hashes.
- **Escaneo Automatizado:** Implementar herramientas como **Trivy, Snyk o Anchore** dentro del proceso de CI/CD para analizar cada build.
- **Monitoreo de Archivos Críticos:** Usar sistemas como **Tripwire o AIDE** para detectar cualquier modificación no autorizada en el sistema de archivos.
- **Auditoría de Infraestructura:** Validar que todos los scripts de configuración provengan de repositorios firmados y confiables.

---

## 5. Medidas de Prevención

Para prevenir estos fallos, se deben establecer controles técnicos rigurosos:

- **Firmas Digitales:** Utilizar firmas para verificar la autenticidad de cualquier software, actualización o dato antes de procesarlo.
- **Control Estricto de Dependencias:** No confiar en repositorios públicos de forma directa; gestionar y validar cada librería que entra en el proyecto.
- **Seguridad en el Pipeline:** Asegurar que todo el proceso de integración continua esté protegido contra inyecciones de código externo.
- **Protección de Datos:** Implementar controles para garantizar que los datos y backups no han sido alterados (por ejemplo, mediante sumas de verificación).
- **Contenedores Seguros:** Utilizar solo imágenes de contenedores verificadas y con permisos de acceso restringidos.

---

## 💡 Conclusión Final

No basta con escribir código seguro; es necesario asegurar toda la **cadena de confianza**. Cada herramienta o script externo que añades aumenta tu superficie de riesgo. La responsabilidad del desarrollador no termina al programar, sino al decidir en qué componentes decide confiar.

---

### ✅ Checklist de Integridad de Software y Datos

### 1. Gestión de Dependencias y Terceros

- [ ]  **Validación de Origen:** ¿Se ha verificado que todas las librerías provienen de repositorios oficiales y autores legítimos?
- [ ]  **Uso de Lockfiles:** ¿Se están utilizando archivos de bloqueo (como `package-lock.json` o `requirements.txt` con hashes) para fijar versiones exactas?
- [ ]  **Escaneo de Vulnerabilidades:** ¿Se pasan herramientas como Snyk o Trivy regularmente para detectar componentes comprometidos?

### 2. Seguridad en el Ciclo de Vida (CI/CD)

- [ ]  **Firmas Digitales:** ¿Se verifica la firma digital de cada actualización o ejecutable antes de instalarlo?
- [ ]  **Verificación de Imágenes:** ¿Se comprueban los hashes de las imágenes de contenedores y scripts descargados de internet?
- [ ]  **Repositorios Confiables:** ¿Los scripts de infraestructura provienen únicamente de repositorios internos o firmados?

### 3. Integridad de Datos y Configuración

- [ ]  **Protección en Tránsito/Almacenamiento:** ¿Existen mecanismos (como checksums) para asegurar que los datos no se alteran al moverse?
- [ ]  **Control de Archivos Críticos:** ¿Se han implementado herramientas de monitoreo (tipo Tripwire) en archivos de configuración sensibles?
- [ ]  **Verificación de Backups:** ¿Se valida la integridad de las copias de seguridad antes de realizar cualquier restauración?

### 4. Control de Acceso y Auditoría

- [ ]  **Privilegios Mínimos:** ¿Está restringido el acceso para modificar archivos de configuración JSON/YAML o scripts de build?
- [ ]  **Revisión de Pipelines:** ¿Se auditan periódicamente los procesos automáticos en busca de pasos que descarguen contenido sin validar?

Esta lista te ayudará a responder la pregunta clave antes de cualquier despliegue: **"¿Estoy verificando la fuente o simplemente confiando?"**.