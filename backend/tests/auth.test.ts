import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Reproduce la política de contraseña del router de auth para verificarla de forma aislada.
const strongPassword = z
  .string()
  .min(8)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/);

describe('Política de contraseña', () => {
  it('acepta una contraseña fuerte', () => {
    expect(strongPassword.safeParse('Abcdef12').success).toBe(true);
  });

  it('rechaza contraseñas demasiado cortas', () => {
    expect(strongPassword.safeParse('Ab1').success).toBe(false);
  });

  it('rechaza contraseñas sin mayúscula', () => {
    expect(strongPassword.safeParse('abcdef12').success).toBe(false);
  });

  it('rechaza contraseñas sin dígito', () => {
    expect(strongPassword.safeParse('Abcdefgh').success).toBe(false);
  });
});
