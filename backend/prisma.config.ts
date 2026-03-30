import path from 'path';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Misma política que scripts/seed.ts: ruta fija a backend/.env y override: true.
// Así Prisma CLI (studio, migrate, …) no usa un DATABASE_URL residual del shell
// distinto del que usa la app y el seed (típico: .env → :5433 vs export → :5432).
config({ path: path.resolve(__dirname, '.env'), override: true });

export default defineConfig({
  schema: 'src/prisma/schema.prisma',
  migrations: {
    path: 'src/prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
