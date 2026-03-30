import type { PrismaClient } from '@prisma/client';
import type { DocumentLineInput } from '@/api/schemas/document.schema';
import { RELATED_SERVICE_NOT_FOUND } from '@/services/document-ownership.service';

type DbClient = Pick<PrismaClient, 'service'>;

const lineDescriptionFromService = (nombre: string, descripcion: string | null | undefined): string => {
  const extra = descripcion?.trim();
  return extra ? `${nombre} — ${extra}` : nombre;
};

/**
 * When a line references a catalog service, overwrites descripcion, precio_unitario and iva_porcentaje
 * from the service row (snapshot at save time). Lines without service_id keep client-supplied values.
 */
export async function applyCatalogSnapshotsToDocumentLines(
  db: DbClient,
  userId: string,
  lines: DocumentLineInput[],
): Promise<DocumentLineInput[]> {
  const serviceIds = [
    ...new Set(lines.map((l) => l.service_id).filter((id): id is string => id != null && id !== '')),
  ];

  if (serviceIds.length === 0) {
    return lines;
  }

  const services = await db.service.findMany({
    where: { user_id: userId, id: { in: serviceIds } },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      precio_base: true,
      iva_porcentaje: true,
    },
  });

  const byId = new Map(services.map((s) => [s.id, s]));

  return lines.map((line) => {
    if (!line.service_id) {
      return line;
    }
    const svc = byId.get(line.service_id);
    if (!svc) {
      throw new Error(RELATED_SERVICE_NOT_FOUND);
    }
    return {
      ...line,
      descripcion: lineDescriptionFromService(svc.nombre, svc.descripcion),
      precio_unitario: Number(svc.precio_base),
      iva_porcentaje: Number(svc.iva_porcentaje),
    };
  });
}
