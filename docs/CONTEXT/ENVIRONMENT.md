# Variables de Entorno

Este documento define las variables de entorno necesarias para el funcionamiento del sistema. El agente de Cursor debe seguir estos nombres y reglas de acceso estrictamente.

## 🛠️ Obligatorias (Todos los entornos)

| Variable | Descripción | Ejemplo / Formato |
| :--- | :--- | :--- |
| `DATABASE_URL` | String de conexión para PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Secreto para firmar Access Tokens | ≥32 caracteres; **distinto** de `JWT_REFRESH_SECRET` y de `SEND_CONFIRMATION_SECRET` |
| `JWT_REFRESH_SECRET` | Secreto para firmar Refresh Tokens | ≥32 caracteres; **distinto** de `JWT_SECRET` y de `SEND_CONFIRMATION_SECRET` |
| `SEND_CONFIRMATION_SECRET` | Secreto para firmar JWT de confirmación de envío (factura/presupuesto) | ≥32 caracteres; **independiente** de los dos JWT (no reutilizar `JWT_SECRET`) |
| `PORT` | Puerto donde corre el servidor Express | `3000` |
| `NODE_ENV` | Entorno de ejecución | `development` \| `production` \| `test` |

## ⚙️ Configuración de Tokens

| Variable | Descripción | Valor sugerido |
| :--- | :--- | :--- |
| `JWT_EXPIRES_IN` | Tiempo de vida del Access Token | `1h` |
| `JWT_REFRESH_EXPIRES_IN` | Tiempo de vida del Refresh Token | `7d` |

## 🌐 Seguridad y CORS

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `ALLOWED_ORIGINS` | Dominios permitidos para peticiones CORS (lista separada por comas) | `http://localhost:5173,https://app.example.com` |
| `FRONTEND_URL` | Origen principal del frontend (usado para el header `Access-Control-Allow-Origin` con `credentials: true`) | `http://localhost:5173` |

> **Nota:** `FRONTEND_URL` es obligatorio para que las httpOnly cookies funcionen correctamente. CORS con `credentials: true` requiere un origen único y exacto, no un wildcard.

## 📧 Email / SMTP (Opcional)

Estas variables son **opcionales**. Si no se definen, el sistema omite el envío de emails silenciosamente (sin error). El resto de la funcionalidad no se ve afectada.

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `SMTP_HOST` | Servidor SMTP | `sandbox.smtp.mailtrap.io` |
| `SMTP_PORT` | Puerto SMTP | `2525` (Mailtrap) / `587` (TLS) |
| `SMTP_USER` | Usuario SMTP | proporcionado por tu proveedor |
| `SMTP_PASS` | Contraseña SMTP | proporcionada por tu proveedor |
| `SMTP_FROM` | Dirección de envío (remitente) | `"Mi Empresa <noreply@empresa.com>"` |

**Para desarrollo local** se recomienda [Mailtrap](https://mailtrap.io) (sandbox gratuito que captura emails sin enviarlos realmente):

```
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<tu-user-de-mailtrap>
SMTP_PASS=<tu-pass-de-mailtrap>
SMTP_FROM="Facturación <noreply@facturacion.app>"
```

La variable acepta uno o varios orígenes separados por coma. En desarrollo se suele poner solo el origen del frontend local. En producción se añade el dominio real de la aplicación.

```
# Desarrollo
ALLOWED_ORIGINS=http://localhost:5173

# Producción (varios orígenes)
ALLOWED_ORIGINS=https://app.example.com,https://www.example.com
```

## 🚀 Acceso en el Código

Para asegurar el tipado y evitar errores en tiempo de ejecución, se aplican las siguientes reglas:

1. **Abstracción Centralizada**: Nunca uses `process.env` directamente en controladores o servicios.
2. **Punto de Acceso**: Importa siempre la configuración desde `src/config/env.ts` (donde las variables deben estar validadas con **Zod**).
3. **Validación**: Si falta una variable obligatoria al iniciar el servidor, la aplicación debe lanzar un error inmediato y no arrancar.

## 📄 Archivos locales

- `.env`: Archivo local para desarrollo (no subir al repositorio).
- `.env.example`: Plantilla con valores ficticios para nuevos desarrolladores.