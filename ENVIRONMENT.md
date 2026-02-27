# Variables de Entorno

Este documento define las variables de entorno necesarias para el funcionamiento del sistema. El agente de Cursor debe seguir estos nombres y reglas de acceso estrictamente.

## 🛠️ Obligatorias (Todos los entornos)

| Variable | Descripción | Ejemplo / Formato |
| :--- | :--- | :--- |
| `DATABASE_URL` | String de conexión para PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Secreto para firmar Access Tokens | Mínimo 32 caracteres aleatorios |
| `JWT_REFRESH_SECRET` | Secreto para firmar Refresh Tokens | Mínimo 32 caracteres aleatorios |
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
| `ALLOWED_ORIGINS` | Dominios permitidos para peticiones CORS | `http://localhost:5173` |

## 🚀 Acceso en el Código

Para asegurar el tipado y evitar errores en tiempo de ejecución, se aplican las siguientes reglas:

1. **Abstracción Centralizada**: Nunca uses `process.env` directamente en controladores o servicios.
2. **Punto de Acceso**: Importa siempre la configuración desde `src/config/env.ts` (donde las variables deben estar validadas con **Zod**).
3. **Validación**: Si falta una variable obligatoria al iniciar el servidor, la aplicación debe lanzar un error inmediato y no arrancar.

## 📄 Archivos locales

- `.env`: Archivo local para desarrollo (no subir al repositorio).
- `.env.example`: Plantilla con valores ficticios para nuevos desarrolladores.