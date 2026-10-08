// ==========================================================================
// Value Object: ISTQBTechnique
// Pure Domain Value Object for Testing Heuristics & Techniques
// ==========================================================================

export type ISTQBTechniqueType =
  | 'positive'
  | 'negative'
  | 'boundary'
  | 'validation'
  | 'alternative'
  | 'decision-table'
  | 'state-transition'
  | 'pairwise'
  | 'ctm'
  | 'error-guessing';

export class ISTQBTechnique {
  private static readonly VALID_TECHNIQUES: Set<string> = new Set([
    'positive',
    'negative',
    'boundary',
    'validation',
    'alternative',
    'decision-table',
    'state-transition',
    'pairwise',
    'ctm',
    'error-guessing',
  ]);

  public static readonly POSITIVE = new ISTQBTechnique('positive');
  public static readonly NEGATIVE = new ISTQBTechnique('negative');
  public static readonly BOUNDARY = new ISTQBTechnique('boundary');
  public static readonly VALIDATION = new ISTQBTechnique('validation');
  public static readonly ALTERNATIVE = new ISTQBTechnique('alternative');
  public static readonly DECISION_TABLE = new ISTQBTechnique('decision-table');
  public static readonly STATE_TRANSITION = new ISTQBTechnique('state-transition');
  public static readonly PAIRWISE = new ISTQBTechnique('pairwise');
  public static readonly CTM = new ISTQBTechnique('ctm');
  public static readonly ERROR_GUESSING = new ISTQBTechnique('error-guessing');

  private constructor(private readonly value: ISTQBTechniqueType) {
    if (!ISTQBTechnique.VALID_TECHNIQUES.has(value)) {
      throw new Error(`[ISTQBTechnique] Técnica ISTQB inválida: '${value}'`);
    }
  }

  public static from(raw: string): ISTQBTechnique {
    const normalized = raw.trim().toLowerCase() as ISTQBTechniqueType;
    if (!this.VALID_TECHNIQUES.has(normalized)) {
      // Normalización inteligente de etiquetas comunes
      if (normalized.includes('bva') || normalized.includes('limite')) return this.BOUNDARY;
      if (normalized.includes('negativ') || normalized.includes('security')) return this.NEGATIVE;
      if (normalized.includes('decision')) return this.DECISION_TABLE;
      if (normalized.includes('state') || normalized.includes('transicion')) return this.STATE_TRANSITION;
      if (normalized.includes('pair')) return this.PAIRWISE;
      return this.POSITIVE;
    }
    return new ISTQBTechnique(normalized);
  }

  public getValue(): ISTQBTechniqueType {
    return this.value;
  }

  public isBoundary(): boolean {
    return this.value === 'boundary';
  }

  public isCombinatorial(): boolean {
    return this.value === 'decision-table' || this.value === 'pairwise' || this.value === 'ctm';
  }

  public isStateTransition(): boolean {
    return this.value === 'state-transition';
  }

  public isSecurityOrNegative(): boolean {
    return this.value === 'negative';
  }

  public isBlackBox(): boolean {
    return this.value !== 'error-guessing';
  }

  public isExperienceBased(): boolean {
    return this.value === 'error-guessing';
  }

  public equals(other: ISTQBTechnique): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
