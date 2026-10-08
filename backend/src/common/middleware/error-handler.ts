import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError } from '../errors/api-error';
import { logger } from '../utils/logger';
import { isProduction } from '../../config/env';

/** Middleware 404 para rutas de API no registradas. */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Manejador global de errores.
 * Traduce excepciones internas a respuestas HTTP seguras:
 * - Nunca expone stack traces ni mensajes internos de la base de datos al cliente.
 * - Mapea errores conocidos de Zod y Prisma a códigos semánticos.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  let statusCode = 500;
  let message = 'Error interno del servidor';
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = err.errors[0]?.message ?? 'Datos de entrada inválidos';
    details = err.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Traducción de códigos de error de Prisma a respuestas HTTP amigables
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'Ya existe un registro con un valor único duplicado';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'El recurso solicitado no existe';
    } else if (err.code === 'P2003') {
      statusCode = 409;
      message = 'La operación viola una restricción de integridad referencial';
    } else {
      statusCode = 400;
      message = 'Error de base de datos en la solicitud';
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Parámetros de consulta a la base de datos inválidos';
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = 'No se pudo conectar a la base de datos PostgreSQL (localhost:5432). Verifique que el servicio esté activo o configure DATABASE_URL.';
  }

  // Registramos SIEMPRE el detalle real en el servidor (con requestId para trazar).
  const logPayload = {
    requestId: (req as Request & { id?: string }).id,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    err,
  };
  if (statusCode >= 500) {
    logger.error(logPayload, 'Error no controlado');
  } else {
    logger.warn(logPayload, 'Error controlado');
  }

  const body: Record<string, unknown> = { success: false, error: message };
  if (details) body.details = details;
  // El stack solo se envía fuera de producción para depuración local.
  if (!isProduction && err instanceof Error && statusCode >= 500) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
}
