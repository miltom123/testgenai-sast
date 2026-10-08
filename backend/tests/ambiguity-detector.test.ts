import { describe, it, expect } from 'vitest';
import { AmbiguityDetector } from '../src/modules/requirements/ambiguity-detector';

describe('AmbiguityDetector (RF-13)', () => {
  it('detecta términos vagos y cláusulas abiertas', () => {
    const text = 'El sistema debe ser muy rápido, fácil e intuitivo para cualquier usuario y procesar pagos etc.';
    const criteria = 'Debe responder aproximadamente en poco tiempo.';

    const report = AmbiguityDetector.analyze(text, criteria);

    expect(report.hasWarnings).toBe(true);
    expect(report.warningsCount).toBeGreaterThan(0);
    expect(report.issues.some((i) => i.category === 'VAGUE_TERM')).toBe(true);
  });

  it('no genera advertencias para requisitos cuantitativos y estructurados', () => {
    const text = 'Autenticación mediante correo y clave';
    const criteria = 'Dado un usuario registrado con clave correcta, cuando presiona Entrar, entonces el sistema responde con HTTP 200 en menos de 500ms.';

    const report = AmbiguityDetector.analyze(text, criteria);

    expect(report.hasWarnings).toBe(false);
    expect(report.warningsCount).toBe(0);
  });
});
