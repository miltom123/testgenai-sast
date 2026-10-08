import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { sendSuccess, sendPaginated, getPagination, buildPaginationMeta } from '../../common/utils/api-response';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { ApiError } from '../../common/errors/api-error';
import { assertProjectAccess, assertRequirementAccess } from '../../common/utils/ownership';
import { audit } from '../../common/utils/audit';
import { AmbiguityDetector } from './ambiguity-detector';
import { RequirementImportService, requirementImportRowSchema } from './import.service';
import { RequirementsQualityGate } from '../../core/test-design/requirements-quality-gate';

export const requirementsRouter = Router();

requirementsRouter.use(authenticateJWT);

const createRequirementSchema = z.object({
  projectId: z.string().uuid('ID de proyecto inválido'),
  code: z.string().min(2, 'Código requerido (ej. REQ-001)').optional(),
  title: z.string().min(3, 'Título debe tener al menos 3 caracteres'),
  description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  acceptanceCriteria: z.string().min(5, 'Los criterios de aceptación deben tener al menos 5 caracteres'),
});

const updateRequirementSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  acceptanceCriteria: z.string().min(5).optional(),
  status: z.enum(['READY_FOR_AI', 'GENERATED', 'OBSOLETE']).optional(),
  expectedVersion: z.number().int().positive().optional(),
  changeSummary: z.string().optional(),
});

// GET /api/v1/requirements/project/:projectId - Requisitos de un proyecto (paginado con estado)
requirementsRouter.get(
  '/project/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.projectId, req.user!.userId, req.user!.role);
    const { page, pageSize, skip, take } = getPagination(req);
    const statusFilter = req.query.status as string | undefined;

    const where: Record<string, unknown> = { projectId: req.params.projectId };
    if (statusFilter) {
      where.status = statusFilter;
    }

    const [total, requirements] = await Promise.all([
      prisma.requirement.count({ where }),
      prisma.requirement.findMany({
        where,
        orderBy: { code: 'asc' },
        skip,
        take,
        include: {
          _count: {
            select: {
              testCases: true,
              aiGenerations: true,
              versions: true,
            },
          },
        },
      }),
    ]);

    return sendPaginated(res, requirements, buildPaginationMeta(page, pageSize, total));
  })
);

// GET /api/v1/requirements/:id - Detalle de un requisito con casos y análisis de ambigüedad
requirementsRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await assertRequirementAccess(req.params.id, req.user!.userId, req.user!.role);
    const requirement = await prisma.requirement.findUnique({
      where: { id: req.params.id },
      include: {
        testCases: { orderBy: { code: 'asc' } },
        aiGenerations: { orderBy: { createdAt: 'desc' }, take: 5 },
        versions: { orderBy: { version: 'desc' } },
      },
    });

    if (!requirement) {
      throw ApiError.notFound('Requisito no encontrado');
    }

    // Análisis de ambigüedad en tiempo de consulta (RF-13)
    const ambiguityAnalysis = AmbiguityDetector.analyze(
      requirement.description,
      requirement.acceptanceCriteria
    );

    return sendSuccess(res, {
      ...requirement,
      ambiguityAnalysis,
    });
  })
);

// GET /api/v1/requirements/:id/ambiguity - RF-13: Análisis específico de ambigüedad
requirementsRouter.get(
  '/:id/ambiguity',
  asyncHandler(async (req: Request, res: Response) => {
    const reqEntity = await assertRequirementAccess(req.params.id, req.user!.userId, req.user!.role);
    const analysis = AmbiguityDetector.analyze(reqEntity.description, reqEntity.acceptanceCriteria);
    return sendSuccess(res, analysis);
  })
);

// GET /api/v1/requirements/:id/quality-gate - Evaluación integral de Quality Gate, Testability Score y Test Rigor Index
requirementsRouter.get(
  '/:id/quality-gate',
  asyncHandler(async (req: Request, res: Response) => {
    await assertRequirementAccess(req.params.id, req.user!.userId, req.user!.role);
    const requirement = await prisma.requirement.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        testCases: {
          select: { id: true, code: true, type: true, status: true, source: true },
        },
      },
    });

    const qgEvaluation = RequirementsQualityGate.evaluate({
      title: requirement.title,
      description: requirement.description,
      acceptanceCriteria: requirement.acceptanceCriteria,
    });

    // Calcular Test Rigor Index (0-100%) sobre casos existentes
    const cases = requirement.testCases;
    const typesPresent = new Set(cases.map((c) => c.type.toLowerCase()));

    let rigorScore = 0;
    if (typesPresent.has('positive')) rigorScore += 20;
    if (typesPresent.has('negative')) rigorScore += 25;
    if (typesPresent.has('boundary')) rigorScore += 25;
    if (typesPresent.has('validation')) rigorScore += 15;
    if (typesPresent.has('alternative')) rigorScore += 15;

    let rigorLevel: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' = 'POOR';
    if (rigorScore >= 85) rigorLevel = 'EXCELLENT';
    else if (rigorScore >= 60) rigorLevel = 'GOOD';
    else if (rigorScore >= 40) rigorLevel = 'FAIR';

    const sourceCounts = {
      AI_GENERATED: cases.filter((c) => c.source === 'AI_GENERATED').length,
      ISTQB_BVA: cases.filter((c) => c.source === 'ISTQB_BVA').length,
      TEMPLATE: cases.filter((c) => c.source === 'TEMPLATE').length,
      MANUAL: cases.filter((c) => c.source === 'MANUAL').length,
    };

    return sendSuccess(res, {
      requirementId: requirement.id,
      code: requirement.code,
      qualityGate: qgEvaluation,
      testRigor: {
        score: rigorScore,
        level: rigorLevel,
        typesPresent: Array.from(typesPresent),
        missingTypes: ['positive', 'negative', 'boundary', 'validation', 'alternative'].filter(
          (t) => !typesPresent.has(t)
        ),
        totalCases: cases.length,
        sourceBreakdown: sourceCounts,
      },
    });
  })
);


// GET /api/v1/requirements/:id/versions - Historial de versiones del requisito
requirementsRouter.get(
  '/:id/versions',
  asyncHandler(async (req: Request, res: Response) => {
    await assertRequirementAccess(req.params.id, req.user!.userId, req.user!.role);
    const versions = await prisma.requirementVersion.findMany({
      where: { requirementId: req.params.id },
      orderBy: { version: 'desc' },
      include: { author: { select: { id: true, fullName: true, email: true } } },
    });
    return sendSuccess(res, versions);
  })
);

// POST /api/v1/requirements - Crear nuevo requisito con código atómico garantizado
requirementsRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const data = createRequirementSchema.parse(req.body);
    await assertProjectAccess(data.projectId, req.user!.userId, req.user!.role);

    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({
        where: { id: data.projectId },
        select: { status: true, nextRequirementNumber: true },
      });

      if (project.status === 'ARCHIVED') {
        throw ApiError.forbidden('No se pueden agregar requisitos a un proyecto archivado.');
      }

      // Si no especificó código o ya existe, asignar atómicamente
      let finalCode = data.code?.trim().toUpperCase();
      if (!finalCode) {
        finalCode = `REQ-${String(project.nextRequirementNumber).padStart(3, '0')}`;
        await tx.project.update({
          where: { id: data.projectId },
          data: { nextRequirementNumber: project.nextRequirementNumber + 1 },
        });
      } else {
        const existing = await tx.requirement.findUnique({
          where: { projectId_code: { projectId: data.projectId, code: finalCode } },
        });
        if (existing) {
          throw ApiError.conflict(`Ya existe un requisito con el código '${finalCode}' en este proyecto.`);
        }
      }

      const created = await tx.requirement.create({
        data: {
          projectId: data.projectId,
          code: finalCode,
          title: data.title,
          description: data.description,
          acceptanceCriteria: data.acceptanceCriteria,
          version: 1,
          status: 'READY_FOR_AI',
        },
      });

      // Crear versión snapshot inicial v1
      await tx.requirementVersion.create({
        data: {
          requirementId: created.id,
          version: 1,
          title: created.title,
          description: created.description,
          acceptanceCriteria: created.acceptanceCriteria,
          authorId: req.user!.userId,
          changeSummary: 'Versión inicial',
        },
      });

      return created;
    });

    audit(req, 'REQUIREMENT_CREATED', { requirementId: result.id, code: result.code });
    return sendSuccess(res, result, 'Requisito creado exitosamente', 201);
  })
);

// PUT /api/v1/requirements/:id - Edición versionada con bloqueo optimista atómico
requirementsRouter.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const current = await assertRequirementAccess(req.params.id, req.user!.userId, req.user!.role);
    const parsedData = updateRequirementSchema.parse(req.body);

    if (parsedData.expectedVersion !== undefined && current.version !== parsedData.expectedVersion) {
      throw ApiError.conflict(
        `Conflicto de concurrencia: el requisito fue modificado por otro usuario (versión actual: ${current.version}, enviada: ${parsedData.expectedVersion}). Recargue antes de guardar.`
      );
    }

    const hasSignificantChange =
      (parsedData.title && parsedData.title !== current.title) ||
      (parsedData.description && parsedData.description !== current.description) ||
      (parsedData.acceptanceCriteria && parsedData.acceptanceCriteria !== current.acceptanceCriteria);

    const nextVersion = hasSignificantChange ? current.version + 1 : current.version;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualización atómica con chequeo de versión
      const updateResult = await tx.requirement.updateMany({
        where: {
          id: req.params.id,
          version: current.version,
        },
        data: {
          ...(parsedData.title ? { title: parsedData.title } : {}),
          ...(parsedData.description ? { description: parsedData.description } : {}),
          ...(parsedData.acceptanceCriteria ? { acceptanceCriteria: parsedData.acceptanceCriteria } : {}),
          ...(parsedData.status ? { status: parsedData.status } : {}),
          version: nextVersion,
          updatedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw ApiError.conflict('Conflicto de concurrencia: el requisito cambió simultáneamente.');
      }

      // 2. Si el contenido cambió, guardar snapshot en RequirementVersion y marcar casos previos como obsoletos
      if (hasSignificantChange) {
        await tx.requirementVersion.create({
          data: {
            requirementId: req.params.id,
            version: nextVersion,
            title: parsedData.title || current.title,
            description: parsedData.description || current.description,
            acceptanceCriteria: parsedData.acceptanceCriteria || current.acceptanceCriteria,
            authorId: req.user!.userId,
            changeSummary: parsedData.changeSummary || 'Actualización de especificación',
          },
        });

        // Marcar casos anteriores como desactualizados/obsoletos para revisión humana obligatoria
        await tx.testCase.updateMany({
          where: {
            requirementId: req.params.id,
            requirementVersion: { lt: nextVersion },
          },
          data: { isObsolete: true },
        });
      }

      return await tx.requirement.findUniqueOrThrow({ where: { id: req.params.id } });
    });

    audit(req, 'REQUIREMENT_UPDATED', { requirementId: req.params.id, version: nextVersion });
    return sendSuccess(res, result, 'Requisito actualizado correctamente');
  })
);

// POST /api/v1/requirements/import/preview - Previsualización y validación por fila de CSV o JSON
requirementsRouter.post(
  '/import/preview',
  asyncHandler(async (req: Request, res: Response) => {
    const { csvContent, jsonContent } = req.body;

    let preview;
    if (csvContent && typeof csvContent === 'string') {
      preview = RequirementImportService.previewCsv(csvContent);
    } else if (jsonContent && Array.isArray(jsonContent)) {
      preview = RequirementImportService.previewJson(jsonContent);
    } else {
      throw ApiError.badRequest('Debe proporcionar csvContent (texto) o jsonContent (array).');
    }

    return sendSuccess(res, preview);
  })
);

// POST /api/v1/requirements/import - Importación por lotes atómica y validada
requirementsRouter.post(
  '/import',
  asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.body.projectId;
    const items = req.body.requirements;

    if (!projectId || !Array.isArray(items) || items.length === 0) {
      throw ApiError.badRequest('projectId y array de requirements son obligatorios.');
    }

    await assertProjectAccess(projectId, req.user!.userId, req.user!.role);

    // Validar cada fila individualmente con el esquema estricto
    const validatedRows = items.map((item, idx) => {
      const parsed = requirementImportRowSchema.safeParse(item);
      if (!parsed.success) {
        throw ApiError.badRequest(
          `Error en fila ${idx + 1}: ${parsed.error.errors.map((e) => e.message).join(', ')}`
        );
      }
      return parsed.data;
    });

    // Inserción atómica transaccional
    const createdList = await prisma.$transaction(async (tx) => {
      // Comprobar colisiones de códigos con requisitos ya existentes en el proyecto
      const existing = await tx.requirement.findMany({
        where: {
          projectId,
          code: { in: validatedRows.map((r) => r.code) },
        },
        select: { code: true },
      });

      if (existing.length > 0) {
        throw ApiError.conflict(
          `Los siguientes códigos ya existen en el proyecto: ${existing.map((e) => e.code).join(', ')}. No se importaron registros.`
        );
      }

      const created = [];
      for (const row of validatedRows) {
        const reqRow = await tx.requirement.create({
          data: {
            projectId,
            code: row.code,
            title: row.title,
            description: row.description,
            acceptanceCriteria: row.acceptanceCriteria,
            version: 1,
            status: 'READY_FOR_AI',
          },
        });

        await tx.requirementVersion.create({
          data: {
            requirementId: reqRow.id,
            version: 1,
            title: reqRow.title,
            description: reqRow.description,
            acceptanceCriteria: reqRow.acceptanceCriteria,
            authorId: req.user!.userId,
            changeSummary: 'Importación masiva',
          },
        });

        created.push(reqRow);
      }

      return created;
    });

    audit(req, 'REQUIREMENTS_BATCH_IMPORTED', { projectId, count: createdList.length });
    return sendSuccess(res, createdList, `Se importaron ${createdList.length} requisitos exitosamente.`, 201);
  })
);

// PATCH /api/v1/requirements/:id/archive - Archivó lógico/obsolescencia del requisito
requirementsRouter.patch(
  '/:id/archive',
  asyncHandler(async (req: Request, res: Response) => {
    await assertRequirementAccess(req.params.id, req.user!.userId, req.user!.role);
    const updated = await prisma.requirement.update({
      where: { id: req.params.id },
      data: { status: 'OBSOLETE' },
    });
    audit(req, 'REQUIREMENT_ARCHIVED', { requirementId: req.params.id });
    return sendSuccess(res, updated, 'Requisito marcado como obsoleto');
  })
);
