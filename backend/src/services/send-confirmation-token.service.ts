import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

export const SEND_CONFIRMATION_PURPOSE_INVOICE = 'invoice_send' as const;
export const SEND_CONFIRMATION_PURPOSE_QUOTE = 'quote_send' as const;

export type SendConfirmationPurpose =
  | typeof SEND_CONFIRMATION_PURPOSE_INVOICE
  | typeof SEND_CONFIRMATION_PURPOSE_QUOTE;

const SEND_CONFIRMATION_EXPIRES_IN = '10m';

type SendConfirmationJwtPayload = {
  purpose: SendConfirmationPurpose;
  sub: string;
  doc: string;
};

export const INVALID_SEND_CONFIRMATION = 'INVALID_SEND_CONFIRMATION';

function getSigningSecret(): string {
  return env.SEND_CONFIRMATION_SECRET;
}

export function issueSendConfirmationToken(
  purpose: SendConfirmationPurpose,
  userId: string,
  documentId: string,
): string {
  const payload: SendConfirmationJwtPayload = {
    purpose,
    sub: userId,
    doc: documentId,
  };
  return jwt.sign(payload, getSigningSecret(), {
    expiresIn: SEND_CONFIRMATION_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

export function verifySendConfirmationToken(
  token: string,
  purpose: SendConfirmationPurpose,
  userId: string,
  documentId: string,
): void {
  let decoded: jwt.JwtPayload & SendConfirmationJwtPayload;
  try {
    decoded = jwt.verify(token, getSigningSecret(), {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload & SendConfirmationJwtPayload;
  } catch {
    throw new Error(INVALID_SEND_CONFIRMATION);
  }

  if (decoded.purpose !== purpose || decoded.sub !== userId || decoded.doc !== documentId) {
    throw new Error(INVALID_SEND_CONFIRMATION);
  }
}
