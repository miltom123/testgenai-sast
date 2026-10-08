import { TestCaseEntity } from '../entities/test-case.entity';
import { TestCaseStatus } from '../value-objects/test-case-status.vo';
import { ISTQBTechnique } from '../value-objects/istqb-technique.vo';
import { TestCasePriority, TestCaseCode } from '../value-objects/entity-codes.vo';
import { safeJsonArray, safeJsonObject } from '../../../common/utils/json';

type JsonInput = string | number | boolean | null | { [key: string]: unknown } | unknown[];

export interface PrismaTestCaseRow {
  id: string;
  requirementId: string;
  code: string;
  type: string;
  title: string;
  preconditions: unknown;
  steps: unknown;
  testData: string | null;
  expectedResult: string;
  priority: string;
  status: string;
  version?: number;
  source: string;
  evidenceStatus: string;
  evidenceText: string | null;
  isObsolete?: boolean;
  generationId?: string | null;
  requirementVersion?: number;
  originalContent?: unknown;
  createdAt: Date;
  updatedAt: Date;
  reviews?: Array<{
    id: string;
    decision: string;
    comments: string | null;
    previousContent: unknown;
    newContent: unknown;
    createdAt: Date;
    reviewer?: { id: string; fullName: string; role: string };
  }>;
}

export class TestCaseMapper {
  /** Convierte un registro de Prisma a la Entidad Rica de Dominio */
  public static toDomain(row: PrismaTestCaseRow): TestCaseEntity {
    return new TestCaseEntity({
      id: row.id,
      requirementId: row.requirementId,
      code: TestCaseCode.from(row.code),
      type: ISTQBTechnique.from(row.type),
      title: row.title,
      preconditions: safeJsonArray(row.preconditions) as string[],
      steps: safeJsonArray(row.steps) as string[],
      testData: row.testData,
      expectedResult: row.expectedResult,
      priority: TestCasePriority.from(row.priority),
      status: TestCaseStatus.from(row.status),
      version: row.version ?? 1,
      source: (row.source as 'MANUAL' | 'RULE_BASED' | 'AI_GENERATED') || 'MANUAL',
      evidenceStatus: (row.evidenceStatus as 'derived' | 'suggested' | 'ambiguous' | 'conflict') || 'derived',
      evidenceText: row.evidenceText,
      isObsolete: row.isObsolete ?? false,
      generationId: row.generationId ?? null,
      requirementVersion: row.requirementVersion ?? 1,
      originalContent: row.originalContent ? (safeJsonObject(row.originalContent) as Record<string, unknown>) : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /** Convierte una Entidad de Dominio al formato de persistencia de Prisma */
  public static toPersistence(entity: TestCaseEntity) {
    return {
      id: entity.id,
      requirementId: entity.requirementId,
      code: entity.code.getValue(),
      type: entity.type.getValue(),
      title: entity.title,
      preconditions: entity.preconditions as unknown as JsonInput,
      steps: entity.steps as unknown as JsonInput,
      testData: entity.testData,
      expectedResult: entity.expectedResult,
      priority: entity.priority.getLevel(),
      status: entity.status.getValue(),
      version: entity.version,
      source: entity.source,
      evidenceStatus: entity.evidenceStatus,
      evidenceText: entity.evidenceText,
      isObsolete: entity.isObsolete,
      generationId: entity.generationId,
      requirementVersion: entity.requirementVersion,
      originalContent: (entity.originalContent ?? undefined) as JsonInput | undefined,
      updatedAt: entity.updatedAt,
    };
  }

  /** Formatea un registro de Prisma a DTO limpio para respuestas HTTP de API */
  public static toDTO(row: PrismaTestCaseRow) {
    return {
      id: row.id,
      requirementId: row.requirementId,
      code: row.code,
      type: row.type,
      title: row.title,
      preconditions: safeJsonArray(row.preconditions),
      steps: safeJsonArray(row.steps),
      testData: row.testData,
      expectedResult: row.expectedResult,
      priority: row.priority,
      status: row.status,
      version: row.version ?? 1,
      isObsolete: row.isObsolete ?? false,
      generationId: row.generationId ?? null,
      requirementVersion: row.requirementVersion ?? 1,
      source: row.source,
      evidenceStatus: row.evidenceStatus,
      evidenceText: row.evidenceText,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      reviews: row.reviews?.map((r) => ({
        id: r.id,
        decision: r.decision,
        comments: r.comments,
        previousContent: safeJsonObject(r.previousContent),
        newContent: safeJsonObject(r.newContent),
        createdAt: r.createdAt,
        reviewer: r.reviewer,
      })),
    };
  }
}
