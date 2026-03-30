/** Parte del email tras @ para correlación en logs sin almacenar la dirección completa. */
export function emailDomainFrom(email: string): string {
  const at = email.lastIndexOf('@');
  return at >= 0 ? email.slice(at + 1).toLowerCase() : 'unknown';
}
