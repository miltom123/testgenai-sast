// ==========================================================================
// Infrastructure: PrismaProjectRepository
// PostgreSQL Persistence for Project Domain
// ==========================================================================

import { prisma } from '../../config/prisma';
import { IProjectRepository } from '../../core/ports/project-repository.port';
import { ProjectEntity } from '../../core/domain/entities/project.entity';
import { PaginationOptions, PaginatedResult } from '../../core/ports/test-case-repository.port';

export class PrismaProjectRepository implements IProjectRepository {
  public async findById(id: string): Promise<ProjectEntity | null> {
    const row = await prisma.project.findUnique({
      where: { id },
    });
    if (!row) return null;
    return new ProjectEntity({
      id: row.id,
      name: row.name,
      description: row.description,
      ownerId: row.ownerId,
      status: row.status as 'ACTIVE' | 'ARCHIVED',
      budgetUsd: row.budgetUsd,
      nextRequirementNumber: row.nextRequirementNumber,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  public async findByOwner(
    ownerId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<ProjectEntity>> {
    const where = { ownerId };
    const skip = options?.skip ?? 0;
    const take = options?.take ?? 50;

    const [total, rows] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map(
        (row) =>
          new ProjectEntity({
            id: row.id,
            name: row.name,
            description: row.description,
            ownerId: row.ownerId,
            status: row.status as 'ACTIVE' | 'ARCHIVED',
            budgetUsd: row.budgetUsd,
            nextRequirementNumber: row.nextRequirementNumber,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          })
      ),
      total,
    };
  }

  public async create(project: ProjectEntity): Promise<ProjectEntity> {
    const row = await prisma.project.create({
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        status: project.status,
        budgetUsd: project.budgetUsd,
        nextRequirementNumber: project.nextRequirementNumber,
      },
    });

    return new ProjectEntity({
      id: row.id,
      name: row.name,
      description: row.description,
      ownerId: row.ownerId,
      status: row.status as 'ACTIVE' | 'ARCHIVED',
      budgetUsd: row.budgetUsd,
      nextRequirementNumber: row.nextRequirementNumber,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  public async update(id: string, data: Partial<ProjectEntity>): Promise<ProjectEntity> {
    const row = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        budgetUsd: data.budgetUsd,
        status: data.status,
      },
    });

    return new ProjectEntity({
      id: row.id,
      name: row.name,
      description: row.description,
      ownerId: row.ownerId,
      status: row.status as 'ACTIVE' | 'ARCHIVED',
      budgetUsd: row.budgetUsd,
      nextRequirementNumber: row.nextRequirementNumber,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  public async archive(id: string): Promise<boolean> {
    await prisma.project.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    return true;
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await prisma.project.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
