// ==========================================================================
// Infrastructure: PrismaRequirementRepository
// PostgreSQL Persistence for Requirement Domain
// ==========================================================================

import { prisma } from '../../config/prisma';
import { IRequirementRepository } from '../../core/ports/requirement-repository.port';
import { RequirementEntity } from '../../core/domain/entities/requirement.entity';
import { PaginationOptions, PaginatedResult } from '../../core/ports/test-case-repository.port';

export class PrismaRequirementRepository implements IRequirementRepository {
  public async findById(id: string): Promise<RequirementEntity | null> {
    const row = await prisma.requirement.findUnique({
      where: { id },
    });
    if (!row) return null;
    return new RequirementEntity({
      id: row.id,
      projectId: row.projectId,
      code: row.code,
      title: row.title,
      description: row.description,
      acceptanceCriteria: row.acceptanceCriteria,
      version: row.version,
      status: row.status as 'READY_FOR_AI' | 'GENERATED' | 'OBSOLETE',
      nextCaseNumber: row.nextCaseNumber,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  public async findByProjectId(
    projectId: string,
    options?: PaginationOptions,
    statusFilter?: string
  ): Promise<PaginatedResult<RequirementEntity>> {
    const where: Record<string, unknown> = { projectId };
    if (statusFilter) where.status = statusFilter;

    const skip = options?.skip ?? 0;
    const take = options?.take ?? 50;

    const [total, rows] = await Promise.all([
      prisma.requirement.count({ where }),
      prisma.requirement.findMany({
        where,
        orderBy: { code: 'asc' },
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map(
        (row) =>
          new RequirementEntity({
            id: row.id,
            projectId: row.projectId,
            code: row.code,
            title: row.title,
            description: row.description,
            acceptanceCriteria: row.acceptanceCriteria,
            version: row.version,
            status: row.status as 'READY_FOR_AI' | 'GENERATED' | 'OBSOLETE',
            nextCaseNumber: row.nextCaseNumber,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          })
      ),
      total,
    };
  }

  public async save(requirement: RequirementEntity): Promise<void> {
    await prisma.requirement.upsert({
      where: { id: requirement.id },
      create: {
        id: requirement.id,
        projectId: requirement.projectId,
        code: requirement.code,
        title: requirement.title,
        description: requirement.description,
        acceptanceCriteria: requirement.acceptanceCriteria,
        version: requirement.version,
        status: requirement.status,
        nextCaseNumber: requirement.nextCaseNumber,
      },
      update: {
        title: requirement.title,
        description: requirement.description,
        acceptanceCriteria: requirement.acceptanceCriteria,
        version: requirement.version,
        status: requirement.status,
        nextCaseNumber: requirement.nextCaseNumber,
      },
    });
  }

  public async createVersion(requirementId: string, authorId: string, summary: string): Promise<number> {
    const req = await prisma.requirement.findUniqueOrThrow({ where: { id: requirementId } });
    const versionRecord = await prisma.requirementVersion.create({
      data: {
        requirementId,
        version: req.version,
        title: req.title,
        description: req.description,
        acceptanceCriteria: req.acceptanceCriteria,
        authorId,
        changeSummary: summary,
      },
    });
    return versionRecord.version;
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await prisma.requirement.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
