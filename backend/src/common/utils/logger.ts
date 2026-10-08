import pino from 'pino';
import { env, isProduction } from '../../config/env';

/**
 * Logger estructurado centralizado.
 * - En desarrollo: salida legible y coloreada (pino-pretty).
 * - En producción: JSON de una línea por evento (apto para agregadores de logs).
 * Reemplaza el uso disperso de console.log/console.error en todo el backend.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: undefined, // omite pid/hostname para logs más limpios
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    // Nunca escribas secretos ni credenciales en los logs
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.token',
    ],
    censor: '[REDACTADO]',
  },
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
});
