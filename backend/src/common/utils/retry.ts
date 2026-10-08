import { logger } from './logger';

export interface RetryOptions {
  retries: number;
  timeoutMs: number;
  label?: string;
}

/** Espera cancelable. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Ejecuta una operación async con timeout y reintentos con backoff exponencial.
 * `fn` recibe un AbortSignal que se dispara al agotarse el timeout de cada intento,
 * de modo que las llamadas fetch/HTTP puedan abortarse de verdad.
 */
export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  { retries, timeoutMs, label = 'operación' }: RetryOptions
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fn(controller.signal);
    } catch (err) {
      lastError = err;
      const isLast = attempt === retries;
      logger.warn(
        { attempt: attempt + 1, of: retries + 1, label, err: (err as Error)?.message },
        `Fallo en ${label}${isLast ? ' (sin más reintentos)' : ', reintentando...'}`
      );
      if (isLast) break;
      // Backoff exponencial: 300ms, 600ms, 1200ms...
      await sleep(300 * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Fallo en ${label}`);
}
