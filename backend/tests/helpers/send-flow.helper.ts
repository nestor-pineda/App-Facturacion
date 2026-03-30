import request from 'supertest';
import type { Express } from 'express';
import { withMutationGuards } from './mutation-guard.helper';

export async function getInvoiceSendToken(app: Express, cookies: string[], invoiceId: string) {
  const res = await withMutationGuards(
    request(app).post(`/api/v1/invoices/${invoiceId}/send-confirmation`),
  ).set('Cookie', cookies);
  if (res.status !== 200) {
    throw new Error(`send-confirmation expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.confirmationToken as string;
}

export async function patchInvoiceSend(
  app: Express,
  cookies: string[],
  invoiceId: string,
  confirmationToken: string,
) {
  return withMutationGuards(
    request(app).patch(`/api/v1/invoices/${invoiceId}/send`).send({ confirmationToken }),
  ).set('Cookie', cookies);
}

export async function getQuoteSendToken(app: Express, cookies: string[], quoteId: string) {
  const res = await withMutationGuards(
    request(app).post(`/api/v1/quotes/${quoteId}/send-confirmation`),
  ).set('Cookie', cookies);
  if (res.status !== 200) {
    throw new Error(`send-confirmation expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.confirmationToken as string;
}

export async function patchQuoteSend(
  app: Express,
  cookies: string[],
  quoteId: string,
  confirmationToken: string,
) {
  return withMutationGuards(
    request(app).patch(`/api/v1/quotes/${quoteId}/send`).send({ confirmationToken }),
  ).set('Cookie', cookies);
}
