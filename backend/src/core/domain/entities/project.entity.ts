// ==========================================================================
// Domain Entity: ProjectEntity
// Encapsulates Project Business Rules & Invariants
// ==========================================================================

export interface ProjectEntityProps {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  status: 'ACTIVE' | 'ARCHIVED';
  budgetUsd?: number | null;
  nextRequirementNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ProjectEntity {
  public readonly id: string;
  private _name: string;
  private _description: string | null;
  public readonly ownerId: string;
  private _status: 'ACTIVE' | 'ARCHIVED';
  private _budgetUsd: number | null;
  private _nextRequirementNumber: number;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: ProjectEntityProps) {
    if (!props.name || props.name.trim().length < 2) {
      throw new Error('El nombre del proyecto debe tener al menos 2 caracteres.');
    }
    if (!props.ownerId) {
      throw new Error('El proyecto debe tener un propietario válido.');
    }

    this.id = props.id;
    this._name = props.name.trim();
    this._description = props.description ?? null;
    this.ownerId = props.ownerId;
    this._status = props.status ?? 'ACTIVE';
    this._budgetUsd = props.budgetUsd ?? null;
    this._nextRequirementNumber = props.nextRequirementNumber ?? 1;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get status(): 'ACTIVE' | 'ARCHIVED' {
    return this._status;
  }

  get budgetUsd(): number | null {
    return this._budgetUsd;
  }

  get nextRequirementNumber(): number {
    return this._nextRequirementNumber;
  }

  public isActive(): boolean {
    return this._status === 'ACTIVE';
  }

  public isArchived(): boolean {
    return this._status === 'ARCHIVED';
  }

  public archive(): void {
    if (this._status === 'ARCHIVED') {
      throw new Error('El proyecto ya se encuentra archivado.');
    }
    this._status = 'ARCHIVED';
  }

  public reactivate(): void {
    this._status = 'ACTIVE';
  }

  public updateDetails(name: string, description?: string | null, budgetUsd?: number | null): void {
    if (this.isArchived()) {
      throw new Error('No se puede modificar un proyecto archivado. Reactívelo primero.');
    }
    if (!name || name.trim().length < 2) {
      throw new Error('El nombre del proyecto debe tener al menos 2 caracteres.');
    }
    this._name = name.trim();
    if (description !== undefined) this._description = description;
    if (budgetUsd !== undefined) this._budgetUsd = budgetUsd;
  }

  public allocateNextRequirementCode(): string {
    const code = `REQ-${String(this._nextRequirementNumber).padStart(3, '0')}`;
    this._nextRequirementNumber += 1;
    return code;
  }
}
