import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../src/common/utils/retry';

describe('withRetry', () => {
  it('devuelve el resultado al primer intento exitoso', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { retries: 2, timeoutMs: 1000, label: 'test' });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('reintenta ante fallos y termina con éxito', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('transitorio'))
      .mockResolvedValueOnce('recuperado');
    const result = await withRetry(fn, { retries: 3, timeoutMs: 1000, label: 'test' });
    expect(result).toBe('recuperado');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('propaga el error tras agotar los reintentos', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('siempre falla'));
    await expect(withRetry(fn, { retries: 1, timeoutMs: 1000, label: 'test' })).rejects.toThrow(
      'siempre falla'
    );
    expect(fn).toHaveBeenCalledTimes(2); // 1 intento + 1 reintento
  });

  it('pasa un AbortSignal a la función', async () => {
    const fn = vi.fn().mockImplementation((signal: AbortSignal) => {
      expect(signal).toBeInstanceOf(AbortSignal);
      return Promise.resolve('ok');
    });
    await withRetry(fn, { retries: 0, timeoutMs: 1000 });
    expect(fn).toHaveBeenCalled();
  });
});
