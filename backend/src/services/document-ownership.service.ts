import type { PrismaClient } from '@prisma/client';

export const RELATED_CLIENT_NOT_FOUND = 'RELATED_CLIENT_NOT_FOUND';
export const RELATED_SERVICE_NOT_FOUND = 'RELATED_SERVICE_NOT_FOUND';

type DbClient = Pick<PrismaClient, 'client' | 'service'>;

/**
 * Ensures the client and optional catalog services belong to the same user as the document.
 * Used before creating/updating quotes and invoices (and quote→invoice conversion).
 */
export async function assertDocumentRefsForUser(
  db: DbClient,
  userId: string,
  clientId: string,
  lines: { service_id?: string | null }[],
): Promise<void> {
  const client = await db.client.findFirst({
    where: { id: clientId, user_id: userId },
    select: { id: true },
  });

  if (!client) {
    throw new Error(RELATED_CLIENT_NOT_FOUND);
  }

  const serviceIds = [
    ...new Set(
      lines.map((l) => l.service_id).filter((id): id is string => id != null && id !== ''),
    ),
  ];

  if (serviceIds.length === 0) {
    return;
  }

  const count = await db.service.count({
    where: { user_id: userId, id: { in: serviceIds } },
  });

  if (count !== serviceIds.length) {
    throw new Error(RELATED_SERVICE_NOT_FOUND);
  }
}
