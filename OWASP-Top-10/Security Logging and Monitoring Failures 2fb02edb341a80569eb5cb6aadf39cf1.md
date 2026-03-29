# Security Logging and Monitoring Failures

Esta vulnerabilidad se describe como la **"ceguera de las aplicaciones"**. El problema no es necesariamente que el código tenga un error, sino que el sistema es incapaz de detectar que está siendo atacado. Es el equivalente a tener cámaras de seguridad en un edificio pero mantenerlas apagadas durante un robo.

### 1. ¿Qué son el Logging y el Monitoring?

Para que la seguridad sea efectiva, ambos conceptos deben trabajar juntos:

- **Logging (Registro):** Es el proceso de escribir un historial de eventos relevantes, como intentos de inicio de sesión, cambios de perfil o errores del sistema.
- **Monitoring (Monitoreo):** Es el análisis de esos registros en tiempo real para encontrar comportamientos extraños.
- **La diferencia clave:** Hacer solo *logging* es como escribir un diario y nunca leerlo; hacer solo *monitoring* es intentar adivinar qué pasa sin tener evidencias.

---

### 2. ¿Por qué fallan las empresas en esto?

Normalmente, el registro de eventos se ve solo como una herramienta para programadores (debugging) y no como una pieza de seguridad. Los errores más comunes son:

- No definir qué eventos son realmente críticos para la seguridad.
- Guardar los registros solo de forma local (en el mismo servidor), sin copias de seguridad ni revisiones.
- No tener alertas automáticas que avisen cuando algo va mal.

---

### 3. Ejemplos de fallos reales

- **Ataques de fuerza bruta invisibles:** Una API que no registra intentos fallidos de contraseña permite que un atacante pruebe miles de combinaciones sin que nadie se dé cuenta.
- **Registros sin utilidad:** Logs que solo dicen "Error 500" sin explicar qué usuario lo causó o desde qué dirección IP.
- **Logs manipulables:** Guardar los registros en archivos de texto simple que un atacante puede borrar o editar para ocultar sus huellas.

---

### 4. ¿Cómo detectar estos fallos?

Para saber si tu sistema es "ciego", puedes realizar las siguientes acciones:

- **Auditoría de registros:** Revisar si los eventos actuales tienen suficiente detalle y cuánto tiempo se guardan.
- **Uso de herramientas SIEM:** Utilizar software especializado (como Wazuh, Splunk o ELK) que centraliza y conecta los eventos de diferentes servidores.
- **Pruebas de ataque (Pentesting):** Realizar un ataque simulado y comprobar si los registros detectaron la intrusión.
- **Simulación de incidentes:** Medir cuánto tiempo tarda el equipo en recibir una alerta desde que ocurre un problema.

---

### 5. ¿Cómo fortalecer la seguridad? (Prevención)

- **Diseño desde el inicio:** Decidir qué eventos son críticos (logins, cambios de roles, errores en APIs sensibles) antes de lanzar la aplicación.
- **Contexto completo:** Cada registro debe incluir siempre el **usuario**, la **hora**, la **IP**, la **acción** realizada y el **resultado**.
- **Protección y Cifrado:** Centralizar los logs en servidores seguros y protegerlos con firmas digitales o "hashes" para que no puedan ser alterados.
- **Alertas en tiempo real:** Configurar avisos automáticos ante patrones sospechosos, como accesos fuera de horario o múltiples fallos de login seguidos.

---

### 💡 Conclusión clave

No puedes proteger lo que no ves. Un buen sistema de registro puede descubrir un ataque antes de que cause un daño real. La pregunta que todo equipo debe hacerse es: **"¿Podría detectar si alguien está abusando de este sistema ahora mismo?"**.

¿Te gustaría que te preparara también una checklist para este tema o prefieres profundizar en alguna herramienta SIEM mencionada?