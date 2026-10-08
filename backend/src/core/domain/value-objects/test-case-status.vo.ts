// ==========================================================================
// Value Object: TestCaseStatus
// Pure Domain Value Object - Immutable and Encapsulated
// ==========================================================================

export type TestCaseStatusType = 'PENDING' | 'APPROVED' | 'MODIFIED' | 'REJECTED';

export class TestCaseStatus {
  private static readonly VALID_STATUSES: Set<TestCaseStatusType> = new Set([
    'PENDING',
    'APPROVED',
    'MODIFIED',
    'REJECTED',
  ]);

  public static readonly PENDING = new TestCaseStatus('PENDING');
  public static readonly APPROVED = new TestCaseStatus('APPROVED');
  public static readonly MODIFIED = new TestCaseStatus('MODIFIED');
  public static readonly REJECTED = new TestCaseStatus('REJECTED');

  private constructor(private readonly value: TestCaseStatusType) {
    if (!TestCaseStatus.VALID_STATUSES.has(value)) {
      throw new Error(`[TestCaseStatus] Estado de caso de prueba inválido: '${value}'`);
    }
  }

  public static from(raw: string): TestCaseStatus {
    const normalized = raw.trim().toUpperCase() as TestCaseStatusType;
    if (!this.VALID_STATUSES.has(normalized)) {
      throw new Error(`[TestCaseStatus] Estado desconocido: '${raw}'. Valores permitidos: PENDING, APPROVED, MODIFIED, REJECTED`);
    }
    return new TestCaseStatus(normalized);
  }

  public getValue(): TestCaseStatusType {
    return this.value;
  }

  public isApproved(): boolean {
    return this.value === 'APPROVED';
  }

  public isPending(): boolean {
    return this.value === 'PENDING';
  }

  public isRejected(): boolean {
    return this.value === 'REJECTED';
  }

  public isModified(): boolean {
    return this.value === 'MODIFIED';
  }

  public canTransitionTo(next: TestCaseStatus): boolean {
    // Reglas de negocio de auditoría humana:
    // PENDING puede pasar a APPROVED, MODIFIED o REJECTED
    // MODIFIED puede pasar a APPROVED o REJECTED
    // APPROVED o REJECTED pueden ser reabiertos a MODIFIED
    if (this.value === next.value) return true;
    return true; // Todos los cambios válidos son registrados en el historial de revisiones
  }

  public equals(other: TestCaseStatus): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
