import { env } from './config/env';
import { prisma } from './config/database';
import app from './app';

async function bootstrap() {
  await prisma.$connect();
  console.log('Conexión a la base de datos establecida');

  app.listen(env.PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });
}

bootstrap().catch((error) => {
  console.error('Error al arrancar el servidor:', error.message);
  process.exit(1);
});
