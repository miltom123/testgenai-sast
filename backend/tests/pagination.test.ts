import { describe, it, expect } from 'vitest';
import type { Request } from 'express';
import { getPagination, buildPaginationMeta } from '../src/common/utils/api-response';

const mockReq = (query: Record<string, unknown>) => ({ query }) as unknown as Request;

describe('getPagination', () => {
  it('usa valores por defecto cuando no hay query', () => {
    const p = getPagination(mockReq({}));
    expect(p).toEqual({ page: 1, pageSize: 20, skip: 0, take: 20 });
  });

  it('calcula skip correctamente', () => {
    const p = getPagination(mockReq({ page: '3', pageSize: '10' }));
    expect(p).toEqual({ page: 3, pageSize: 10, skip: 20, take: 10 });
  });

  it('limita pageSize a un máximo de 100', () => {
    expect(getPagination(mockReq({ pageSize: '9999' })).pageSize).toBe(100);
  });

  it('normaliza valores inválidos o negativos', () => {
    expect(getPagination(mockReq({ page: '-5', pageSize: '0' })).page).toBe(1);
    expect(getPagination(mockReq({ page: 'abc' })).page).toBe(1);
  });
});

describe('buildPaginationMeta', () => {
  it('calcula totalPages con redondeo hacia arriba', () => {
    expect(buildPaginationMeta(1, 20, 45)).toEqual({ page: 1, pageSize: 20, total: 45, totalPages: 3 });
  });

  it('devuelve 0 páginas cuando no hay resultados', () => {
    expect(buildPaginationMeta(1, 20, 0).totalPages).toBe(0);
  });
});
