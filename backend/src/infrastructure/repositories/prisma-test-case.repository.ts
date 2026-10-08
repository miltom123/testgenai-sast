// ==========================================================================
// Infrastructure: PrismaTestCaseRepository
// Implements ITestCaseRepository with Atomic Transactions & Clean Mapping
// ==========================================================================

import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';
import {
  ITestCaseRepository,
  PaginationOptions,
  PaginatedResult,
} from '../../core/ports/test-case-repository.port';
import { TestCaseEntity } from '../../core/domain/entities/test-case.entity';
import { TestCaseMapper, PrismaTestCaseRow } from '../../core/domain/mappers/test-case.mapper';

export class PrismaTestCaseRepository implements ITestCaseRepository {
  private readonly reviewsInclude = {
    reviews: {
      orderBy: { createdAt: 'desc' as const },
      include: { reviewer: { select: { id: true, fullName: true, role: true } } },
    },
  };

  public async findById(id: string): Promise<TestCaseEntity | null> {
    const row = await prisma.testCase.findUnique({
      where: { id },
      include: this.reviewsInclude,
    });
    if (!row) return null;
    return TestCaseMapper.toDomain(row as PrismaTestCaseRow);
  }

  public async findByRequirementId(requirementId: string): Promise<TestCaseEntity[]> {
    const rows = await prisma.testCase.findMany({
      where: { requirementId },
      orderBy: { code: 'asc' },
      include: this.reviewsInclude,
    });
    return rows.map((r) => TestCaseMapper.toDomain(r as PrismaTestCaseRow));
  }

  public async findByProjectId(
    projectId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<TestCaseEntity>> {
    const where = { requirement: { projectId } };
    const skip = options?.skip ?? 0;
    const take = options?.take ?? 50;

    const [total, rows] = await Promise.all([
      prisma.testCase.count({ where }),
      prisma.testCase.findMany({
        where,
        orderBy: { code: 'asc' },
        skip,
        take,
        include: {
          requirement: { select: { id: true, code: true, title: true } },
          ...this.reviewsInclude,
        },
      }),
    ]);

    return {
      items: rows.map((r) => TestCaseMapper.toDomain(r as PrismaTestCaseRow)),
      total,
    };
  }

  public async save(testCase: TestCaseEntity): Promise<void> {
    const data = TestCaseMapper.toPersistence(testCase) as Prisma.TestCaseUncheckedCreateInput;
    await prisma.testCase.upsert({
      where: { id: testCase.id },
      create: data,
      update: data,
    });
  }

  public async saveBatch(testCases: TestCaseEntity[]): Promise<void> {
    if (testCases.length === 0) return;

    // Ejecución transaccional atómica (ACID)
    await prisma.$transaction(
      testCases.map((tc) => {
        const data = TestCaseMapper.toPersistence(tc) as Prisma.TestCaseUncheckedCreateInput;
        return prisma.testCase.upsert({
          where: { id: tc.id },
          create: data,
          update: data,
        });
      })
    );
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await prisma.testCase.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

