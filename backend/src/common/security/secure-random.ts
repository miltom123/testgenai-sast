import { randomInt } from 'node:crypto';

/** Fracción aleatoria con origen criptográfico, en el intervalo [0, 1). */
export function secureRandomFraction(): number {
  return randomInt(0, 0x100000000) / 0x100000000;
}
