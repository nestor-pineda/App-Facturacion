import bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { env } from '@/config/env';
import type { RegisterInput, LoginInput } from '@/api/schemas/auth.schema';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = env.JWT_EXPIRES_IN;
const REFRESH_TOKEN_TTL = env.JWT_REFRESH_EXPIRES_IN;

export const EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS';
export const INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';
export const INVALID_TOKEN = 'INVALID_TOKEN';
export const REFRESH_TOKEN_REVOKED = 'REFRESH_TOKEN_REVOKED';
export const PRISMA_REFRESH_TOKEN_DELEGATE_MISSING = 'PRISMA_REFRESH_TOKEN_DELEGATE_MISSING';

type JwtPayload = {
  userId: string;
  jti?: string;
  exp?: number;
};

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

const parseTokenExpiration = (token: string): Date => {
  const decoded = jwt.decode(token) as JwtPayload | null;
  if (!decoded?.exp) {
    throw new Error(INVALID_TOKEN);
  }
  return new Date(decoded.exp * 1000);
};

const signAccessToken = (userId: string): string =>
  jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL } as jwt.SignOptions);

const signRefreshToken = (userId: string): string =>
  jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
    jwtid: randomUUID(),
  } as jwt.SignOptions);

const refreshTokenDelegate = () => {
  // Defensive runtime guard: this can happen if Prisma Client is stale in deployment.
  if (!prisma.refreshToken) {
    throw new Error(PRISMA_REFRESH_TOKEN_DELEGATE_MISSING);
  }
  return prisma.refreshToken;
};

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

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  const refreshTokenHash = hashToken(refreshToken);
  const refreshTokenExpiresAt = parseTokenExpiration(refreshToken);

  await refreshTokenDelegate().create({
    data: {
      user_id: user.id,
      token_hash: refreshTokenHash,
      expires_at: refreshTokenExpiresAt,
    },
  });

  const { password: _password, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, accessToken, refreshToken };
};

export const refresh = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
    const refreshTokenHash = hashToken(refreshToken);
    const activeToken = await refreshTokenDelegate().findFirst({
      where: {
        user_id: decoded.userId,
        token_hash: refreshTokenHash,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
    });

    if (!activeToken) {
      throw new Error(REFRESH_TOKEN_REVOKED);
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw new Error(INVALID_TOKEN);
    }

    const accessToken = signAccessToken(decoded.userId);

    return { accessToken };
  } catch {
    throw new Error(INVALID_TOKEN);
  }
};

export const logout = async (refreshToken: string | undefined) => {
  if (!refreshToken) {
    return;
  }

  await refreshTokenDelegate().updateMany({
    where: {
      token_hash: hashToken(refreshToken),
      revoked_at: null,
    },
    data: { revoked_at: new Date() },
  });
};
