import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/config/database';

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quoteLine.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.client.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();
});
