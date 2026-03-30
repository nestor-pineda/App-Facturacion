import { env } from '@/config/env';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import app from '@/app';

async function bootstrap() {
  await prisma.$connect();
  logger.info('Conexión a la base de datos establecida');

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, 'Servidor en escucha');
  });
}

bootstrap().catch((error) => {
  logger.error(
    { err: error instanceof Error ? error : new Error(String(error)) },
    'Error al arrancar el servidor',
  );
  process.exit(1);
});
