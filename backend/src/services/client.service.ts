import { prisma } from '@/config/database';
import type { CreateClientInput, UpdateClientInput } from '@/api/schemas/client.schema';

export const CLIENT_NOT_FOUND = 'CLIENT_NOT_FOUND';

export const list = async (userId: string) => {
  const clients = await prisma.client.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'asc' },
  });

  return { data: clients, total: clients.length };
};

export const create = async (userId: string, data: CreateClientInput) => {
  return prisma.client.create({
    data: {
      user_id: userId,
      nombre: data.nombre,
      email: data.email,
      cif_nif: data.cif_nif,
      direccion: data.direccion,
      telefono: data.telefono,
    },
  });
};

export const update = async (userId: string, id: string, data: UpdateClientInput) => {
  const result = await prisma.client.updateMany({
    where: { id, user_id: userId },
    data,
  });

  if (result.count === 0) {
    throw new Error(CLIENT_NOT_FOUND);
  }

  return prisma.client.findFirst({ where: { id, user_id: userId } });
};
