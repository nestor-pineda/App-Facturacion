# Frontend Architecture - Sistema de Facturación MVP

**Proyecto:** Sistema de facturación para autónomos  
**Stack:** React 18 + TypeScript + Vite  
**Fecha:** Marzo 2026

---

## 🎯 Stack Tecnológico

### Core
- **React:** 18.x (biblioteca UI)
- **TypeScript:** 5.x (type safety)
- **Vite:** 5.x (build tool, dev server)

### Estado y Data Fetching
- **TanStack Query v5:** Server state, cache, mutations
- **Zustand:** Global state (auth, theme, locale)
- **React Hook Form:** Formularios performantes
- **Zod:** Validación de schemas (consistente con backend)

### Routing y Navegación
- **React Router v6:** Client-side routing

### Styling
- **TailwindCSS:** Utility-first CSS
- **shadcn/ui:** Componentes accesibles pre-construidos
- **lucide-react:** Iconografía

### UI/UX
- **sonner:** Toast notifications
- **react-i18next:** Internacionalización (es/en)

### Testing
- **Vitest:** Test runner (unit tests)
- **React Testing Library:** Component testing
- **Playwright:** E2E tests
- **MSW (Mock Service Worker):** API mocking

### Utilidades
- **date-fns:** Manejo de fechas
- **clsx / tailwind-merge:** Utilidad CSS classes

---

## 📁 Estructura de Carpetas

> La estructura actual implementada usa un enfoque flat por tipo (`pages/`, `hooks/`, `components/`) en lugar de `features/`. La migración a `features/` está planificada en `siguientes-pasos.md`.

```
frontend/
├── src/
│   ├── locales/              # Traducciones i18n (importadas estáticamente por Vite)
│   │   ├── es/
│   │   │   └── common.json
│   │   └── en/
│   │       └── common.json
│   ├── api/                  # Cliente HTTP y endpoints
│   │   ├── client.ts         # Axios instance + interceptor de refresh token
│   │   └── endpoints/
│   │       ├── auth.ts
│   │       ├── clients.ts
│   │       ├── services.ts
│   │       ├── quotes.ts
│   │       └── invoices.ts
│   ├── components/           # Componentes reutilizables
│   │   ├── ui/               # shadcn/ui components
│   │   ├── forms/
│   │   │   ├── ClientForm.tsx
│   │   │   ├── ServiceForm.tsx
│   │   │   ├── InvoiceForm.tsx
│   │   │   └── QuoteForm.tsx
│   │   ├── common/
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   ├── AppLayout.tsx     # Layout raíz (sidebar + outlet)
│   │   ├── AppSidebar.tsx    # Navegación lateral + logout
│   │   ├── ProtectedRoute.tsx
│   │   ├── PublicRoute.tsx
│   │   └── StatusBadge.tsx   # Badge de estado de documentos (borrador/enviada)
│   ├── hooks/                # Hooks de TanStack Query por dominio
│   │   ├── useClients.ts
│   │   ├── useServices.ts
│   │   ├── useQuotes.ts
│   │   └── useInvoices.ts
│   ├── lib/
│   │   ├── utils.ts          # cn() y utilidades CSS
│   │   ├── constants.ts      # IVA_DEFAULT, QUERY_KEYS, API_ERROR_CODES, estados
│   │   └── calculations.ts   # Cálculos de subtotal, IVA y total; formatCurrency
│   ├── pages/                # Una página por ruta
│   │   ├── Index.tsx         # Dashboard con métricas reales
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Clients.tsx
│   │   ├── Services.tsx
│   │   ├── Quotes.tsx
│   │   ├── QuoteCreate.tsx
│   │   ├── QuoteDetail.tsx
│   │   ├── Invoices.tsx
│   │   ├── InvoiceCreate.tsx
│   │   ├── InvoiceDetail.tsx
│   │   ├── Settings.tsx
│   │   └── NotFound.tsx
│   ├── schemas/              # Schemas Zod para validación de formularios
│   │   ├── auth.schema.ts
│   │   ├── client.schema.ts
│   │   ├── service.schema.ts
│   │   ├── invoice.schema.ts
│   │   └── quote.schema.ts
│   ├── store/
│   │   ├── authStore.ts      # Zustand + persist: user, isAuthenticated
│   │   ├── localeStore.ts    # Zustand + persist: locale ('es' | 'en'), setLocale()
│   │   └── themeStore.ts     # Zustand + persist: theme ('light' | 'dark'), toggleTheme()
│   ├── types/
│   │   ├── entities.ts       # User, Client, Service, Invoice, Quote, *Line
│   │   ├── api.ts            # ApiResponse<T>, ApiError, PaginatedResponse<T>
│   │   └── enums.ts          # EstadoInvoice, EstadoQuote, EstadoDocument
│   ├── i18n.ts               # Configuración de react-i18next + LanguageDetector
│   ├── App.tsx               # Router + QueryClient + ThemeProvider + rutas protegidas/públicas
│   ├── main.tsx              # Importa ./i18n antes de montar la app
│   └── index.css
├── test/                     # Tests unitarios básicos (pendiente expansión)
├── .env.example
├── .env.development          # VITE_API_URL="" (usa proxy Vite → localhost:3000)
├── .env.production           # VITE_API_URL="https://tu-backend.onrender.com"
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts            # Proxy /api → localhost:3000 en desarrollo
├── package.json
└── README.md
```

---

## 🔐 Autenticación y Seguridad

### Almacenamiento de Tokens

**Decisión MVP:** **httpOnly Cookies** (seguridad desde el inicio)

**Ventajas:**
- ✅ Inmune a XSS (JavaScript no puede leer la cookie)
- ✅ El navegador envía automáticamente la cookie en cada request
- ✅ Más seguro que localStorage

**Configuración necesaria en Backend:**

```typescript
// Backend: Configurar CORS y cookies
app.use(cors({
  origin: process.env.FRONTEND_URL, // http://localhost:5173 en dev
  credentials: true, // CRÍTICO: permite enviar cookies
}));

// Backend: Enviar tokens en cookies (en login y refresh)
res.cookie('accessToken', accessToken, {
  httpOnly: true,  // JavaScript no puede leer
  secure: process.env.NODE_ENV === 'production', // Solo HTTPS en prod
  sameSite: 'strict', // Protección CSRF
  maxAge: 60 * 60 * 1000, // 1 hora
});

res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
});
```

**Frontend: Solo guardamos el usuario (no los tokens)**

```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // Solo guarda el user, no tokens
    }
  )
);
```

### Refresh Token Automático

```typescript
// api/client.ts
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CRÍTICO: envía cookies automáticamente
});

// NO necesitamos interceptor request (las cookies se envían automáticamente)

// Interceptor para refresh automático en 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no es el endpoint de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/refresh')) {
        // Si falla el refresh, hacer logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Esperar a que termine el refresh en curso
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Reintentar request original (la nueva cookie ya está)
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Llamar a refresh (el backend leerá refreshToken de cookies)
        await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        // Backend actualiza la cookie accessToken automáticamente
        
        processQueue(null, 'success');
        
        // Reintentar request original
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### Protected Routes

```typescript
// routes/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
```

---

## 🌐 Internacionalización (i18n)

### Configuración

```typescript
// src/i18n.ts — importado en main.tsx ANTES de montar la app
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import esCommon from '@/locales/es/common.json';
import enCommon from '@/locales/en/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { common: esCommon },
      en: { common: enCommon },
    },
    defaultNS: 'common',
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  });

export default i18n;
```

> Los ficheros JSON de traducciones viven en `src/locales/` (no en `public/`). Vite los importa estáticamente — no se usa `i18next-http-backend`.

### Uso en componentes

```typescript
import { useTranslation } from 'react-i18next';

// En componentes React (hook)
const { t } = useTranslation(); // defaultNS: 'common'
t('invoices.title')

// Fuera de React (hooks, stores) — instancia global
import i18next from 'i18next';
i18next.t('toast.invoiceCreated')
```

### Store de idioma

```typescript
// store/localeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';

export const useLocaleStore = create<{ locale: 'es' | 'en'; setLocale: (l: 'es' | 'en') => void }>()(
  persist(
    (set) => ({
      locale: 'es',
      setLocale: (locale) => {
        i18n.changeLanguage(locale);
        set({ locale });
      },
    }),
    {
      name: 'locale-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.locale) i18n.changeLanguage(state.locale);
      },
    },
  ),
);
```

---

## 🎨 Tema Oscuro/Claro

### Configuración TailwindCSS

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Usa class para modo oscuro
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Variables CSS para temas
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        // ... más colores
      },
    },
  },
  plugins: [],
};
```

### Store de tema

```typescript
// store/themeStore.ts — solo estado puro, sin DOM
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

export const useThemeStore = create<{ theme: Theme; toggleTheme: () => void; setTheme: (t: Theme) => void }>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'theme-storage' },
  ),
);
```

La clase `dark` se aplica al `<html>` en `App.tsx` mediante un `ThemeProvider` con `useEffect`, **no** dentro del store. Esto garantiza que el tema cubra todas las rutas (incluyendo Login/Register que están fuera de `AppLayout`):

```tsx
// App.tsx
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return <>{children}</>;
}
```

---

## 📡 Data Fetching con TanStack Query

### Configuración

```typescript
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Custom Hooks Pattern

```typescript
// features/invoices/hooks/useInvoices.ts
import { useQuery } from '@tanstack/react-query';
import { getInvoices } from '@/api/endpoints/invoices';

export const useInvoices = (filters?: InvoiceFilters) => {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => getInvoices(filters),
    select: (data) => data.data, // Extraer solo el array de invoices
  });
};

// features/invoices/hooks/useInvoiceMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInvoice, updateInvoice, deleteInvoice } from '@/api/endpoints/invoices';
import { toast } from 'sonner';

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(i18next.t('toast.invoiceCreated'));       // ← i18next global, no hook
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || i18next.t('toast.invoiceCreateError'));
    },
  });
};
```

> Los hooks de mutación viven fuera del ciclo de render; usar `i18next.t()` (instancia global) en lugar de `useTranslation()` (hook). Las claves de toast están bajo `toast.*` en `common.json`.

### Optimistic Updates

```typescript
export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateInvoice(id, data),
    
    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancelar queries existentes
      await queryClient.cancelQueries({ queryKey: ['invoice', id] });

      // Snapshot del valor anterior
      const previousInvoice = queryClient.getQueryData(['invoice', id]);

      // Actualizar optimistamente
      queryClient.setQueryData(['invoice', id], (old: any) => ({
        ...old,
        ...data,
      }));

      return { previousInvoice };
    },
    
    // Si falla, revertir
    onError: (err, variables, context) => {
      if (context?.previousInvoice) {
        queryClient.setQueryData(['invoice', variables.id], context.previousInvoice);
      }
      toast.error('Error al actualizar factura');
    },
    
    // Siempre refetch para sincronizar
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
    },
  });
};
```

---

## 📋 Formularios con React Hook Form + Zod

### Schema de validación (factory functions para i18n)

Los schemas Zod son **factory functions** que llaman a `i18next.t()` en el momento de la creación, capturando el idioma activo en cada render. Esto garantiza que los mensajes de validación cambien al cambiar de idioma.

```typescript
// schemas/invoice.schema.ts
import { z } from 'zod';
import i18next from 'i18next';

export const createInvoiceSchema = () =>
  z.object({
    clientId: z.string().uuid(i18next.t('validation.clientRequired')),
    fechaEmision: z.string().min(1, i18next.t('validation.dateRequired')),
    lines: z.array(createInvoiceLineSchema()).min(1, i18next.t('validation.atLeastOneLine')),
    notas: z.string().optional(),
  });

// El tipo se infiere del retorno de la factory
export type CreateInvoiceInput = z.infer<ReturnType<typeof createInvoiceSchema>>;
```

> **Nunca** exportes un schema estático (`export const createInvoiceSchema = z.object(...)`) si contiene mensajes de error. Usa siempre `() => z.object(...)`.

### Uso en formulario

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createInvoiceSchema, type CreateInvoiceInput } from '@/schemas/invoice.schema';

export const InvoiceForm = ({ onSubmit }: { onSubmit: (data: CreateInvoiceInput) => void }) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema()), // ← llamar la factory en cada render
    defaultValues: {
      lines: [
        {
          serviceId: null,
          descripcion: '',
          cantidad: 1,
          precioUnitario: 0,
          ivaPorcentaje: 21,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Cliente</label>
        <select {...register('clientId')}>
          {/* Opciones */}
        </select>
        {errors.clientId && <span>{errors.clientId.message}</span>}
      </div>

      <div>
        <label>Fecha</label>
        <input type="date" {...register('fecha')} />
        {errors.fecha && <span>{errors.fecha.message}</span>}
      </div>

      <div>
        <h3>Líneas de Factura</h3>
        {fields.map((field, index) => (
          <div key={field.id}>
            <input
              {...register(`lines.${index}.descripcion`)}
              placeholder="Descripción"
            />
            <input
              type="number"
              {...register(`lines.${index}.cantidad`, { valueAsNumber: true })}
              placeholder="Cantidad"
            />
            <input
              type="number"
              {...register(`lines.${index}.precioUnitario`, { valueAsNumber: true })}
              placeholder="Precio"
            />
            <button type="button" onClick={() => remove(index)}>
              Eliminar
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            append({
              serviceId: null,
              descripcion: '',
              cantidad: 1,
              precioUnitario: 0,
              ivaPorcentaje: 21,
            })
          }
        >
          Agregar línea
        </button>
      </div>

      <button type="submit">Crear Factura</button>
    </form>
  );
};
```

---

## 🧮 Cálculos de Totales

```typescript
// lib/calculations.ts
export interface InvoiceLine {
  cantidad: number;
  precioUnitario: number;
  ivaPorcentaje: number;
}

export const calculateLineSubtotal = (line: InvoiceLine): number => {
  return line.cantidad * line.precioUnitario;
};

export const calculateLineIVA = (line: InvoiceLine): number => {
  const subtotal = calculateLineSubtotal(line);
  return subtotal * (line.ivaPorcentaje / 100);
};

export const calculateInvoiceTotals = (lines: InvoiceLine[]) => {
  const subtotal = lines.reduce((acc, line) => acc + calculateLineSubtotal(line), 0);
  const totalIva = lines.reduce((acc, line) => acc + calculateLineIVA(line), 0);
  const total = subtotal + totalIva;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    totalIva: Number(totalIva.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
};

// Formatear moneda
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};
```

---

## 🔔 Sistema de Notificaciones (Toasts)

### Configuración

```typescript
// main.tsx o App.tsx
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      {/* Resto de la app */}
    </>
  );
}
```

### Uso

```typescript
import { toast } from 'sonner';
import i18next from 'i18next'; // usar instancia global fuera de componentes React

// Success
toast.success(i18next.t('toast.invoiceCreated'));

// Error
toast.error(i18next.t('toast.invoiceCreateError'));

// Info
toast.info(i18next.t('toast.savedAsDraft'));

// Warning
toast.warning(i18next.t('toast.alreadySent'));

// Promise
toast.promise(
  createInvoice(data),
  {
    loading: 'Creando factura...',
    success: 'Factura creada',
    error: 'Error al crear factura',
  }
);
```

---

## 🧪 Testing (TDD Obligatorio)

### Metodología TDD en Frontend

**Igual que backend:**
1. ✅ Escribir test primero (debe fallar)
2. ✅ Implementar código mínimo para pasar
3. ✅ Refactorizar manteniendo tests en verde
4. 🛑 Si test falla después de implementar → DETENER y reportar

### Tests Unitarios (Vitest + React Testing Library)

**Cobertura esperada: 80%**

```typescript
// tests/unit/lib/calculations.test.ts
import { describe, it, expect } from 'vitest';
import { calculateInvoiceTotals } from '@/lib/calculations';

describe('calculateInvoiceTotals', () => {
  it('should calculate totals correctly with single line', () => {
    // Arrange
    const lines = [
      {
        cantidad: 2,
        precioUnitario: 100,
        ivaPorcentaje: 21,
      },
    ];

    // Act
    const result = calculateInvoiceTotals(lines);

    // Assert
    expect(result.subtotal).toBe(200);
    expect(result.totalIva).toBe(42);
    expect(result.total).toBe(242);
  });

  it('should calculate totals with multiple lines', () => {
    const lines = [
      { cantidad: 1, precioUnitario: 100, ivaPorcentaje: 21 },
      { cantidad: 2, precioUnitario: 50, ivaPorcentaje: 21 },
    ];

    const result = calculateInvoiceTotals(lines);

    expect(result.subtotal).toBe(200);
    expect(result.totalIva).toBe(42);
    expect(result.total).toBe(242);
  });
});
```

### Tests de Componentes

```typescript
// tests/unit/components/InvoiceStatusBadge.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InvoiceStatusBadge } from '@/features/invoices/components/InvoiceStatusBadge';

describe('InvoiceStatusBadge', () => {
  it('should render "Borrador" for draft status', () => {
    // Arrange & Act
    render(<InvoiceStatusBadge status="borrador" />);

    // Assert
    expect(screen.getByText('Borrador')).toBeInTheDocument();
  });

  it('should render "Enviada" for sent status', () => {
    render(<InvoiceStatusBadge status="enviada" />);
    expect(screen.getByText('Enviada')).toBeInTheDocument();
  });

  it('should apply correct CSS class for draft', () => {
    const { container } = render(<InvoiceStatusBadge status="borrador" />);
    expect(container.firstChild).toHaveClass('bg-yellow-100');
  });
});
```

### Tests de Custom Hooks

```typescript
// tests/unit/hooks/useInvoices.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInvoices } from '@/features/invoices/hooks/useInvoices';
import * as api from '@/api/endpoints/invoices';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useInvoices', () => {
  it('should fetch invoices successfully', async () => {
    // Arrange
    const mockInvoices = [
      { id: '1', numero: '2026/001', total: 242 },
      { id: '2', numero: '2026/002', total: 121 },
    ];
    
    vi.spyOn(api, 'getInvoices').mockResolvedValue({
      success: true,
      data: mockInvoices,
    });

    // Act
    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockInvoices);
  });
});
```

### Tests de Integración (30% cobertura)

```typescript
// tests/integration/features/invoice-creation.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoiceCreatePage } from '@/features/invoices/pages/InvoiceCreatePage';
import { setupServer } from 'msw/node';
import { handlers } from '@/tests/mocks/handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Invoice Creation Flow', () => {
  it('should create invoice with lines successfully', async () => {
    const user = userEvent.setup();

    // Arrange
    render(<InvoiceCreatePage />);

    // Act - Fill form
    await user.selectOptions(screen.getByLabelText(/cliente/i), 'client-1');
    await user.type(screen.getByLabelText(/descripción/i), 'Servicio de consultoría');
    await user.type(screen.getByLabelText(/cantidad/i), '2');
    await user.type(screen.getByLabelText(/precio/i), '100');

    // Act - Submit
    await user.click(screen.getByRole('button', { name: /crear factura/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/factura creada correctamente/i)).toBeInTheDocument();
    });
  });
});
```

### Tests E2E con Playwright (10% cobertura)

```typescript
// tests/e2e/invoices.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Invoice Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@test.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create and send invoice', async ({ page }) => {
    // Navigate to invoices
    await page.goto('/invoices');
    await page.click('text=Nueva Factura');

    // Fill form
    await page.selectOption('[name="clientId"]', { label: 'Cliente Test' });
    await page.fill('[name="lines.0.descripcion"]', 'Desarrollo Web');
    await page.fill('[name="lines.0.cantidad"]', '1');
    await page.fill('[name="lines.0.precioUnitario"]', '1200');

    // Create draft
    await page.click('button:has-text("Guardar Borrador")');
    await expect(page.locator('text=Factura creada')).toBeVisible();

    // Send invoice
    await page.click('button:has-text("Enviar Factura")');
    await page.click('button:has-text("Confirmar")');

    // Verify invoice number was assigned
    await expect(page.locator('text=/2026\\/\\d{3}/')).toBeVisible();
    await expect(page.locator('text=Enviada')).toBeVisible();
  });

  test('should not allow editing sent invoice', async ({ page }) => {
    await page.goto('/invoices');
    await page.click('text=2026/001'); // Click on sent invoice

    // Verify edit button is disabled
    const editButton = page.locator('button:has-text("Editar")');
    await expect(editButton).toBeDisabled();
  });
});
```

### MSW (Mock Service Worker) para API Mocking

```typescript
// tests/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  // Auth
  rest.post('/api/v1/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: '1',
            email: 'test@test.com',
            nombreComercial: 'Test User',
          },
        },
      })
    );
  }),

  // Invoices
  rest.get('/api/v1/invoices', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: [
          {
            id: '1',
            numero: '2026/001',
            estado: 'enviada',
            total: 242,
            client: { nombre: 'Cliente Test' },
          },
        ],
      })
    );
  }),

  rest.post('/api/v1/invoices', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: {
          id: '2',
          numero: null,
          estado: 'borrador',
          total: 242,
        },
      })
    );
  }),
];
```

---

## 🚀 Deploy Gratuito (MVP)

### **Opción Recomendada: Stack Separado**

#### **Frontend → Vercel** (100% Gratis)
- ✅ Builds ilimitados
- ✅ Deploy automático con Git push
- ✅ HTTPS gratis
- ✅ CDN global
- ✅ Preview deployments por PR

**Setup:**
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy desde carpeta frontend/
cd frontend
vercel

# 3. Configurar variables de entorno en Vercel dashboard
VITE_API_URL=https://tu-backend.onrender.com/api/v1
```

#### **Backend → Render** (750h/mes gratis)
- ✅ Autodeploy con Git
- ✅ Variables de entorno
- ✅ Logs centralizados
- ⚠️ Se "duerme" tras 15 min inactividad (primer request tarda ~30s)

**Setup:**
1. Conectar repo GitHub en render.com
2. Configurar:
   - Build: `npm install`
   - Start: `npm start`
3. Variables de entorno:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=...
   FRONTEND_URL=https://tu-app.vercel.app
   ```

#### **Database → Neon PostgreSQL** (500MB gratis)
- ✅ PostgreSQL serverless
- ✅ Backups automáticos
- ✅ Connection pooling
- ✅ Branching (Git-like para DB)

**Setup:**
1. Crear proyecto en neon.tech
2. Copiar connection string
3. Agregar a Render como `DATABASE_URL`

---

### **Alternativa: Todo en Render**

Puedes deployar FE + BE juntos en Render:

**Estructura:**
```
/
├── frontend/        # Build estático
├── backend/         # API Node.js
└── package.json     # Scripts root
```

**Configuración Render:**
- Build: `npm run build:all`
- Start: `npm start`
- Static files: `frontend/dist`

**Scripts package.json root:**
```json
{
  "scripts": {
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "build:all": "npm run build:frontend && npm run build:backend",
    "start": "cd backend && npm start"
  }
}
```

**Servir frontend estático desde Express:**
```typescript
// backend/src/app.ts
import path from 'path';

if (process.env.NODE_ENV === 'production') {
  // Servir archivos estáticos de frontend
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  
  // Cualquier ruta no-API → index.html (SPA routing)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
    }
  });
}
```

---

### **Comparación Opciones**

| Característica | Vercel + Render + Neon | Todo en Render |
|---|---|---|
| **Costo** | 100% Gratis | 100% Gratis |
| **Deploy FE** | Instantáneo | ~2-3 min |
| **Cold starts** | FE: No, BE: Sí | BE: Sí |
| **Complejidad** | Baja (servicios separados) | Media (monorepo) |
| **Escalabilidad** | Mejor (independiente) | Limitada |

**Recomendación:** Usa **Vercel + Render + Neon** por simplicidad y mejor DX.

---

### **Variables de Entorno por Ambiente**

#### **Desarrollo (.env.development)**
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_ENV=development
```

#### **Producción (Vercel Environment Variables)**
```env
VITE_API_URL=https://tu-backend.onrender.com/api/v1
VITE_ENV=production
```

---

### **CORS en Backend (Crítico para Cookies)**

```typescript
// backend/src/app.ts
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL, // https://tu-app.vercel.app
  credentials: true, // PERMITE COOKIES
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
```

**Variables de entorno backend:**
```env
# Development
FRONTEND_URL=http://localhost:5173

# Production
FRONTEND_URL=https://tu-app.vercel.app
```

---

## 📦 Descargar PDF de Factura

```typescript
// features/invoices/hooks/useInvoicePDF.ts
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { toast } from 'sonner';

export const useDownloadInvoicePDF = () => {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await apiClient.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (blob, invoiceId) => {
      // Crear URL del blob
      const url = window.URL.createObjectURL(blob);
      
      // Crear link temporal y hacer click
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF descargado correctamente');
    },
    onError: () => {
      toast.error('Error al descargar el PDF');
    },
  });
};

// Uso en componente
export const InvoiceDetails = ({ invoice }: { invoice: Invoice }) => {
  const downloadPDF = useDownloadInvoicePDF();

  return (
    <div>
      <button
        onClick={() => downloadPDF.mutate(invoice.id)}
        disabled={downloadPDF.isPending}
      >
        {downloadPDF.isPending ? 'Descargando...' : 'Descargar PDF'}
      </button>
    </div>
  );
};
```

---

## 🎨 Componentes shadcn/ui

### Instalación

```bash
npx shadcn-ui@latest init
```

### Agregar componentes

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
npx shadcn-ui@latest add form
npx shadcn-ui@latest add select
npx shadcn-ui@latest add badge
```

### Ejemplo de uso

```typescript
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const DeleteInvoiceDialog = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar factura?</DialogTitle>
        </DialogHeader>
        <p>Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

---

## 🔄 Estados de Factura/Presupuesto

### Badge Component

```typescript
// features/invoices/components/InvoiceStatusBadge.tsx
import { Badge } from '@/components/ui/badge';
import type { InvoiceStatus } from '@/types/enums';

interface Props {
  status: InvoiceStatus;
}

export const InvoiceStatusBadge = ({ status }: Props) => {
  const config = {
    borrador: {
      label: 'Borrador',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
    enviada: {
      label: 'Enviada',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
  };

  const { label, className } = config[status];

  return <Badge className={className}>{label}</Badge>;
};
```

---

## 📱 Responsive Design (Mobile First)

### Breakpoints TailwindCSS

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
};
```

### Uso

```typescript
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-xl md:text-2xl lg:text-3xl">Facturas</h1>
  
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Cards */}
  </div>
</div>
```

---

## 🛡️ Validaciones en Frontend

### Validar antes de enviar

```typescript
const onSubmit = (data: CreateInvoiceInput) => {
  // Validaciones adicionales si necesario
  if (data.lines.length === 0) {
    toast.error('Debe agregar al menos una línea');
    return;
  }

  // Calcular totales para confirmar
  const totals = calculateInvoiceTotals(data.lines);
  
  if (totals.total <= 0) {
    toast.error('El total de la factura debe ser mayor a 0');
    return;
  }

  // Crear factura
  createInvoiceMutation.mutate(data);
};
```

---

## 🔍 Filtros y Búsqueda

```typescript
// features/invoices/components/InvoiceFilters.tsx
import { useForm } from 'react-hook-form';

interface FilterValues {
  estado?: 'borrador' | 'enviada';
  clientId?: string;
  desde?: string;
  hasta?: string;
}

export const InvoiceFilters = ({ onFilter }: { onFilter: (filters: FilterValues) => void }) => {
  const { register, handleSubmit, reset } = useForm<FilterValues>();

  return (
    <form onSubmit={handleSubmit(onFilter)} className="flex gap-4">
      <select {...register('estado')}>
        <option value="">Todos los estados</option>
        <option value="borrador">Borrador</option>
        <option value="enviada">Enviada</option>
      </select>

      <input type="date" {...register('desde')} placeholder="Desde" />
      <input type="date" {...register('hasta')} placeholder="Hasta" />

      <button type="submit">Filtrar</button>
      <button type="button" onClick={() => reset()}>
        Limpiar
      </button>
    </form>
  );
};
```

---

## 📋 Checklist Frontend Feature

Antes de considerar una feature completada:

- [ ] **Tests escritos y pasando (TDD)**
  - [ ] Tests unitarios para lógica/utilidades
  - [ ] Tests de componentes con RTL
  - [ ] Tests de integración si aplica
- [ ] **Validación con Zod implementada**
- [ ] **UI responsive (mobile-first)**
- [ ] **Toasts para feedback de usuario**
- [ ] **Loading states implementados**
- [ ] **Error handling apropiado**
- [ ] **Traducciones es/en agregadas**
- [ ] **Modo oscuro funciona correctamente**
- [ ] **Sin console.logs olvidados**
- [ ] **TypeScript sin errores**
- [ ] **ESLint sin warnings**

---

## 🚨 Reglas Críticas para el Agente

### Antes de programar:
- ✅ Lee este documento `frontend.md` si trabajas en FE
- ✅ Lee `API.md` para conocer contratos de endpoints
- ✅ Lee `domain.md` para entender términos del negocio

### Al programar:
- ✅ **TDD obligatorio:** Test → Fallo → Código → Pasa
- ✅ Nunca elimines archivos sin confirmación
- ✅ Valida todos los inputs con Zod antes de enviar
- ✅ Muestra toasts para feedback (success/error)
- ✅ Implementa loading states (isPending, isLoading)
- ✅ Maneja errores de API apropiadamente
- ✅ Usa TanStack Query para cache y sincronización
- ✅ Componentes mobile-first (responsive)
- ✅ Traduce textos (usa i18next)
- ✅ Modo oscuro compatible (usa variables CSS)

### Después de programar:
- ✅ Ejecuta tests: `npm run test`
- ✅ Verifica tipos: `npm run typecheck`
- ✅ Formatea código: `npm run format`

### 🛑 Detén y pregunta si:
- Vas a crear una nueva ruta sin definir
- Necesitas agregar una librería nueva
- Un test falla después de implementar
- No entiendes un término del dominio
- Vas a modificar estructura de carpetas

---

## 📚 Comandos Útiles

```bash
# Desarrollo
npm run dev                  # Servidor desarrollo con HMR
npm run build                # Build producción
npm run preview              # Preview del build

# Testing
npm run test                 # Tests unitarios + integración
npm run test:watch           # Tests en modo watch
npm run test:coverage        # Cobertura de tests
npm run test:e2e             # Tests E2E con Playwright
npm run test:e2e:ui          # Playwright UI mode

# Linting y Formateo
npm run lint                 # ESLint
npm run lint:fix             # ESLint autofix
npm run format               # Prettier
npm run typecheck            # Verificar tipos TypeScript

# Utilidades
npm run preview              # Preview build de producción
```

---

## 🎯 Principios de Diseño Frontend

1. **Mobile First**
   - Diseñar primero para móvil, luego desktop
   - Usar breakpoints de Tailwind progresivamente

2. **Accessibility First**
   - shadcn/ui ya viene con accesibilidad
   - Usar labels en formularios
   - Keyboard navigation funcional

3. **Performance**
   - Code splitting con React.lazy()
   - Optimistic updates en mutaciones
   - Virtualization si listas > 100 items (react-virtual)

4. **User Feedback**
   - Loading states siempre visibles
   - Toasts para operaciones
   - Confirmación para acciones destructivas

5. **Consistency**
   - Usar componentes de shadcn/ui
   - Mantener espaciado consistente (Tailwind spacing)
   - Paleta de colores uniforme

---

**Última actualización:** 2026-03-09
