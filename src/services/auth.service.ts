import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import type { RegisterInput } from '../api/schemas/auth.schema';

const SALT_ROUNDS = 12;

export const EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS';

export const register = async (data: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });

  if (existing) {
    throw new Error(EMAIL_ALREADY_EXISTS);
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      nombre_comercial: data.nombre_comercial,
      nif: data.nif,
      direccion_fiscal: data.direccion_fiscal,
      telefono: data.telefono,
    },
  });

  const { password: _password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
