import { PrismaClient } from '@prisma/client';
import { isProduction } from './env';
import { logger } from '../common/utils/logger';

export const prisma = new PrismaClient({
  log: isProduction ? ['error'] : ['warn', 'error'],
});

/**
 * Inicializa y comprueba la conexión con la base de datos PostgreSQL.
 */
export async function initDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Conexión con PostgreSQL establecida correctamente');
    return true;
  } catch (error) {
    logger.warn({ error }, '⚠️  No se pudo conectar a PostgreSQL al iniciar. Verifique DATABASE_URL o inicie el contenedor.');
    return false;
  }
}

/** Cierra la conexión con la base de datos de forma ordenada (graceful shutdown). */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
