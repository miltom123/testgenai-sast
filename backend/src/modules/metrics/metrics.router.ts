import { Router, Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { sendSuccess } from '../../common/utils/api-response';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { assertProjectAccess } from '../../common/utils/ownership';
import { computeProjectMetrics } from './metrics.service';

export const metricsRouter = Router();

metricsRouter.use(authenticateJWT);

// GET /api/metrics/project/:projectId - Indicadores ISTQB y economía de IA del proyecto
metricsRouter.get(
  '/project/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    await assertProjectAccess(projectId, req.user!.userId, req.user!.role);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { requirements: { include: { testCases: true, aiGenerations: true } } },
    });

    // La lógica de cálculo vive en la capa de servicio (pura y testeable).
    const metrics = computeProjectMetrics(project!);
    return sendSuccess(res, metrics);
  })
);
