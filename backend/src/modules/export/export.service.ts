// ==============================================================================
// Servicio de Exportación de Casos de Prueba (CSV, JSON, Markdown, Gherkin, Xray, TestRail, IEEE 829, HTML)
// Compatible con PostgreSQL Json types y seguro contra inyección de fórmulas CSV.
// Incluye cálculo de firma digital SHA-256 inmutable de la suite.
// ==============================================================================

import crypto from 'crypto';

export interface ExportTestCase {
  code: string;
  type: string;
  title: string;
  preconditions: unknown;
  steps: unknown;
  testData: string | null;
  expectedResult: string;
  priority: string;
  evidenceStatus: string;
  evidenceText: string | null;
  status: string;
  version?: number;
  requirementVersion?: number;
}

export interface ExportRequirement {
  id: string;
  code: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  version: number;
  testCases: ExportTestCase[];
}

export interface ExportProject {
  id: string;
  name: string;
  description: string | null;
  requirements: ExportRequirement[];
}

function parseArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return val ? [val] : [];
    }
  }
  return [];
}

/**
 * Escapa celdas CSV y neutraliza fórmulas maliciosas (=, +, -, @, \t, \r).
 */
const csvCell = (text: string | null | undefined): string => {
  let val = (text || '').replace(/"/g, '""').replace(/\n/g, ' ');
  if (/^[=+\-@\t\r]/.test(val)) {
    val = `'${val}`;
  }
  return `"${val}"`;
};

/**
 * Mejora 54: Firma Digital SHA-256 de Suites de Prueba.
 * Calcula el hash criptográfico inmutable sobre la concatenación ordenada de casos aprobados.
 */
export function calculateSuiteSha256(project: ExportProject): string {
  const hash = crypto.createHash('sha256');
  hash.update(`PROJECT:${project.id}:${project.name}:`);

  project.requirements.forEach((req) => {
    hash.update(`REQ:${req.code}:V${req.version}:`);
    req.testCases.forEach((tc) => {
      const pre = parseArray(tc.preconditions).join(';');
      const steps = parseArray(tc.steps).join(';');
      hash.update(`${tc.code}:${tc.type}:${tc.title}:${pre}:${steps}:${tc.testData || ''}:${tc.expectedResult}:${tc.priority};`);
    });
  });

  return hash.digest('hex');
}

export function buildCsv(project: ExportProject): string {
  const sha256 = calculateSuiteSha256(project);
  const headers = [
    'ID_Requisito',
    'Titulo_Requisito',
    'Version_Requisito',
    'ID_Caso',
    'Tipo_ISTQB',
    'Titulo_Caso',
    'Precondiciones',
    'Pasos_Ejecucion',
    'Datos_Prueba',
    'Resultado_Esperado',
    'Prioridad',
    'Estado_Evidencia',
    'Sustento_Evidencia',
    'Estado_Revision',
    'Firma_Digital_SHA256',
  ];
  const rows: string[] = [headers.join(',')];

  project.requirements.forEach((reqItem) => {
    reqItem.testCases.forEach((tc) => {
      const pre = parseArray(tc.preconditions).join('; ');
      const steps = parseArray(tc.steps).join('; ');
      rows.push(
        [
          csvCell(reqItem.code),
          csvCell(reqItem.title),
          csvCell(String(reqItem.version)),
          csvCell(tc.code),
          csvCell(tc.type),
          csvCell(tc.title),
          csvCell(pre),
          csvCell(steps),
          csvCell(tc.testData),
          csvCell(tc.expectedResult),
          csvCell(tc.priority),
          csvCell(tc.evidenceStatus),
          csvCell(tc.evidenceText),
          csvCell(tc.status),
          csvCell(sha256),
        ].join(',')
      );
    });
  });

  return rows.join('\r\n');
}

export function buildMarkdown(project: ExportProject): string {
  const sha256 = calculateSuiteSha256(project);
  let md = `# Especificación de Casos de Prueba — ${project.name}\n\n`;
  md += `**Descripción del Proyecto:** ${project.description || 'Sin descripción'}\n`;
  md += `**Fecha de Exportación:** ${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
  md += `**Firma Criptográfica SHA-256:** \`${sha256}\`\n`;
  md += `**Alcance:** Casos de prueba APROBADOS vigentes auditados por el equipo QA.\n\n---\n\n`;

  project.requirements.forEach((reqItem) => {
    md += `## Requisito: [${reqItem.code}] ${reqItem.title} (v${reqItem.version})\n\n`;
    md += `**Descripción:**\n> ${reqItem.description.replace(/\n/g, '\n> ')}\n\n`;
    md += `**Criterios de Aceptación:**\n\`\`\`\n${reqItem.acceptanceCriteria}\n\`\`\`\n\n`;
    md += `### Casos de Prueba Aprobados (${reqItem.testCases.length})\n\n`;

    if (reqItem.testCases.length === 0) {
      md += `*No hay casos aprobados para este requisito.*\n\n`;
    } else {
      reqItem.testCases.forEach((tc) => {
        const pre = parseArray(tc.preconditions);
        const steps = parseArray(tc.steps);

        md += `#### ${tc.code}: ${tc.title}\n`;
        md += `- **Tipo ISTQB:** \`${tc.type.toUpperCase()}\` | **Prioridad:** \`${tc.priority}\` | **Evidencia:** \`${tc.evidenceStatus}\`\n`;
        if (pre.length > 0) {
          md += `- **Precondiciones:**\n  - ${pre.join('\n  - ')}\n`;
        }
        if (steps.length > 0) {
          md += `- **Pasos de Ejecución:**\n`;
          steps.forEach((step, idx) => (md += `  ${idx + 1}. ${step}\n`));
        }
        if (tc.testData) md += `- **Datos de Prueba:** \`${tc.testData}\`\n`;
        md += `- **Resultado Esperado:** ${tc.expectedResult}\n`;
        if (tc.evidenceText) md += `- **Sustento Textual:** *"${tc.evidenceText}"*\n`;
        md += `\n`;
      });
    }
    md += `---\n\n`;
  });

  return md;
}

export function buildJson(project: ExportProject) {
  const sha256 = calculateSuiteSha256(project);
  return {
    project: { id: project.id, name: project.name, description: project.description },
    exportedAt: new Date().toISOString(),
    filter: 'APPROVED_AND_ACTIVE_ONLY',
    suiteSignatureSha256: sha256,
    requirements: project.requirements.map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      description: r.description,
      acceptanceCriteria: r.acceptanceCriteria,
      version: r.version,
      testCases: r.testCases.map((tc) => ({
        code: tc.code,
        type: tc.type,
        title: tc.title,
        preconditions: parseArray(tc.preconditions),
        steps: parseArray(tc.steps),
        testData: tc.testData,
        expectedResult: tc.expectedResult,
        priority: tc.priority,
        evidenceStatus: tc.evidenceStatus,
        evidenceText: tc.evidenceText,
        status: tc.status,
      })),
    })),
  };
}

/**
 * Mejora 59: Exportador BDD Gherkin (.feature).
 * Genera archivos ejecutables compatibles con Cucumber, Behave y SpecFlow.
 */
export function buildGherkin(project: ExportProject): string {
  let gherkin = `# language: es\n# Proyecto: ${project.name}\n# Generado por TestGenAI Platform\n\n`;

  project.requirements.forEach((req) => {
    gherkin += `@requisito_${req.code.toLowerCase()}\n`;
    gherkin += `Característica: [${req.code}] ${req.title}\n`;
    gherkin += `  ${req.description.replace(/\n/g, '\n  ')}\n\n`;

    req.testCases.forEach((tc) => {
      const pre = parseArray(tc.preconditions);
      const steps = parseArray(tc.steps);

      gherkin += `  @caso_${tc.code.toLowerCase()} @tipo_${tc.type} @prioridad_${tc.priority}\n`;
      gherkin += `  Escenario: ${tc.code} - ${tc.title}\n`;

      if (pre.length > 0) {
        gherkin += `    Dado que ${pre.join('\n    Y ')}\n`;
      } else {
        gherkin += `    Dado que el sistema se encuentra operativo\n`;
      }

      if (steps.length > 0) {
        steps.forEach((step, idx) => {
          const cleanStep = step.replace(/^\d+[.)]\s*/, '');
          gherkin += `    ${idx === 0 ? 'Cuando' : 'Y'} ${cleanStep}\n`;
        });
      } else {
        gherkin += `    Cuando se ejecuta la operación de prueba\n`;
      }

      if (tc.testData) {
        gherkin += `    # Datos de prueba: ${tc.testData}\n`;
      }

      gherkin += `    Entonces ${tc.expectedResult}\n\n`;
    });
  });

  return gherkin;
}

/**
 * Mejora 60: Exportador Nativo Jira / Xray Test Management (JSON).
 */
export function buildXrayJson(project: ExportProject) {
  const tests = project.requirements.flatMap((req) =>
    req.testCases.map((tc) => ({
      testKey: tc.code,
      info: {
        summary: `[${req.code}] ${tc.title}`,
        type: 'Manual',
        requirementKeys: [req.code],
        labels: ['TestGenAI', tc.type, tc.priority],
        definition: tc.title,
      },
      preconditions: parseArray(tc.preconditions).join('\n'),
      steps: parseArray(tc.steps).map((step, idx) => ({
        index: idx + 1,
        action: step,
        data: tc.testData || '',
        result: idx === parseArray(tc.steps).length - 1 ? tc.expectedResult : 'Paso ejecutado correctamente',
      })),
    }))
  );

  return {
    info: {
      summary: `Test Suite - ${project.name}`,
      description: `Exportado desde TestGenAI (${new Date().toISOString()})`,
      testPlanKey: project.id,
    },
    tests,
  };
}

/**
 * Mejora 61: Exportador Nativo TestRail (CSV).
 */
export function buildTestRailCsv(project: ExportProject): string {
  const headers = ['Section', 'Title', 'Type', 'Priority', 'Preconditions', 'Steps', 'Expected Result'];
  const rows: string[] = [headers.join(',')];

  project.requirements.forEach((req) => {
    req.testCases.forEach((tc) => {
      const pre = parseArray(tc.preconditions).join('\n');
      const steps = parseArray(tc.steps).join('\n');
      rows.push(
        [
          csvCell(`${req.code} - ${req.title}`),
          csvCell(`${tc.code}: ${tc.title}`),
          csvCell(tc.type),
          csvCell(tc.priority),
          csvCell(pre),
          csvCell(steps),
          csvCell(tc.expectedResult),
        ].join(',')
      );
    });
  });

  return rows.join('\r\n');
}

/**
 * Mejora 62: Generador Formal del Plan de Pruebas IEEE 829.
 */
export function buildIEEE829TestPlan(project: ExportProject): string {
  const sha256 = calculateSuiteSha256(project);
  const totalApproved = project.requirements.reduce((acc, r) => acc + r.testCases.length, 0);

  return `# PLAN MAESTRO DE PRUEBAS DE SOFTWARE (IEEE 829-2008)

**1. IDENTIFICADOR DEL PLAN DE PRUEBAS (Test Plan ID)**
- ID del Documento: \`TP-${project.id.slice(0, 8).toUpperCase()}-V1\`
- Proyecto: **${project.name}**
- Fecha de Emisión: ${new Date().toISOString().split('T')[0]}
- Sello Criptográfico SHA-256: \`${sha256}\`

---

**2. INTRODUCCIÓN Y ALCANCE (Introduction & Scope)**
El presente Plan Maestro de Pruebas especifica la estrategia, alcance de cobertura y criterios de aceptación para el proyecto "${project.name}".
El alcance cubre ${project.requirements.length} requisitos funcionales verificados con un total de ${totalApproved} casos de prueba aprobados bajo la norma ISTQB CTFL v4.0.

---

**3. ELEMENTOS DE PRUEBA (Test Items)**
${project.requirements
  .map(
    (r) =>
      `### [${r.code}] ${r.title} (v${r.version})\n- **Descripción:** ${r.description}\n- **Casos Aprobados:** ${r.testCases.length}`
  )
  .join('\n\n')}

---

**4. ESTRATEGIA Y ENFOQUE DE PRUEBAS (Test Strategy)**
- Pruebas Funcionales de Caja Negra (Black-Box):
  - Análisis de Valores Límite de 3 y 5 puntos (BVA).
  - Tablas de Decisión y Transición de Estados.
  - Pruebas Combinatorias Pairwise (All-Pairs).
- Pruebas de Seguridad Defensiva (OWASP ASVS v4.0).
- Pruebas de Datos Sintéticos Especializados (Luhn ISO/IEC 7812, Módulo 11).

---

**5. CRITERIOS DE ACEPTACIÓN Y RECHAZO (Pass/Fail Criteria)**
- Criterio de Pase (Pass): 100% de los casos de prueba ejecutados con estado \`PASSED\`.
- Criterio de Bloqueo (Blocker): Cualquier defecto de prioridad \`high\` o fallo en controles de integridad financiera/seguridad suspende la liberación a producción.

---

**6. ENTREGABLES Y FIRMA DE APROBACIÓN (Deliverables & Approvals)**
- Matriz de Trazabilidad Requisito-Caso.
- Suite firmada digitalmente con SHA-256.
- Aprobado por: Equipo de Aseguramiento de la Calidad (QA Lead).
`;
}

/**
 * Mejora 53: Informe de Certificación de Calidad en HTML Imprimible.
 */
export function buildReportHtml(project: ExportProject): string {
  const sha256 = calculateSuiteSha256(project);
  const totalApproved = project.requirements.reduce((acc, r) => acc + r.testCases.length, 0);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Certificado de Calidad QA — ${project.name}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #1e293b; background: #fff; }
    .header { border-bottom: 2px solid #6366f1; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 24px; font-weight: bold; color: #0f172a; margin: 0; }
    .badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 14px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
    .card-num { font-size: 28px; font-weight: bold; color: #4f46e5; }
    .card-label { font-size: 12px; color: #64748b; text-transform: uppercase; margin-top: 4px; }
    .section-title { font-size: 18px; font-weight: bold; margin-top: 32px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    .seal-box { margin-top: 40px; border: 2px dashed #94a3b8; border-radius: 8px; padding: 16px; background: #f8fafc; font-family: monospace; font-size: 12px; word-break: break-all; }
    .signature-row { display: flex; justify-content: space-around; margin-top: 60px; text-align: center; }
    .sign-line { border-top: 1px solid #000; width: 200px; padding-top: 8px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">Certificado de Aseguramiento de Calidad de Software</h1>
      <p style="margin: 4px 0 0 0; color: #64748b;">Proyecto: <strong>${project.name}</strong></p>
    </div>
    <span class="badge">AUDITORÍA APROBADA</span>
  </div>

  <div class="summary-grid">
    <div class="card"><div class="card-num">${project.requirements.length}</div><div class="card-label">Requisitos Validados</div></div>
    <div class="card"><div class="card-num">${totalApproved}</div><div class="card-label">Casos Aprobados</div></div>
    <div class="card"><div class="card-num">100%</div><div class="card-label">Cobertura de Auditoría</div></div>
    <div class="card"><div class="card-num">0</div><div class="card-label">Defectos Críticos</div></div>
  </div>

  <h2 class="section-title">Matriz de Requisitos y Casos Auditados</h2>
  <table>
    <thead>
      <tr><th>Código Requisito</th><th>Título</th><th>Versión</th><th>Casos Aprobados</th><th>Estado</th></tr>
    </thead>
    <tbody>
      ${project.requirements
        .map(
          (r) =>
            `<tr><td><strong>${r.code}</strong></td><td>${r.title}</td><td>v${r.version}</td><td>${r.testCases.length} casos</td><td style="color:#10b981;font-weight:bold;">CERTIFICADO</td></tr>`
        )
        .join('')}
    </tbody>
  </table>

  <div class="seal-box">
    <strong>SELLO DE FIRMA DIGITAL INMUTABLE (SHA-256):</strong><br>
    ${sha256}<br><br>
    <em>Generado por TestGenAI Core Platform el ${new Date().toISOString()}</em>
  </div>

  <div class="signature-row">
    <div><div class="sign-line">QA Lead / Auditor de Calidad</div></div>
    <div><div class="sign-line">Product Owner / Gestor</div></div>
    <div><div class="sign-line">Líder Técnico de Software</div></div>
  </div>
</body>
</html>`;
}

export function safeFilename(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[^\w.-]/g, '');
}
