import { Request, Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Operación exitosa',
  statusCode = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

export function sendError(res: Response, error: string, statusCode = 400): Response {
  return res.status(statusCode).json({
    success: false,
    error,
  });
}

/** Respuesta paginada estándar con metadatos de navegación. */
export function sendPaginated<T>(
  res: Response,
  items: T[],
  meta: PaginationMeta,
  message = 'Operación exitosa'
): Response {
  return res.status(200).json({
    success: true,
    data: items,
    meta,
    message,
  });
}

/**
 * Extrae y sanea los parámetros de paginación de la query string.
 * page >= 1 (def. 1), pageSize entre 1 y 100 (def. 20).
 */
export function getPagination(req: Request): { page: number; pageSize: number; skip: number; take: number } {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const rawSize = Number.parseInt(String(req.query.pageSize ?? '20'), 10) || 20;
  const pageSize = Math.min(100, Math.max(1, rawSize));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function buildPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 0 };
}
