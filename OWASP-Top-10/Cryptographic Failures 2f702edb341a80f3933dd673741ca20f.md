# Cryptographic Failures

### ¿Qué es Cryptographic Failures?

Las fallas criptográficas ocurren cuando una aplicación **usa mal la criptografía** o la configura de forma incorrecta.

No se trata solo de cifrar datos, sino de **cifrarlos correctamente** y gestionar bien las claves.

Estas fallas afectan directamente a:

- **Confidencialidad** (datos secretos)
- **Integridad** (datos no alterados)
- **Autenticidad** (origen confiable de los datos)

---

### ¿En qué consisten las fallas criptográficas?

Algunos errores comunes son:

- Uso de **algoritmos obsoletos** como MD5, SHA-1, DES o RC4.
- Cifrado sin verificación de integridad o autenticidad.
- Claves secretas incrustadas en el código.
- Contraseñas con hash débil o sin *salt*.
- Comunicaciones sin TLS o con certificados inválidos.
- Dependencias o archivos sin verificación de integridad.
- Secretos guardados en lugares inseguros.

---

### Ejemplos típicos (con explicación)

🔴 **Ejemplo 1: Contraseñas mal protegidas**

Guardar contraseñas en texto plano o usando MD5.

👉 Si alguien accede a la base de datos, obtiene todas las contraseñas.

🟢 **Forma correcta:**

Usar hashing seguro como **bcrypt o Argon2**, con *salt* único por usuario.

---

🔴 **Ejemplo 2: Claves en el código**

Una API key escrita directamente en el repositorio:

```
API_KEY="123456"

```

👉 Si el repositorio es público o se filtra, la clave queda expuesta.

🟢 **Forma correcta:**

Guardar secretos en un **gestor seguro (Vault, KMS)** y rotarlos periódicamente.

---

🔴 **Ejemplo 3: Sin TLS**

Enviar datos sensibles por HTTP.

👉 Un atacante puede interceptar la información (*Man-in-the-Middle*).

🟢 **Forma correcta:**

Forzar **TLS 1.2 o superior** y validar certificados.

---

### ¿Qué puede hacer un atacante?

Si explota fallas criptográficas, puede:

- Robar credenciales y acceder a cuentas.
- Exponer datos personales o financieros.
- Modificar información sin que se detecte.
- Interceptar comunicaciones.
- Comprometer sistemas y pipelines de despliegue.

---

### ¿Cómo detectarlas?

### Durante el desarrollo

- Buscar algoritmos antiguos y claves expuestas.
- Revisar configuraciones criptográficas.
- Usar herramientas SAST y escáneres de repositorios.
- Verificar que TLS sea obligatorio.

### En producción

- Monitorear errores criptográficos.
- Revisar certificados vencidos.
- Auditar accesos a gestores de claves.

---

### ¿Cómo prevenirlas?

### Principios básicos

- No inventar criptografía propia.
- Cifrar datos **en tránsito y en reposo**.
- Aplicar **mínimo privilegio** a las claves.
- Bloquear accesos si la validación falla.

### Buenas prácticas

- Hash seguro con *salt* (Argon2, bcrypt, PBKDF2).
- Cifrado autenticado (AES-GCM, ChaCha20-Poly1305).
- TLS 1.2 o 1.3 correctamente configurado.
- Claves en gestores seguros y con rotación.
- Firmar y verificar artefactos.
- Mantener librerías actualizadas.

---

### ¿Qué hacer si ya está en producción?

- Identificar qué datos se vieron afectados.
- Rotar claves y secretos de inmediato.
- Invalidar tokens y sesiones.
- Aplicar parches y actualizar dependencias.
- Auditar accesos y documentar el incidente.
- Añadir controles extra como MFA.

---

### ✅ Checklist rápido

Antes de desplegar, revisa:

1. ¿Uso algoritmos seguros y actuales?
2. ¿No hay claves ni contraseñas en el código?
3. ¿TLS está activo y bien configurado?
4. ¿El cifrado valida integridad y autenticidad?
5. ¿Las contraseñas usan hashing fuerte con *salt*?
6. ¿Los artefactos están firmados?
7. ¿Roto claves y audito accesos periódicamente?

---

### Conclusiones

- Las fallas criptográficas no siempre se ven, pero **causan gran daño**.
- Cifrar no es suficiente: hay que hacerlo bien.
- Eliminar secretos del código y usar TLS es clave.
- Pequeñas mejoras fortalecen todo el sistema.

---