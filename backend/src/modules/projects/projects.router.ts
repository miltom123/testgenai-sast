import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { sendSuccess, sendPaginated, getPagination, buildPaginationMeta } from '../../common/utils/api-response';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { assertProjectAccess } from '../../common/utils/ownership';
import { audit } from '../../common/utils/audit';
import { GetProjectsWithMetricsUseCase } from '../../application/use-cases/get-projects-with-metrics.use-case';
import { OpenApiImporterService } from '../../infrastructure/importers/openapi-importer.service';

export const projectsRouter = Router();

projectsRouter.use(authenticateJWT);

const createProjectSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim(),
  description: z.string().optional(),
  budgetUsd: z.number().min(0).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  budgetUsd: z.number().min(0).optional().nullable(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

// GET /api/v1/projects - Lista paginada de proyectos con métricas consolidadas
projectsRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, skip, take } = getPagination(req);
    const useCase = new GetProjectsWithMetricsUseCase();
    const { items, total } = await useCase.execute({
      userId: req.user!.userId,
      userRole: req.user!.role,
      skip,
      take,
    });

    return sendPaginated(res, items, buildPaginationMeta(page, pageSize, total));
  })
);

// POST /api/v1/projects - Crear nuevo proyecto
projectsRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const data = createProjectSchema.parse(req.body);
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        budgetUsd: data.budgetUsd,
        ownerId: req.user!.userId,
        status: 'ACTIVE',
      },
    });
    audit(req, 'PROJECT_CREATED', { projectId: project.id, name: project.name });
    return sendSuccess(res, project, 'Proyecto creado con éxito', 201);
  })
);

// GET /api/v1/projects/:id - Detalle de un proyecto con sus requisitos activos
projectsRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.id, req.user!.userId, req.user!.role);
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        requirements: {
          orderBy: { code: 'asc' },
          include: {
            _count: { select: { testCases: true, aiGenerations: true } },
          },
        },
      },
    });
    return sendSuccess(res, project);
  })
);

// PUT /api/v1/projects/:id - Actualización de proyecto
projectsRouter.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.id, req.user!.userId, req.user!.role);
    const data = updateProjectSchema.parse(req.body);
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data,
    });
    audit(req, 'PROJECT_UPDATED', { projectId: project.id });
    return sendSuccess(res, project, 'Proyecto actualizado con éxito');
  })
);

// PATCH /api/v1/projects/:id/archive - Archivar proyecto
projectsRouter.patch(
  '/:id/archive',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.id, req.user!.userId, req.user!.role);
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { status: 'ARCHIVED' },
    });
    audit(req, 'PROJECT_ARCHIVED', { projectId: project.id });
    return sendSuccess(res, project, 'Proyecto archivado exitosamente');
  })
);

// POST /api/v1/projects/:id/import-openapi - Mejora 63: Importador OpenAPI 3.0 / Swagger
projectsRouter.post(
  '/:id/import-openapi',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.id, req.user!.userId, req.user!.role);
    const schema = z.object({
      spec: z.record(z.unknown()),
    });
    const { spec } = schema.parse(req.body);
    const result = await OpenApiImporterService.importOpenApiSpec(req.params.id, spec);
    audit(req, 'OPENAPI_SPEC_IMPORTED', { projectId: req.params.id, count: result.totalEndpointsImported });
    return sendSuccess(res, result, `Se importaron ${result.totalEndpointsImported} endpoints como requisitos y pruebas`, 201);
  })
);

