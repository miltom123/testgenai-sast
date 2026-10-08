// ==============================================================================
// Module: TestRunsService (Mejoras 41, 42, 43, 44, 45, 46)
// Ciclos de Ejecución de Pruebas, Registro de Defectos en 1 Clic,
// Métricas en Tiempo Real, Comparador Histórico y Temporizador por Caso.
// 100% PERSISTENTE EN POSTGRESQL (Sin estado volátil en RAM).
// ==============================================================================

import { prisma } from '../../config/prisma';
import { randomUUID } from 'node:crypto';
import { ApiError } from '../../common/errors/api-error';
import { PrismaTestRunRepository } from '../../infrastructure/repositories/prisma-test-run.repository';
import { TestRunEntity, ExecutionStatus, TestExecutionResultProps } from '../../core/domain/entities/test-run.entity';

export { ExecutionStatus, TestExecutionResultProps };

export interface TestCaseExecutionResult {
  testCaseId: string;
  code: string;
  title: string;
  status: ExecutionStatus;
  durationSeconds: number;
  executedAt: string | null;
  executedBy: string | null;
  evidenceText: string | null;
  defectNotes: string | null;
  defectLogged: boolean;
}

export interface TestRun {
  id: string;
  projectId: string;
  name: string;
  environment: string;
  createdAt: string;
  updatedAt: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  cases: TestCaseExecutionResult[];
}

const testRunRepo = new PrismaTestRunRepository();

function toLegacyTestRun(entity: TestRunEntity): TestRun {
  return {
    id: entity.id,
    projectId: entity.projectId,
    name: entity.name,
    environment: entity.environment,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    cases: entity.executions.map((e) => ({
      testCaseId: e.testCaseId,
      code: e.code,
      title: e.title,
      status: e.status,
      durationSeconds: e.durationSeconds || 0,
      executedAt: e.executedAt ? e.executedAt.toISOString() : null,
      executedBy: e.executedBy || null,
      evidenceText: e.evidenceText || null,
      defectNotes: e.defectNotes || null,
      defectLogged: Boolean(e.defectLogged),
    })),
  };
}

export class TestRunsService {
  /**
   * Crea un nuevo ciclo de ejecución (Test Run) para un proyecto y lo persiste en PostgreSQL.
   */
  public static async createRun(
    projectId: string,
    name: string,
    environment = 'QA Sandbox',
    caseIds?: string[]
  ): Promise<TestRun> {
    let where: Record<string, unknown> = {
      requirement: { projectId },
      status: 'APPROVED',
      isObsolete: false,
    };

    if (caseIds && caseIds.length > 0) {
      where = {
        requirement: { projectId },
        id: { in: caseIds },
        isObsolete: false,
      };
    }

    let testCases = await prisma.testCase.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    if (testCases.length === 0) {
      testCases = await prisma.testCase.findMany({
        where: {
          requirement: { projectId },
          isObsolete: false,
        },
        take: 50,
        orderBy: { code: 'asc' },
      });
    }

    if (testCases.length === 0) {
      throw ApiError.badRequest('No hay casos de prueba registrados en el proyecto para iniciar la ejecución.');
    }

    const now = new Date();
    const entity = new TestRunEntity({
      id: randomUUID(),
      projectId,
      name,
      environment,
      status: 'IN_PROGRESS',
      createdAt: now,
      updatedAt: now,
    });

    const initialCases = testCases.map((tc) => ({
      testCaseId: tc.id,
      code: tc.code,
      title: tc.title,
    }));

    const saved = await testRunRepo.create(entity, initialCases);
    return toLegacyTestRun(saved);
  }

  public static async getRun(runId: string): Promise<TestRun> {
    const entity = await testRunRepo.findById(runId);
    if (!entity) throw ApiError.notFound(`Ciclo de ejecución '${runId}' no encontrado.`);
    return toLegacyTestRun(entity);
  }

  public static async listRunsByProject(projectId: string): Promise<TestRun[]> {
    const runs = await testRunRepo.findByProjectId(projectId);
    return runs.map(toLegacyTestRun);
  }

  /**
   * Registra el resultado, duración en segundos y evidencia multimedia/logs en PostgreSQL.
   */
  public static async recordExecution(
    runId: string,
    caseId: string,
    status: ExecutionStatus,
    durationSeconds = 0,
    evidenceText?: string,
    executedBy = 'QA Tester'
  ): Promise<TestCaseExecutionResult> {
    const res = await testRunRepo.recordExecution(
      runId,
      caseId,
      status,
      durationSeconds,
      evidenceText,
      executedBy
    );

    return {
      testCaseId: res.testCaseId,
      code: res.code,
      title: res.title,
      status: res.status,
      durationSeconds: res.durationSeconds || 0,
      executedAt: res.executedAt ? res.executedAt.toISOString() : null,
      executedBy: res.executedBy || null,
      evidenceText: res.evidenceText || null,
      defectNotes: res.defectNotes || null,
      defectLogged: Boolean(res.defectLogged),
    };
  }

  /**
   * Registro de Defectos con 1 Clic desde el caso fallido.
   */
  public static async logDefectFromRun(
    runId: string,
    caseId: string,
    defectNotes: string,
    userId: string
  ) {
    const originalCase = await prisma.testCase.findUnique({
      where: { id: caseId },
      include: { requirement: true },
    });

    if (!originalCase) throw ApiError.notFound('Caso en base de datos no encontrado.');

    const updated = await testRunRepo.logDefect(runId, caseId, defectNotes);
    const run = await this.getRun(runId);

    const defectReport = {
      defectId: `DEF-${Date.now().toString().slice(-5)}`,
      testCaseCode: updated.code,
      requirementCode: originalCase.requirement.code,
      title: `[Fallo en Ejecución] ${updated.title}`,
      stepsToReproduce: originalCase.steps,
      expectedResult: originalCase.expectedResult,
      actualResult: defectNotes,
      evidence: updated.evidenceText || 'Sin traza adjunta',
      severity: originalCase.priority === 'high' ? 'CRITICAL' : 'MAJOR',
      environment: run.environment,
      reportedBy: userId,
      reportedAt: new Date().toISOString(),
    };

    return defectReport;
  }

  /**
   * Métricas de Ejecución en Tiempo Real.
   */
  public static async getRunMetrics(runId: string) {
    const entity = await testRunRepo.findById(runId);
    if (!entity) throw ApiError.notFound(`Ciclo de ejecución '${runId}' no encontrado.`);
    return entity.getMetrics();
  }

  /**
   * Comparador Histórico de Ejecuciones (Sprint A vs Sprint B).
   */
  public static async compareRuns(runIdA: string, runIdB: string) {
    const [entityA, entityB] = await Promise.all([
      testRunRepo.findById(runIdA),
      testRunRepo.findById(runIdB),
    ]);

    if (!entityA) throw ApiError.notFound(`Ciclo '${runIdA}' no encontrado.`);
    if (!entityB) throw ApiError.notFound(`Ciclo '${runIdB}' no encontrado.`);

    const metricsA = entityA.getMetrics();
    const metricsB = entityB.getMetrics();

    // Detectar casos que pasaron en A pero fallaron en B (Regresiones!)
    const regressions: Array<{ code: string; title: string }> = [];

    const mapA = new Map(entityA.executions.map((c) => [c.code, c.status]));
    entityB.executions.forEach((c) => {
      const prevStatus = mapA.get(c.code);
      if (prevStatus === 'PASSED' && c.status === 'FAILED') {
        regressions.push({ code: c.code, title: c.title });
      }
    });

    return {
      runA: metricsA,
      runB: metricsB,
      passRateDeltaPercent: parseFloat((metricsB.passRatePercent - metricsA.passRatePercent).toFixed(2)),
      detectedRegressionsCount: regressions.length,
      regressions,
    };
  }
}
