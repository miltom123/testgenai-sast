// ==========================================================================
// Application Use Case: GetProjectsWithMetricsUseCase
// Agregación de métricas de cobertura ISTQB por proyecto
// Cobertura = Requisitos activos con al menos 1 caso APPROVED vigente / Requisitos activos
// ==========================================================================

import { prisma } from '../../config/prisma';

export interface GetProjectsInputDTO {
  userId: string;
  userRole: string;
  skip: number;
  take: number;
}

export interface ProjectStatsDTO {
  requirementsCount: number;
  totalTestCases: number;
  approvedTestCases: number;
  coveragePercent: number;
  totalCostUsd: number | null;
}

export interface ProjectDTO {
  id: string;
  name: string;
  description: string | null;
  status: string;
  budgetUsd: number | null;
  createdAt: Date;
  updatedAt: Date;
  stats: ProjectStatsDTO;
}

export interface GetProjectsOutputDTO {
  items: ProjectDTO[];
  total: number;
}

export class GetProjectsWithMetricsUseCase {
  public async execute(input: GetProjectsInputDTO): Promise<GetProjectsOutputDTO> {
    const { userId, userRole, skip, take } = input;
    const ownerFilter = userRole === 'ADMIN' ? {} : { ownerId: userId };

    const [total, projects] = await Promise.all([
      prisma.project.count({ where: ownerFilter }),
      prisma.project.findMany({
        where: ownerFilter,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          requirements: {
            where: { status: { not: 'OBSOLETE' } },
            select: {
              id: true,
              testCases: {
                where: { isObsolete: false },
                select: { status: true },
              },
              aiGenerations: {
                select: { estimatedCost: true, status: true },
              },
            },
          },
        },
      }),
    ]);

    const items: ProjectDTO[] = projects.map((p) => {
      const activeReqsCount = p.requirements.length;
      let totalTestCases = 0;
      let approvedTestCases = 0;
      let knownCostSum = 0;
      let hasAnyCost = false;
      let reqsWithApproved = 0;

      for (const r of p.requirements) {
        totalTestCases += r.testCases.length;
        let reqHasApproved = false;

        for (const tc of r.testCases) {
          if (tc.status === 'APPROVED') {
            approvedTestCases++;
            reqHasApproved = true;
          }
        }
        if (reqHasApproved) {
          reqsWithApproved++;
        }

        for (const gen of r.aiGenerations) {
          if (gen.estimatedCost !== null && gen.estimatedCost !== undefined) {
            knownCostSum += gen.estimatedCost;
            hasAnyCost = true;
          }
        }
      }

      const coveragePercent =
        activeReqsCount > 0 ? Math.round((reqsWithApproved / activeReqsCount) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        budgetUsd: p.budgetUsd,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        stats: {
          requirementsCount: activeReqsCount,
          totalTestCases,
          approvedTestCases,
          coveragePercent,
          totalCostUsd: hasAnyCost ? Math.round(knownCostSum * 10000) / 10000 : null,
        },
      };
    });

    return { items, total };
  }
}
