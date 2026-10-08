// ==========================================================================
// RF-14: Detección Básica de Duplicados Potenciales
// Compara títulos, pasos y resultados normalizados para alertar al QA.
// Nunca elimina casos automáticamente: el QA toma la decisión final.
// ==========================================================================

export interface TestCaseComparable {
  id?: string;
  code?: string;
  title: string;
  steps: string[] | string;
  expectedResult: string;
}

export interface DuplicateCandidate {
  caseCodeA: string;
  caseCodeB: string;
  caseTitleA: string;
  caseTitleB: string;
  similarityScore: number; // 0 a 1.0
  reason: 'EXACT_MATCH' | 'HIGH_SIMILARITY' | 'IDENTICAL_STEPS_AND_RESULT';
}

export class DuplicateDetector {
  /**
   * Normaliza una cadena de texto (minúsculas, sin acentos, sin puntuación redundante, espacios colapsados).
   */
  public static normalizeText(text: string): string {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
      .replace(/[^a-z0-9\s]/g, ' ') // Quitar signos de puntuación
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Convierte los pasos a una cadena normalizada unificada.
   */
  private static normalizeSteps(steps: string[] | string): string {
    if (Array.isArray(steps)) {
      return steps.map((s) => this.normalizeText(s)).join(' ');
    }
    return this.normalizeText(steps);
  }

  /**
   * Coeficiente de similitud de Jaccard sobre conjuntos de n-gramas de palabras (3-palabras / tokens).
   */
  public static calculateSimilarity(textA: string, textB: string): number {
    const tokensA = new Set(this.normalizeText(textA).split(' ').filter(Boolean));
    const tokensB = new Set(this.normalizeText(textB).split(' ').filter(Boolean));

    if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
    if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

    let intersectionCount = 0;
    tokensA.forEach((token) => {
      if (tokensB.has(token)) intersectionCount++;
    });

    const unionSize = tokensA.size + tokensB.size - intersectionCount;
    return unionSize > 0 ? Math.round((intersectionCount / unionSize) * 100) / 100 : 0;
  }

  /**
   * Encuentra candidatos a duplicados dentro de un conjunto de casos de prueba.
   * Umbral por defecto: similitud >= 0.85
   */
  public static findDuplicates(cases: TestCaseComparable[], threshold = 0.85): DuplicateCandidate[] {
    const candidates: DuplicateCandidate[] = [];

    for (let i = 0; i < cases.length; i++) {
      for (let j = i + 1; j < cases.length; j++) {
        const a = cases[i];
        const b = cases[j];

        const normTitleA = this.normalizeText(a.title);
        const normTitleB = this.normalizeText(b.title);

        const normStepsA = this.normalizeSteps(a.steps);
        const normStepsB = this.normalizeSteps(b.steps);

        const normResultA = this.normalizeText(a.expectedResult);
        const normResultB = this.normalizeText(b.expectedResult);

        // 1. Coincidencia exacta de título
        if (normTitleA === normTitleB && normTitleA.length > 5) {
          candidates.push({
            caseCodeA: a.code || `Caso ${i + 1}`,
            caseCodeB: b.code || `Caso ${j + 1}`,
            caseTitleA: a.title,
            caseTitleB: b.title,
            similarityScore: 1.0,
            reason: 'EXACT_MATCH',
          });
          continue;
        }

        // 2. Pasos y resultado idénticos
        if (normStepsA === normStepsB && normResultA === normResultB && normStepsA.length > 10) {
          candidates.push({
            caseCodeA: a.code || `Caso ${i + 1}`,
            caseCodeB: b.code || `Caso ${j + 1}`,
            caseTitleA: a.title,
            caseTitleB: b.title,
            similarityScore: 0.95,
            reason: 'IDENTICAL_STEPS_AND_RESULT',
          });
          continue;
        }

        // 3. Similitud léxica alta de título combinado con resultado
        const combinedA = `${normTitleA} ${normResultA}`;
        const combinedB = `${normTitleB} ${normResultB}`;
        const sim = this.calculateSimilarity(combinedA, combinedB);

        if (sim >= threshold) {
          candidates.push({
            caseCodeA: a.code || `Caso ${i + 1}`,
            caseCodeB: b.code || `Caso ${j + 1}`,
            caseTitleA: a.title,
            caseTitleB: b.title,
            similarityScore: sim,
            reason: 'HIGH_SIMILARITY',
          });
        }
      }
    }

    return candidates;
  }
}
