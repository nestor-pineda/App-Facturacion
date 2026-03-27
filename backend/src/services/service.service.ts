import { prisma } from '@/config/database';
import type { CreateServiceInput, UpdateServiceInput } from '@/api/schemas/service.schema';

export const SERVICE_NOT_FOUND = 'SERVICE_NOT_FOUND';

export const search = async (userId: string, query: string) => {
  const q = query.trim();
  if (q.length === 0) {
    return [];
  }
  return prisma.service.findMany({
    where: {
      user_id: userId,
      nombre: { contains: q, mode: 'insensitive' },
    },
    orderBy: { created_at: 'asc' },
  });
};

export const list = async (userId: string) => {
  return prisma.service.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'asc' },
  });
};

export const create = async (userId: string, data: CreateServiceInput) => {
  return prisma.service.create({
    data: {
      user_id: userId,
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio_base: data.precio_base,
      ...(data.iva_porcentaje !== undefined && { iva_porcentaje: data.iva_porcentaje }),
    },
  });
};

export const update = async (userId: string, id: string, data: UpdateServiceInput) => {
  const updateData: Record<string, unknown> = {};
  if (data.nombre !== undefined) updateData.nombre = data.nombre;
  if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
  if (data.precio_base !== undefined) updateData.precio_base = data.precio_base;
  if (data.iva_porcentaje !== undefined) updateData.iva_porcentaje = data.iva_porcentaje;

  const result = await prisma.service.updateMany({
    where: { id, user_id: userId },
    data: updateData,
  });

  if (result.count === 0) {
    throw new Error(SERVICE_NOT_FOUND);
  }

  return prisma.service.findFirst({ where: { id, user_id: userId } });
};
