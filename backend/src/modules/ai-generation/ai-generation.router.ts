import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { sendSuccess } from '../../common/utils/api-response';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { assertProjectAccess, assertRequirementAccess } from '../../common/utils/ownership';
import { GenerateTestCasesUseCase } from '../../application/use-cases/generate-test-cases.use-case';

export const aiGenerationRouter = Router();

aiGenerationRouter.use(authenticateJWT);

const generateSchema = z.object({
  requirementId: z.string().uuid('ID de requisito inválido'),
  provider: z.enum(['gemini', 'openai']).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  useCache: z.boolean().optional().default(true),
});

// POST /api/v1/ai/generate - Generación y regeneración con IA real
aiGenerationRouter.post(
  '/generate',
  asyncHandler(async (req: Request, res: Response) => {
    const { requirementId, provider, model, temperature, useCache } = generateSchema.parse(req.body);

    const useCase = new GenerateTestCasesUseCase();
    const result = await useCase.execute({
      requirementId,
      userId: req.user!.userId,
      userRole: req.user!.role,
      provider,
      model,
      temperature,
      useCache,
    });

    const isFromCache = result.generation.cached;
    return sendSuccess(
      res,
      {
        fromCache: isFromCache,
        audit: result.generation,
        testCases: result.cases,
        duplicateWarnings: result.duplicateWarnings,
      },
      isFromCache
        ? 'Generación idéntica reutilizada desde caché (0 tokens adicionales)'
        : `Se generaron ${result.cases.length} casos de prueba con éxito (${result.generation.provider} / ${result.generation.model})`,
      isFromCache ? 200 : 201
    );
  })
);

// GET /api/v1/ai/history/:requirementId - Historial de llamadas de IA de un requisito
aiGenerationRouter.get(
  '/history/:requirementId',
  asyncHandler(async (req: Request, res: Response) => {
    await assertRequirementAccess(req.params.requirementId, req.user!.userId, req.user!.role);
    const history = await prisma.aiGeneration.findMany({
      where: { requirementId: req.params.requirementId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        _count: { select: { testCases: true } },
      },
    });
    return sendSuccess(res, history);
  })
);

// GET /api/v1/ai/history/project/:projectId - Historial de ejecuciones de IA de todo el proyecto
aiGenerationRouter.get(
  '/history/project/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.projectId, req.user!.userId, req.user!.role);
    const history = await prisma.aiGeneration.findMany({
      where: { requirement: { projectId: req.params.projectId } },
      orderBy: { createdAt: 'desc' },
      include: {
        requirement: { select: { id: true, code: true, title: true } },
        user: { select: { id: true, fullName: true } },
        _count: { select: { testCases: true } },
      },
    });
    return sendSuccess(res, history);
  })
);
