// ==========================================================================
// Módulo: Especificación Automática (/api/v1/spec)
// Previsualización y generación determinista de casos de uso, requisitos y
// casos de prueba a partir del nombre y la descripción del proyecto.
// ==========================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { sendSuccess } from '../../common/utils/api-response';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { ApiError } from '../../common/errors/api-error';
import { assertProjectAccess } from '../../common/utils/ownership';
import { audit } from '../../common/utils/audit';
import { GenerateProjectSpecUseCase } from '../../application/use-cases/generate-project-spec.use-case';
import {
  ACTOR_CATALOG,
  ALL_MODULES,
  DERIVATION_LIMITS,
  ENTITY_CATALOG,
  FALLBACK_MODULE_KEY,
  NON_FUNCTIONAL_TEMPLATES,
  ProjectSpecEngine,
  SPEC_ENGINE_VERSION,
  getCatalogStats,
} from '../../core/spec-engine';

export const specRouter = Router();

specRouter.use(authenticateJWT);

const depthSchema = z.enum(['basic', 'standard', 'exhaustive']);

const previewSchema = z.object({
  name: z.string().trim().max(200).optional().default(''),
  description: z
    .string()
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres para analizarla')
    .max(20000, 'La descripción no debe exceder 20000 caracteres'),
  depth: depthSchema.optional().default('standard'),
  includeNonFunctional: z.boolean().optional().default(true),
  includeEntityCrud: z.boolean().optional().default(true),
});

const generateSchema = z.object({
  projectId: z.string().uuid('ID de proyecto inválido'),
  name: z.string().trim().max(200).optional(),
  description: z.string().trim().max(20000).optional(),
  depth: depthSchema.optional().default('standard'),
  includeNonFunctional: z.boolean().optional().default(true),
  includeEntityCrud: z.boolean().optional().default(true),
});

// POST /api/v1/spec/preview - Análisis determinista sin persistir (vista previa)
specRouter.post(
  '/preview',
  asyncHandler(async (req: Request, res: Response) => {
    const body = previewSchema.parse(req.body);
    const specification = ProjectSpecEngine.analyze(
      { name: body.name, description: body.description },
      {
        depth: body.depth,
        includeNonFunctional: body.includeNonFunctional,
        includeEntityCrud: body.includeEntityCrud,
      }
    );

    return sendSuccess(
      res,
      specification,
      `Análisis completado: ${specification.summary.totalUseCases} casos de uso, ${specification.summary.totalRequirements} requisitos y ${specification.summary.estimatedTestCases} casos de prueba estimados`
    );
  })
);

// POST /api/v1/spec/generate - Genera y persiste la especificación completa del proyecto
specRouter.post(
  '/generate',
  asyncHandler(async (req: Request, res: Response) => {
    const body = generateSchema.parse(req.body);

    const useCase = new GenerateProjectSpecUseCase();
    const result = await useCase.execute({
      projectId: body.projectId,
      userId: req.user!.userId,
      userRole: req.user!.role,
      name: body.name,
      description: body.description,
      depth: body.depth,
      includeNonFunctional: body.includeNonFunctional,
      includeEntityCrud: body.includeEntityCrud,
    });

    audit(req, 'SPEC_GENERATED', {
      projectId: body.projectId,
      generationId: result.generationId,
      useCases: result.created.useCases,
      requirements: result.created.requirements,
      testCases: result.created.testCases,
    });

    return sendSuccess(
      res,
      result,
      `Se generaron ${result.created.useCases} casos de uso, ${result.created.requirements} requisitos y ${result.created.testCases} casos de prueba`,
      201
    );
  })
);

// GET /api/v1/spec/catalog - Capacidades del motor determinista (módulos, actores, entidades)
specRouter.get(
  '/catalog',
  asyncHandler(async (_req: Request, res: Response) => {
    const modules = ALL_MODULES.filter((m) => m.key !== FALLBACK_MODULE_KEY).map((m) => ({
      key: m.key,
      name: m.name,
      icon: m.icon,
      description: m.description,
      useCases: m.useCases.map((uc) => uc.name),
      requirementTemplates: m.useCases.reduce((acc, uc) => acc + uc.requirements.length, 0),
      sampleKeywords: m.keywords.slice(0, 6).map((k) => k.term),
    }));

    return sendSuccess(res, {
      engineVersion: SPEC_ENGINE_VERSION,
      mode: 'deterministic',
      depths: Object.entries(DERIVATION_LIMITS).map(([key, maxCasesPerRequirement]) => ({
        key,
        maxCasesPerRequirement,
      })),
      stats: getCatalogStats(),
      modules,
      nonFunctional: NON_FUNCTIONAL_TEMPLATES.map((n) => n.template.title),
      actors: ACTOR_CATALOG.map((a) => ({ key: a.key, label: a.label })),
      entities: ENTITY_CATALOG.map((e) => ({ key: e.key, singular: e.singular, plural: e.plural })),
    });
  })
);

// GET /api/v1/spec/use-cases/project/:projectId - Casos de uso del proyecto con sus requisitos
specRouter.get(
  '/use-cases/project/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.projectId, req.user!.userId, req.user!.role);
    const useCases = await prisma.useCase.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { code: 'asc' },
      include: {
        requirements: {
          orderBy: { code: 'asc' },
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            version: true,
            _count: { select: { testCases: true } },
          },
        },
      },
    });
    return sendSuccess(res, useCases);
  })
);

// GET /api/v1/spec/use-cases/:id - Detalle de un caso de uso
specRouter.get(
  '/use-cases/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const useCase = await prisma.useCase.findUnique({
      where: { id: req.params.id },
      include: {
        project: { select: { id: true, ownerId: true, name: true } },
        generation: { select: { id: true, engineVersion: true, depth: true, createdAt: true } },
        requirements: {
          orderBy: { code: 'asc' },
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            version: true,
            _count: { select: { testCases: true } },
          },
        },
      },
    });

    if (!useCase) throw ApiError.notFound('Caso de uso no encontrado');
    if (req.user!.role !== 'ADMIN' && useCase.project.ownerId !== req.user!.userId) {
      throw ApiError.notFound('Caso de uso no encontrado');
    }

    return sendSuccess(res, useCase);
  })
);

// GET /api/v1/spec/history/project/:projectId - Historial de generaciones automáticas del proyecto
specRouter.get(
  '/history/project/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.projectId, req.user!.userId, req.user!.role);
    const history = await prisma.specGeneration.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        _count: { select: { useCases: true } },
      },
    });
    return sendSuccess(res, history);
  })
);
