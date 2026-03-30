/** Nombres estables para logs de auditoría / seguridad (A09). */
export const AUDIT_EVENT = {
  AUTH_LOGIN_SUCCESS: 'auth.login.success',
  AUTH_LOGIN_FAILURE: 'auth.login.failure',
  AUTH_REFRESH_FAILURE: 'auth.refresh.failure',
  AUTH_TOKEN_MISSING: 'auth.token.missing',
  AUTH_TOKEN_INVALID: 'auth.token.invalid',
  DOCUMENT_SEND_CONFIRMATION_ISSUED: 'document.send_confirmation.issued',
  DOCUMENT_SEND_CONFIRMATION_REJECTED: 'document.send_confirmation.rejected',
  DOCUMENT_SENT: 'document.sent',
  RESOURCE_ACCESS_NOT_FOUND: 'authz.resource.not_found',
  AGENT_CHAT_SUCCESS: 'agent.chat.success',
  AGENT_CHAT_ERROR: 'agent.chat.error',
} as const;

/** Tipo de recurso en eventos de auditoría (sin datos sensibles). */
export const RESOURCE_KIND = {
  INVOICE: 'invoice',
  QUOTE: 'quote',
  CLIENT: 'client',
  SERVICE: 'service',
  USER: 'user',
} as const;
