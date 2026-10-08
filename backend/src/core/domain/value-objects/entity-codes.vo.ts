// ==========================================================================
// Value Objects: TestCasePriority & Entity Codes (TestCaseCode, RequirementCode)
// ==========================================================================

export type PriorityLevel = 'high' | 'medium' | 'low';

export class TestCasePriority {
  public static readonly HIGH = new TestCasePriority('high');
  public static readonly MEDIUM = new TestCasePriority('medium');
  public static readonly LOW = new TestCasePriority('low');

  private constructor(private readonly level: PriorityLevel) {}

  public static from(raw?: string | null): TestCasePriority {
    if (!raw) return this.MEDIUM;
    const norm = raw.trim().toLowerCase();
    if (norm === 'high' || norm === 'alta') return this.HIGH;
    if (norm === 'low' || norm === 'baja') return this.LOW;
    return this.MEDIUM;
  }

  public getLevel(): PriorityLevel {
    return this.level;
  }

  public getNumericWeight(): number {
    switch (this.level) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  public isHigh(): boolean {
    return this.level === 'high';
  }

  public equals(other: TestCasePriority): boolean {
    return this.level === other.level;
  }

  public toString(): string {
    return this.level;
  }
}

export class TestCaseCode {
  private constructor(private readonly code: string) {
    if (!code || code.trim().length === 0) {
      throw new Error('[TestCaseCode] El código del caso no puede ser vacío.');
    }
  }

  public static from(raw: string): TestCaseCode {
    const trimmed = raw.trim().toUpperCase();
    return new TestCaseCode(trimmed);
  }

  public getValue(): string {
    return this.code;
  }

  public equals(other: TestCaseCode): boolean {
    return this.code === other.code;
  }

  public toString(): string {
    return this.code;
  }
}

export class RequirementCode {
  private constructor(private readonly code: string) {
    if (!code || code.trim().length === 0) {
      throw new Error('[RequirementCode] El código del requisito no puede ser vacío.');
    }
  }

  public static from(raw: string): RequirementCode {
    const trimmed = raw.trim().toUpperCase();
    return new RequirementCode(trimmed);
  }

  public getValue(): string {
    return this.code;
  }

  public equals(other: RequirementCode): boolean {
    return this.code === other.code;
  }

  public toString(): string {
    return this.code;
  }
}
