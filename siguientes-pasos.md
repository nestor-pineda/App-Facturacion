# Siguientes Pasos — App Facturación

> Estado actual: Fases 0-6 implementadas. TypeScript sin errores. Build de producción funcional.

---

## 1. i18n (Internacionalización es/en)

**Dependencias a instalar:**
```bash
cd frontend
npm install react-i18next i18next i18next-browser-languagedetector
```

**Archivos a crear:**
- `src/i18n.ts` — configuración de react-i18next con fallback a `es`
- `public/locales/es/common.json` — traducciones en español
- `public/locales/en/common.json` — traducciones en inglés
- `src/store/localeStore.ts` — Zustand store para persistir el idioma seleccionado
- `src/store/themeStore.ts` — Zustand store con toggle dark/light y persistencia

**Cambios en componentes existentes:**
- Reemplazar todos los textos hardcoded por `t('key')` usando el hook `useTranslation`
- Añadir selector de idioma (es/en) en el header o en la página de Settings
- Añadir toggle de tema oscuro/claro en el header

---

## 2. Testing — Unitarios e Integración

**Dependencias a instalar:**
```bash
cd frontend
npm install -D msw @testing-library/user-event
```

**Configurar MSW:**
- `src/test/mocks/handlers.ts` — handlers para todos los endpoints (auth, clients, services, quotes, invoices)
- `src/test/mocks/server.ts` — servidor MSW para tests

**Tests unitarios prioritarios (Vitest + RTL):**
- `lib/calculations.ts` — cálculos de subtotal, IVA, total y `formatCurrency`
- Schemas Zod — validaciones de inputs correctos e incorrectos
- `authStore` — las acciones `login`/`logout` actualizan el estado correctamente
- `StatusBadge` — renderiza el label y el estilo correcto para cada estado del dominio

**Tests de componentes:**
- `ClientForm`, `ServiceForm`, `InvoiceForm`, `QuoteForm` — validación y submit
- Listados (`Clients`, `Services`, `Invoices`, `Quotes`) con estados loading / empty / error
- `ProtectedRoute` — redirige a `/login` cuando no hay sesión activa

**Tests de integración:**
- Flujo completo: login → dashboard → crear factura → enviar → descargar PDF
- Flujo: crear presupuesto → convertir a factura

---

## 3. E2E Testing (Playwright)

**Instalación:**
```bash
cd frontend
npm install -D @playwright/test
npx playwright install
```

**Crear archivo `playwright.config.ts`** en la raíz del frontend.

**Tests de flujos principales a cubrir:**
- `tests/e2e/auth.spec.ts` — register, login, logout, redirect si no autenticado
- `tests/e2e/invoices.spec.ts` — crear, enviar, verificar número correlativo, descargar PDF, verificar inmutabilidad
- `tests/e2e/quotes.spec.ts` — crear, enviar, convertir a factura

---

## 4. Refactorización a estructura `features/`

Una vez el MVP funcione end-to-end y esté cubierto por tests, migrar a la arquitectura de carpetas definida en `.cursor/rules/frontend.md`:

```
src/features/
├── auth/       (components, hooks, pages)
├── clients/    (components, hooks, pages)
├── services/   (components, hooks, pages)
├── quotes/     (components, hooks, pages)
├── invoices/   (components, hooks, pages)
└── dashboard/  (pages)
```

**Beneficio:** Mejor organización para escalar. Los tests que ya existen protegerán de regresiones durante el refactor.

---

## 5. Polish de UX

- **Loading skeletons** en todas las tablas y listados (en lugar del spinner centrado actual)
- **Empty states** con mensaje claro cuando no hay datos (actualmente solo texto simple)
- **Validación inline** en formularios — mostrar errores en tiempo real mientras el usuario tipea (modo `onBlur` o `onChange` en React Hook Form)
- **Responsive mobile** en páginas nuevas: `QuoteCreate`, `QuoteDetail`, `InvoiceCreate`, `InvoiceDetail` (revisar formularios de líneas en pantallas pequeñas)
- **Edición de presupuesto/factura en borrador** desde la página de detalle (actualmente solo se puede crear)

---

## 6. Verificación de integración con el backend

**Antes de arrancar:**
1. Verificar que el backend tiene `http://localhost:8080` en `ALLOWED_ORIGINS`:
   ```env
   # backend/.env
   ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173
   ```
2. Arrancar backend en puerto 3000 y frontend en puerto 8080:
   ```bash
   # Terminal 1
   cd backend && npm run dev

   # Terminal 2
   cd frontend && npm run dev
   ```

**Flujo completo a probar manualmente:**
1. Registrar cuenta nueva en `/register`
2. Iniciar sesión en `/login` → redirige al dashboard
3. Crear un cliente en `/clients`
4. Crear un servicio en `/services`
5. Crear presupuesto en `/quotes/new` con líneas del catálogo → verificar cálculos
6. Enviar presupuesto → verificar que se vuelve inmutable
7. Convertir presupuesto a factura → verificar que aparece en `/invoices`
8. Enviar factura → verificar que se genera número `YYYY/NNN`
9. Descargar PDF de la factura enviada
10. Cerrar sesión → verificar redirect a `/login`

**También verificar:**
- Que el refresh automático de token funciona (el `accessToken` expira en 1h por defecto)
- Que las rutas protegidas redirigen a `/login` si se accede sin sesión

---

## 7. Preparación para producción

**Build check:**
```bash
cd frontend
npm run build        # debe completar sin errores
npx tsc --noEmit     # debe pasar sin errores de tipo
npm run lint         # resolver warnings de ESLint
```

**Variables de entorno de producción:**
- Configurar `VITE_API_URL` con la URL real del backend en Vercel (o plataforma elegida)
- Configurar `ALLOWED_ORIGINS` en el backend con el dominio de producción del frontend

**Tareas finales antes de deploy:**
- Limpiar cualquier `console.log` que haya quedado en el código
- Considerar code-splitting con `React.lazy()` para reducir el bundle (actualmente 608 KB)
- Configurar `Content-Security-Policy` y otras cabeceras de seguridad en el servidor

**Deploy recomendado (según design doc 003):**
- Frontend → [Vercel](https://vercel.com) (gratuito, deploy automático desde Git)
- Backend → [Render](https://render.com) (750h/mes gratuitas)
- Base de datos → [Neon PostgreSQL](https://neon.tech) (500 MB gratuitos)
