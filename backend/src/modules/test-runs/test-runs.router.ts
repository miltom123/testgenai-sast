// ==============================================================================
// Module: TestRunsRouter (Mejoras 41, 42, 43, 44, 45, 46)
// Endpoints de API para Ciclos de Ejecución de Pruebas.
// ==============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { assertProjectAccess } from '../../common/utils/ownership';
import { sendSuccess } from '../../common/utils/api-response';
import { TestRunsService, ExecutionStatus } from './test-runs.service';

export const testRunsRouter = Router();

testRunsRouter.use(authenticateJWT);

// GET /api/v1/test-runs/compare?runA=...&runB=... - Mejora 45: Comparador Histórico
testRunsRouter.get(
  '/compare',
  asyncHandler(async (req: Request, res: Response) => {
    const { runA, runB } = req.query;
    if (!runA || !runB) {
      return res.status(400).json({ success: false, error: 'Debe especificar runA y runB en los parámetros.' });
    }
    const comparison = await TestRunsService.compareRuns(String(runA), String(runB));
    return sendSuccess(res, comparison, 'Comparativa de ejecuciones completada');
  })
);

// POST /api/v1/test-runs - Mejora 41: Crear nuevo ciclo de ejecución
testRunsRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      projectId: z.string().uuid(),
      name: z.string().min(3),
      environment: z.string().optional(),
      caseIds: z.array(z.string().uuid()).optional(),
    });

    const { projectId, name, environment, caseIds } = schema.parse(req.body);
    await assertProjectAccess(projectId, req.user!.userId, req.user!.role);

    const run = await TestRunsService.createRun(projectId, name, environment, caseIds);
    return sendSuccess(res, run, 'Ciclo de ejecución iniciado exitosamente', 201);
  })
);

// GET /api/v1/test-runs/project/:projectId - Listar ciclos de un proyecto
testRunsRouter.get(
  '/project/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.projectId, req.user!.userId, req.user!.role);
    const runs = await TestRunsService.listRunsByProject(req.params.projectId);
    return sendSuccess(res, runs);
  })
);

// GET /api/v1/test-runs/:id - Detalle de un ciclo
testRunsRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const run = await TestRunsService.getRun(req.params.id);
    await assertProjectAccess(run.projectId, req.user!.userId, req.user!.role);
    return sendSuccess(res, run);
  })
);

// GET /api/v1/test-runs/:id/metrics - Mejora 44: Métricas en Tiempo Real
testRunsRouter.get(
  '/:id/metrics',
  asyncHandler(async (req: Request, res: Response) => {
    const run = await TestRunsService.getRun(req.params.id);
    await assertProjectAccess(run.projectId, req.user!.userId, req.user!.role);
    const metrics = await TestRunsService.getRunMetrics(req.params.id);
    return sendSuccess(res, metrics);
  })
);

// PATCH /api/v1/test-runs/:id/cases/:caseId - Mejora 43 & 46: Registrar resultado de caso con tiempo y logs
testRunsRouter.patch(
  '/:id/cases/:caseId',
  asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      status: z.enum(['PASSED', 'FAILED', 'BLOCKED', 'SKIPPED']),
      durationSeconds: z.number().nonnegative().optional(),
      evidenceText: z.string().optional(),
    });

    const { status, durationSeconds, evidenceText } = schema.parse(req.body);
    const run = await TestRunsService.getRun(req.params.id);
    await assertProjectAccess(run.projectId, req.user!.userId, req.user!.role);

    const result = await TestRunsService.recordExecution(
      req.params.id,
      req.params.caseId,
      status as ExecutionStatus,
      durationSeconds,
      evidenceText,
      req.user!.email
    );

    return sendSuccess(res, result, 'Resultado de ejecución registrado');
  })
);

// POST /api/v1/test-runs/:id/cases/:caseId/defect - Mejora 42: Registro de defecto con 1 clic
testRunsRouter.post(
  '/:id/cases/:caseId/defect',
  asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      defectNotes: z.string().min(3),
    });

    const { defectNotes } = schema.parse(req.body);
    const run = await TestRunsService.getRun(req.params.id);
    await assertProjectAccess(run.projectId, req.user!.userId, req.user!.role);

    const defect = await TestRunsService.logDefectFromRun(
      req.params.id,
      req.params.caseId,
      defectNotes,
      req.user!.userId
    );

    return sendSuccess(res, defect, 'Defecto registrado exitosamente desde la ejecución', 201);
  })
);
