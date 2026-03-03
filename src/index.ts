import { env } from './config/env';
import app from './app';

app.listen(env.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${env.PORT} [${env.NODE_ENV}]`);
});
