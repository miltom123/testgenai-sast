import { describe, it, expect } from 'vitest';
import { buildCsv, buildMarkdown, buildJson, safeFilename, ExportProject } from '../src/modules/export/export.service';

const project: ExportProject = {
  id: 'p1',
  name: 'Proyecto Demo',
  description: 'Un proyecto de prueba',
  requirements: [
    {
      id: 'r1',
      code: 'REQ-001',
      title: 'Login',
      description: 'El usuario inicia sesión',
      acceptanceCriteria: 'Credenciales válidas',
      version: 1,
      testCases: [
        {
          code: 'CP-001',
          type: 'positive',
          title: 'Login exitoso',
          preconditions: JSON.stringify(['Usuario existe']),
          steps: JSON.stringify(['Ingresar credenciales', 'Enviar']),
          testData: 'user/pass',
          expectedResult: 'Accede al sistema',
          priority: 'high',
          evidenceStatus: 'derived',
          evidenceText: null,
          status: 'APPROVED',
        },
      ],
    },
  ],
};

describe('export.service', () => {
  it('buildCsv genera encabezado y una fila por caso', () => {
    const csv = buildCsv(project);
    const lines = csv.split('\n');
    expect(lines[0]).toContain('ID_Requisito');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('CP-001');
    expect(lines[1]).toContain('Ingresar credenciales; Enviar');
  });

  it('buildCsv escapa comillas correctamente', () => {
    const withQuotes: ExportProject = {
      ...project,
      requirements: [
        {
          ...project.requirements[0],
          testCases: [{ ...project.requirements[0].testCases[0], title: 'Caso "especial"' }],
        },
      ],
    };
    expect(buildCsv(withQuotes)).toContain('""especial""');
  });

  it('buildMarkdown incluye título del proyecto y del caso', () => {
    const md = buildMarkdown(project, false);
    expect(md).toContain('# Especificación de Casos de Prueba — Proyecto Demo');
    expect(md).toContain('#### CP-001: Login exitoso');
  });

  it('buildJson deserializa steps y preconditions', () => {
    const json = buildJson(project);
    expect(json.requirements[0].testCases[0].steps).toEqual(['Ingresar credenciales', 'Enviar']);
  });

  it('safeFilename elimina espacios y caracteres no válidos', () => {
    expect(safeFilename('Mi Proyecto / 2026')).toBe('Mi_Proyecto__2026');
  });
});
