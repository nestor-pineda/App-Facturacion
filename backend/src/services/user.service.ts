import { prisma } from '@/config/database';
import type { UpdateProfileInput } from '@/api/schemas/auth.schema';

export const USER_NOT_FOUND = 'USER_NOT_FOUND';
export const EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS';

export const updateCurrentUser = async (userId: string, data: UpdateProfileInput) => {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        email: data.email,
        nombre_comercial: data.nombre_comercial,
        nif: data.nif,
        direccion_fiscal: data.direccion_fiscal,
        telefono: data.telefono,
      },
    });

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === 'P2025') {
      throw new Error(USER_NOT_FOUND);
    }
    if (err.code === 'P2002') {
      throw new Error(EMAIL_ALREADY_EXISTS);
    }
    throw error;
  }
};
