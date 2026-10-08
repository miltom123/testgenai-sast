import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Envoltura para manejadores async de Express.
 * Captura cualquier promesa rechazada y la reenvía a next(), evitando
 * repetir bloques try/catch en cada endpoint y garantizando que todo error
 * llegue al manejador global centralizado.
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
