import { prisma } from '@/config/database';

export const generateInvoiceNumber = async (userId: string): Promise<string> => {
  const year = new Date().getFullYear();

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      user_id: userId,
      numero: { startsWith: `${year}/` },
    },
    orderBy: { numero: 'desc' },
  });

  let nextNumber = 1;
  if (lastInvoice?.numero) {
    const lastNum = parseInt(lastInvoice.numero.split('/')[1], 10);
    nextNumber = lastNum + 1;
  }

  return `${year}/${String(nextNumber).padStart(3, '0')}`;
};
