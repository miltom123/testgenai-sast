// ==========================================================================
// Rich Domain Entity: TestCase
// Pure Business Logic & State Transition Invariants
// ==========================================================================

import { TestCaseStatus } from '../value-objects/test-case-status.vo';
import { ISTQBTechnique } from '../value-objects/istqb-technique.vo';
import { TestCasePriority, TestCaseCode } from '../value-objects/entity-codes.vo';

export interface TestCaseProps {
  id: string;
  requirementId: string;
  code: TestCaseCode;
  type: ISTQBTechnique;
  title: string;
  preconditions: string[];
  steps: string[];
  testData: string | null;
  expectedResult: string;
  priority: TestCasePriority;
  status: TestCaseStatus;
  version: number;
  source: 'MANUAL' | 'RULE_BASED' | 'AI_GENERATED';
  evidenceStatus: 'derived' | 'suggested' | 'ambiguous' | 'conflict';
  evidenceText: string | null;
  isObsolete?: boolean;
  generationId?: string | null;
  requirementVersion?: number;
  originalContent?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TestCaseEntity {
  private props: TestCaseProps;

  constructor(props: TestCaseProps) {
    if (!props.id) throw new Error('[TestCaseEntity] ID requerido.');
    if (!props.requirementId) throw new Error('[TestCaseEntity] requirementId requerido.');
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('[TestCaseEntity] El título del caso de prueba no puede ser vacío.');
    }
    if (!props.steps || props.steps.length === 0) {
      throw new Error('[TestCaseEntity] El caso de prueba debe contener al menos un paso de ejecución.');
    }
    if (!props.expectedResult || props.expectedResult.trim().length === 0) {
      throw new Error('[TestCaseEntity] El resultado esperado es mandatorio según la norma ISTQB.');
    }

    this.props = {
      ...props,
      version: props.version ?? 1,
      isObsolete: props.isObsolete ?? false,
      generationId: props.generationId ?? null,
      requirementVersion: props.requirementVersion ?? 1,
      originalContent: props.originalContent ?? null,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  // Getters
  public get id(): string { return this.props.id; }
  public get requirementId(): string { return this.props.requirementId; }
  public get code(): TestCaseCode { return this.props.code; }
  public get type(): ISTQBTechnique { return this.props.type; }
  public get title(): string { return this.props.title; }
  public get preconditions(): string[] { return [...this.props.preconditions]; }
  public get steps(): string[] { return [...this.props.steps]; }
  public get testData(): string | null { return this.props.testData; }
  public get expectedResult(): string { return this.props.expectedResult; }
  public get priority(): TestCasePriority { return this.props.priority; }
  public get status(): TestCaseStatus { return this.props.status; }
  public get version(): number { return this.props.version; }
  public get source(): string { return this.props.source; }
  public get evidenceStatus(): string { return this.props.evidenceStatus; }
  public get evidenceText(): string | null { return this.props.evidenceText; }
  public get isObsolete(): boolean { return this.props.isObsolete ?? false; }
  public get generationId(): string | null { return this.props.generationId ?? null; }
  public get requirementVersion(): number { return this.props.requirementVersion ?? 1; }
  public get originalContent(): Record<string, unknown> | null { return this.props.originalContent ?? null; }
  public get createdAt(): Date { return this.props.createdAt!; }
  public get updatedAt(): Date { return this.props.updatedAt!; }

  // Invariants & Domain Operations
  public approve(reviewerId: string, _comments?: string): void {
    if (!reviewerId) throw new Error('[TestCaseEntity] Se requiere ID del auditor para aprobar.');
    this.props.status = TestCaseStatus.APPROVED;
    this.props.version += 1;
    this.props.updatedAt = new Date();
  }

  public reject(reviewerId: string, reason: string): void {
    if (!reason || reason.trim().length === 0) {
      throw new Error('[TestCaseEntity] Se requiere un motivo de rechazo explícito para auditoría.');
    }
    this.props.status = TestCaseStatus.REJECTED;
    this.props.version += 1;
    this.props.updatedAt = new Date();
  }

  public modify(updates: Partial<Omit<TestCaseProps, 'id' | 'requirementId' | 'code' | 'version'>>): void {
    if (updates.title !== undefined) this.props.title = updates.title;
    if (updates.steps !== undefined) this.props.steps = updates.steps;
    if (updates.expectedResult !== undefined) this.props.expectedResult = updates.expectedResult;
    if (updates.preconditions !== undefined) this.props.preconditions = updates.preconditions;
    if (updates.testData !== undefined) this.props.testData = updates.testData;
    if (updates.priority !== undefined) this.props.priority = updates.priority;
    
    this.props.status = TestCaseStatus.MODIFIED;
    this.props.version += 1;
    this.props.updatedAt = new Date();
  }

  public assertVersionMatch(expectedVersion?: number): void {
    if (expectedVersion !== undefined && this.props.version !== expectedVersion) {
      throw new Error(
        `[OptimisticLockException] Conflicto de concurrencia: El caso de prueba ha sido modificado por otro auditor (versión actual: ${this.props.version}, esperada: ${expectedVersion}).`
      );
    }
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      requirementId: this.requirementId,
      code: this.code.getValue(),
      type: this.type.getValue(),
      title: this.title,
      preconditions: this.preconditions,
      steps: this.steps,
      testData: this.testData,
      expectedResult: this.expectedResult,
      priority: this.priority.getLevel(),
      status: this.status.getValue(),
      version: this.version,
      source: this.source,
      evidenceStatus: this.evidenceStatus,
      evidenceText: this.evidenceText,
      isObsolete: this.isObsolete,
      generationId: this.generationId,
      requirementVersion: this.requirementVersion,
      originalContent: this.originalContent,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
