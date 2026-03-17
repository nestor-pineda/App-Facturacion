import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

// Prisma 7 can export the client differently; use require to support both named and default export
const PrismaModule = require('@prisma/client');
const PrismaClientCtor = PrismaModule.PrismaClient ?? PrismaModule.default ?? PrismaModule;

type PrismaInstance = InstanceType<typeof PrismaClientCtor>;
const globalForPrisma = globalThis as unknown as { prisma: PrismaInstance };

export const prisma: PrismaInstance =
  globalForPrisma.prisma ?? new PrismaClientCtor({ adapter });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
