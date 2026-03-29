export const IVA_DEFAULT = 21;
export const INVOICE_NUMBER_FORMAT = 'YYYY/NNN';

export const ESTADO_BORRADOR = 'borrador' as const;
export const ESTADO_ENVIADA = 'enviada' as const;
export const ESTADO_ENVIADO = 'enviado' as const;

export const API_BASE_PATH = '/api/v1';

export const API_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  NO_TOKEN: 'NO_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  ALREADY_SENT: 'ALREADY_SENT',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVOICE_DRAFT: 'INVOICE_DRAFT',
} as const;

export const QUERY_KEYS = {
  CLIENTS: 'clients',
  SERVICES: 'services',
  QUOTES: 'quotes',
  INVOICES: 'invoices',
  DASHBOARD: 'dashboard',
} as const;

/** React Hook Form: validación tras blur y luego en cada cambio (inline) */
export const FORM_VALIDATION_MODE = 'onTouched' as const;
