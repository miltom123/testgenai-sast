// ==========================================================================
// Domain Entity: RequirementEntity
// Encapsulates Requirement Invariants & Versioning Rules
// ==========================================================================

export interface RequirementEntityProps {
  id: string;
  projectId: string;
  code: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  version: number;
  status: 'READY_FOR_AI' | 'GENERATED' | 'OBSOLETE';
  nextCaseNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

export class RequirementEntity {
  public readonly id: string;
  public readonly projectId: string;
  public readonly code: string;
  private _title: string;
  private _description: string;
  private _acceptanceCriteria: string;
  private _version: number;
  private _status: 'READY_FOR_AI' | 'GENERATED' | 'OBSOLETE';
  private _nextCaseNumber: number;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: RequirementEntityProps) {
    if (!props.title || props.title.trim().length < 3) {
      throw new Error('El título del requisito debe tener al menos 3 caracteres.');
    }
    if (!props.description || props.description.trim().length < 5) {
      throw new Error('La descripción del requisito debe tener al menos 5 caracteres.');
    }

    this.id = props.id;
    this.projectId = props.projectId;
    this.code = props.code;
    this._title = props.title.trim();
    this._description = props.description.trim();
    this._acceptanceCriteria = props.acceptanceCriteria.trim();
    this._version = props.version ?? 1;
    this._status = props.status ?? 'READY_FOR_AI';
    this._nextCaseNumber = props.nextCaseNumber ?? 1;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get acceptanceCriteria(): string {
    return this._acceptanceCriteria;
  }

  get version(): number {
    return this._version;
  }

  get status(): 'READY_FOR_AI' | 'GENERATED' | 'OBSOLETE' {
    return this._status;
  }

  get nextCaseNumber(): number {
    return this._nextCaseNumber;
  }

  public updateContent(title: string, description: string, acceptanceCriteria: string): void {
    if (this._status === 'OBSOLETE') {
      throw new Error('No se puede modificar un requisito obsoleto.');
    }
    this._title = title.trim();
    this._description = description.trim();
    this._acceptanceCriteria = acceptanceCriteria.trim();
    this._version += 1;
  }

  public markAsGenerated(): void {
    this._status = 'GENERATED';
  }

  public markAsObsolete(): void {
    this._status = 'OBSOLETE';
  }

  public allocateNextCaseCode(): string {
    const code = `CP-${String(this._nextCaseNumber).padStart(3, '0')}`;
    this._nextCaseNumber += 1;
    return code;
  }
}
