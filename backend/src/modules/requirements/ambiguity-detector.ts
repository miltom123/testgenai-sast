// ==========================================================================
// RF-13: Detección Básica de Ambigüedad en Requisitos
// Identifica términos subjetivos, cláusulas abiertas y falta de criterios verificables.
// ==========================================================================

export interface AmbiguityIssue {
  rule: string;
  category: 'VAGUE_TERM' | 'UNVERIFIABLE' | 'COMPOUND' | 'MISSING_ACTOR';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  snippet: string;
  explanation: string;
  suggestion: string;
}

export interface AmbiguityAnalysisResult {
  hasWarnings: boolean;
  warningsCount: number;
  issues: AmbiguityIssue[];
}

export class AmbiguityDetector {
  private static readonly VAGUE_TERMS = [
    {
      regex: /\b(f[aá]cil(?:mente)?|sencill[oa]|intuitiv[oa])\b/gi,
      rule: 'TERMINO_SUBJETIVO',
      explanation: 'Término subjetivo no medible. Especifique métricas de usabilidad o pasos permitidos.',
      suggestion: 'Defina una regla explícita en lugar de un calificativo subjetivo.',
    },
    {
      regex: /\b(r[aá]pido|inmediato|lo antes posible|prontamente|alta velocidad)\b/gi,
      rule: 'RENDIMIENTO_SUBJETIVO',
      explanation: 'Criterio temporal no verificable. Indique un tiempo máximo en segundos o milisegundos.',
      suggestion: 'Especifique el tiempo máximo aceptable (ej. "en menos de 2 segundos").',
    },
    {
      regex: /\b(aproximadamente|alrededor de|cerca de|m[aá]s o menos)\b/gi,
      rule: 'APROXIMACION',
      explanation: 'Falta de precisión en valores numéricos.',
      suggestion: 'Defina límites o tolerancias exactas.',
    },
    {
      regex: /\b(etc(?:[.]|\b)|entre otr[oa]s|y dem[aá]s|similares)\b/gi,
      rule: 'LISTA_ABIERTA',
      explanation: 'Cláusula abierta que oculta alcance no especificado.',
      suggestion: 'Enumere todos los elementos o escenarios exhaustivamente.',
    },
    {
      regex: /\b(normalmente|generalmente|com[uú]nmente|frecuentemente|a menudo)\b/gi,
      rule: 'COMPORTAMIENTO_INDEFINIDO',
      explanation: 'No especifica qué ocurre en casos excepcionales.',
      suggestion: 'Defina qué ocurre en el flujo normal y en las excepciones.',
    },
    {
      regex: /\b(eficiente|robusto|seguro|amigable|adecuad[oa]|apropiad[oa])\b/gi,
      rule: 'CALIDAD_NO_MEDIBLE',
      explanation: 'Calificativo abstracto no verificable.',
      suggestion: 'Especifique el protocolo, estándar o comportamiento concreto esperado.',
    },
    {
      regex: /\b(debe ser posible|se deber[ií]a poder|podr[ií]a)\b/gi,
      rule: 'OBLIGATORIEDAD_DEBIL',
      explanation: 'Verbo condicional débil o ambiguo.',
      suggestion: 'Utilice declaraciones firmes: "El sistema debe..." o "El usuario debe...".',
    },
  ];

  /**
   * Analiza un requisito y sus criterios para alertar al tester sobre posibles ambigüedades.
   */
  public static analyze(description: string, acceptanceCriteria: string): AmbiguityAnalysisResult {
    const fullText = `${description || ''}\n${acceptanceCriteria || ''}`.trim();
    const issues: AmbiguityIssue[] = [];

    // 1. Detección de términos vagos
    for (const item of this.VAGUE_TERMS) {
      let match: RegExpExecArray | null;
      // Reiniciar regex con flag 'g'
      item.regex.lastIndex = 0;
      while ((match = item.regex.exec(fullText)) !== null) {
        issues.push({
          rule: item.rule,
          category: 'VAGUE_TERM',
          severity: 'HIGH',
          snippet: match[0],
          explanation: item.explanation,
          suggestion: item.suggestion,
        });
      }
    }

    // 2. Verificabilidad básica
    const hasNumbers = /\d+/.test(fullText);
    const hasStructure = /(?:dado|cuando|entonces|criterio|debe|si|esperado)/i.test(fullText);
    if (!hasNumbers && !hasStructure && fullText.length > 20) {
      issues.push({
        rule: 'SIN_CRITERIO_VERIFICABLE',
        category: 'UNVERIFIABLE',
        severity: 'MEDIUM',
        snippet: description.slice(0, 80),
        explanation: 'El requisito no presenta valores cuantitativos, condiciones explícitas ni criterios verificables.',
        suggestion: 'Añada valores frontera, límites esperados o reglas de negocio comprobables.',
      });
    }

    // 3. Sujeto / Actor explícito
    const hasActor = /(?:usuario|administrador|cliente|sistema|operador|tester|rol|api|servicio)/i.test(fullText);
    if (!hasActor && fullText.length > 20) {
      issues.push({
        rule: 'ACTOR_NO_IDENTIFICADO',
        category: 'MISSING_ACTOR',
        severity: 'LOW',
        snippet: description.slice(0, 60),
        explanation: 'No se identifica con claridad el rol o entidad responsable de la acción.',
        suggestion: 'Especifique el rol del usuario o componente del sistema involucrado.',
      });
    }

    return {
      hasWarnings: issues.length > 0,
      warningsCount: issues.length,
      issues,
    };
  }
}
