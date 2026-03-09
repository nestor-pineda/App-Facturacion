import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { env } from '@/config/env';
import type { RegisterInput, LoginInput, RefreshInput } from '@/api/schemas/auth.schema';

const SALT_ROUNDS = 12;

export const EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS';
export const INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';
export const INVALID_TOKEN = 'INVALID_TOKEN';

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

export const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    throw new Error(INVALID_CREDENTIALS);
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw new Error(INVALID_CREDENTIALS);
  }

  const accessToken = jwt.sign(
    { userId: user.id },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions,
  );

  return { accessToken, refreshToken };
};

export const refresh = (data: RefreshInput) => {
  try {
    const decoded = jwt.verify(data.refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
    );

    return { accessToken };
  } catch {
    throw new Error(INVALID_TOKEN);
  }
};
