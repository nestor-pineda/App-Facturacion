import { prisma } from '../config/database';
import type { CreateServiceInput } from '../api/schemas/service.schema';

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
