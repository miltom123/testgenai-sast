import { describe, it, expect } from 'vitest';
import { CryptoVault } from '../src/common/security/crypto-vault';

describe('CryptoVault AES-256-GCM', () => {
  it('restaura el texto con etiqueta de autenticación de 16 bytes', () => {
    const value = 'Token de prueba sin datos reales';
    expect(CryptoVault.decrypt(CryptoVault.encrypt(value))).toBe(value);
  });

  it('rechaza una etiqueta de autenticación alterada y un payload incompleto', () => {
    const payload = Buffer.from(CryptoVault.encrypt('prueba'), 'base64');
    payload[16] ^= 1;
    expect(() => CryptoVault.decrypt(payload.toString('base64'))).toThrow();
    expect(() => CryptoVault.decrypt('AA==')).toThrow();
  });
});
