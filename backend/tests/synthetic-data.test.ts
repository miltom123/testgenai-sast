import { describe, it, expect } from 'vitest';
import { SyntheticDataEngine } from '../src/core/test-design/synthetic-data';

describe('Datos sintéticos de tarjetas', () => {
  it('genera números que satisfacen Luhn para las cinco marcas soportadas', () => {
    const brands = ['visa','mastercard','amex','diners','jcb'] as const;
    for (const brand of brands) {
      for (let attempt=0; attempt<5; attempt++) {
        const data = SyntheticDataEngine.generateLuhnCard(brand,true);
        expect(SyntheticDataEngine.validateLuhn(data.cardNumber)).toBe(true);
      }
    }
  });
  it('genera un dígito de control inválido cuando el escenario es negativo', () => {
    expect(SyntheticDataEngine.validateLuhn(SyntheticDataEngine.generateLuhnCard('visa',false).cardNumber)).toBe(false);
  });
});
