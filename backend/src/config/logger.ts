import pino from 'pino';

const nodeEnv = process.env.NODE_ENV;
const level =
  nodeEnv === 'production' ? 'info' : nodeEnv === 'test' ? 'silent' : 'debug';

export const logger = pino({
  level,
  base: { service: 'app-facturacion-api' },
});
