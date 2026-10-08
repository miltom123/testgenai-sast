// ==========================================================================
// Infrastructure: PrismaTestRunRepository
// PostgreSQL Persistence for Test Runs & Executions
// ==========================================================================

import { prisma } from '../../config/prisma';
import { ITestRunRepository } from '../../core/ports/test-run-repository.port';
import { TestRunEntity, TestExecutionResultProps } from '../../core/domain/entities/test-run.entity';

export class PrismaTestRunRepository implements ITestRunRepository {
  public async findById(id: string): Promise<TestRunEntity | null> {
    const row = await prisma.testRun.findUnique({
      where: { id },
      include: {
        executions: { orderBy: { code: 'asc' } },
      },
    });
    if (!row) return null;

    return new TestRunEntity({
      id: row.id,
      projectId: row.projectId,
      name: row.name,
      environment: row.environment,
      status: row.status as 'IN_PROGRESS' | 'COMPLETED',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      executions: row.executions.map((e) => ({
        id: e.id,
        testRunId: e.testRunId,
        testCaseId: e.testCaseId,
        code: e.code,
        title: e.title,
        status: e.status as any,
        durationSeconds: e.durationSeconds,
        executedAt: e.executedAt,
        executedBy: e.executedBy,
        evidenceText: e.evidenceText,
        defectNotes: e.defectNotes,
        defectLogged: e.defectLogged,
      })),
    });
  }

  public async findByProjectId(projectId: string): Promise<TestRunEntity[]> {
    const rows = await prisma.testRun.findMany({
      where: { projectId },
      include: {
        executions: { orderBy: { code: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(
      (row) =>
        new TestRunEntity({
          id: row.id,
          projectId: row.projectId,
          name: row.name,
          environment: row.environment,
          status: row.status as 'IN_PROGRESS' | 'COMPLETED',
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          executions: row.executions.map((e) => ({
            id: e.id,
            testRunId: e.testRunId,
            testCaseId: e.testCaseId,
            code: e.code,
            title: e.title,
            status: e.status as any,
            durationSeconds: e.durationSeconds,
            executedAt: e.executedAt,
            executedBy: e.executedBy,
            evidenceText: e.evidenceText,
            defectNotes: e.defectNotes,
            defectLogged: e.defectLogged,
          })),
        })
    );
  }

  public async create(
    run: TestRunEntity,
    initialCases: Array<{ testCaseId: string; code: string; title: string }>
  ): Promise<TestRunEntity> {
    const createdRun = await prisma.testRun.create({
      data: {
        id: run.id,
        projectId: run.projectId,
        name: run.name,
        environment: run.environment,
        status: run.status,
        executions: {
          createMany: {
            data: initialCases.map((c) => ({
              testCaseId: c.testCaseId,
              code: c.code,
              title: c.title,
              status: 'PENDING',
              durationSeconds: 0,
            })),
          },
        },
      },
      include: {
        executions: { orderBy: { code: 'asc' } },
      },
    });

    return new TestRunEntity({
      id: createdRun.id,
      projectId: createdRun.projectId,
      name: createdRun.name,
      environment: createdRun.environment,
      status: createdRun.status as 'IN_PROGRESS' | 'COMPLETED',
      createdAt: createdRun.createdAt,
      updatedAt: createdRun.updatedAt,
      executions: createdRun.executions.map((e) => ({
        id: e.id,
        testRunId: e.testRunId,
        testCaseId: e.testCaseId,
        code: e.code,
        title: e.title,
        status: e.status as any,
        durationSeconds: e.durationSeconds,
        executedAt: e.executedAt,
        executedBy: e.executedBy,
        evidenceText: e.evidenceText,
        defectNotes: e.defectNotes,
        defectLogged: e.defectLogged,
      })),
    });
  }

  public async recordExecution(
    runId: string,
    caseId: string,
    status: string,
    durationSeconds: number,
    evidenceText?: string,
    executedBy?: string
  ): Promise<TestExecutionResultProps> {
    const execution = await prisma.testExecutionResult.findFirstOrThrow({
      where: {
        testRunId: runId,
        testCaseId: caseId,
      },
    });

    const updated = await prisma.testExecutionResult.update({
      where: { id: execution.id },
      data: {
        status,
        durationSeconds,
        executedAt: new Date(),
        executedBy: executedBy || 'QA Tester',
        evidenceText: evidenceText !== undefined ? evidenceText : execution.evidenceText,
      },
    });

    await prisma.testRun.update({
      where: { id: runId },
      data: { updatedAt: new Date() },
    });

    return {
      id: updated.id,
      testRunId: updated.testRunId,
      testCaseId: updated.testCaseId,
      code: updated.code,
      title: updated.title,
      status: updated.status as any,
      durationSeconds: updated.durationSeconds,
      executedAt: updated.executedAt,
      executedBy: updated.executedBy,
      evidenceText: updated.evidenceText,
      defectNotes: updated.defectNotes,
      defectLogged: updated.defectLogged,
    };
  }

  public async logDefect(
    runId: string,
    caseId: string,
    defectNotes: string
  ): Promise<TestExecutionResultProps> {
    const execution = await prisma.testExecutionResult.findFirstOrThrow({
      where: {
        testRunId: runId,
        testCaseId: caseId,
      },
    });

    const updated = await prisma.testExecutionResult.update({
      where: { id: execution.id },
      data: {
        defectLogged: true,
        defectNotes,
      },
    });

    return {
      id: updated.id,
      testRunId: updated.testRunId,
      testCaseId: updated.testCaseId,
      code: updated.code,
      title: updated.title,
      status: updated.status as any,
      durationSeconds: updated.durationSeconds,
      executedAt: updated.executedAt,
      executedBy: updated.executedBy,
      evidenceText: updated.evidenceText,
      defectNotes: updated.defectNotes,
      defectLogged: updated.defectLogged,
    };
  }
}
