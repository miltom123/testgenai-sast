import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { sendSuccess, sendPaginated, getPagination, buildPaginationMeta } from '../../common/utils/api-response';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { ApiError } from '../../common/errors/api-error';
import {
  assertProjectAccess,
  assertRequirementAccess,
  assertTestCaseAccess,
} from '../../common/utils/ownership';
import { ReviewTestCaseUseCase } from '../../application/use-cases/review-test-case.use-case';
import { CreateManualTestCaseUseCase } from '../../application/use-cases/create-manual-test-case.use-case';
import { GenerateFromTemplateUseCase } from '../../application/use-cases/generate-from-template.use-case';
import { GenerateFromBvaUseCase } from '../../application/use-cases/generate-from-bva.use-case';
import { GenerateFromFormalUseCase } from '../../application/use-cases/generate-from-formal.use-case';
import { CloneTestCaseUseCase } from '../../application/use-cases/clone-test-case.use-case';
import { CreateTestCaseFromBugUseCase } from '../../application/use-cases/create-test-case-from-bug.use-case';
import { ImportTestCasesUseCase } from '../../application/use-cases/import-test-cases.use-case';
import { SyntheticDataEngine } from '../../core/test-design/synthetic-data';
import { ISTQB_TEMPLATES } from '../../core/templates/istqb-templates';

export const testCasesRouter = Router();

testCasesRouter.use(authenticateJWT);

const reviewSchema = z.object({
  decision: z.enum(['APPROVED', 'MODIFIED', 'REJECTED']),
  comments: z.string().optional(),
  justification: z.string().optional(),
  expectedVersion: z.number().int().positive().optional(),
  title: z.string().min(3).optional(),
  preconditions: z.array(z.string()).optional(),
  steps: z.array(z.string().min(1)).min(1).optional(),
  testData: z.string().optional().nullable(),
  expectedResult: z.string().min(3).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  evidenceStatus: z.enum(['derived', 'suggested', 'ambiguous', 'conflict', 'pending']).optional(),
  evidenceText: z.string().optional().nullable(),
});

const reviewsInclude = {
  reviews: {
    orderBy: { createdAt: 'desc' as const },
    include: { reviewer: { select: { id: true, fullName: true, role: true } } },
  },
};

// GET /api/v1/test-cases/project/:projectId - Casos de prueba con soporte de paginación normal y por cursor (Mejora 69)
testCasesRouter.get(
  '/project/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.projectId, req.user!.userId, req.user!.role);
    const statusFilter = req.query.status as string | undefined;

    const where: Record<string, unknown> = {
      requirement: { projectId: req.params.projectId },
    };

    if (statusFilter && ['PENDING', 'APPROVED', 'MODIFIED', 'REJECTED'].includes(statusFilter)) {
      where.status = statusFilter;
    }

    // Mejora 69: Paginación por cursor para grandes volúmenes
    if (req.query.cursor) {
      const cursorId = req.query.cursor as string;
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);

      const cases = await prisma.testCase.findMany({
        where,
        cursor: { id: cursorId },
        skip: 1,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          requirement: { select: { id: true, code: true, title: true, version: true } },
          ...reviewsInclude,
        },
      });

      return sendSuccess(res, {
        items: cases,
        nextCursor: cases.length === limit ? cases[cases.length - 1].id : null,
      });
    }

    // Paginación estándar por página/offset
    const { page, pageSize, skip, take } = getPagination(req);

    const [total, cases] = await Promise.all([
      prisma.testCase.count({ where }),
      prisma.testCase.findMany({
        where,
        orderBy: { code: 'asc' },
        skip,
        take,
        include: {
          requirement: { select: { id: true, code: true, title: true, version: true } },
          ...reviewsInclude,
        },
      }),
    ]);

    return sendPaginated(res, cases, buildPaginationMeta(page, pageSize, total));
  })
);

// GET /api/v1/test-cases/requirement/:requirementId - Casos de un requisito
testCasesRouter.get(
  '/requirement/:requirementId',
  asyncHandler(async (req: Request, res: Response) => {
    await assertRequirementAccess(req.params.requirementId, req.user!.userId, req.user!.role);
    const cases = await prisma.testCase.findMany({
      where: { requirementId: req.params.requirementId },
      orderBy: { code: 'asc' },
      include: {
        requirement: { select: { id: true, code: true, title: true, version: true } },
        ...reviewsInclude,
      },
    });
    return sendSuccess(res, cases);
  })
);

// ==========================================================================
// RF-15 & Técnicas ISTQB: Creación de casos SIN IA
// ==========================================================================

const manualCaseSchema = z.object({
  requirementId: z.string().uuid('ID de requisito inválido'),
  type: z.enum(['positive', 'negative', 'alternative', 'boundary', 'validation']),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  preconditions: z.array(z.string()).optional().default([]),
  steps: z.array(z.string().min(1)).min(1, 'Se requiere al menos un paso'),
  testData: z.string().optional().nullable(),
  expectedResult: z.string().min(3, 'El resultado esperado debe tener al menos 3 caracteres'),
  priority: z.enum(['high', 'medium', 'low']),
});

const templateSchema = z.object({
  requirementId: z.string().uuid('ID de requisito inválido'),
  templateCategory: z.string().min(1, 'La categoría de plantilla es obligatoria'),
});

// POST /api/v1/test-cases/manual - Crear un caso de prueba manualmente (sin IA)
testCasesRouter.post(
  '/manual',
  asyncHandler(async (req: Request, res: Response) => {
    const input = manualCaseSchema.parse(req.body);

    const useCase = new CreateManualTestCaseUseCase();
    const result = await useCase.execute({
      ...input,
      userId: req.user!.userId,
      userRole: req.user!.role,
    });

    return sendSuccess(res, result, 'Caso de prueba creado manualmente', 201);
  })
);

// POST /api/v1/test-cases/from-template - Generar casos desde plantilla ISTQB (sin IA)
testCasesRouter.post(
  '/from-template',
  asyncHandler(async (req: Request, res: Response) => {
    const { requirementId, templateCategory } = templateSchema.parse(req.body);

    const useCase = new GenerateFromTemplateUseCase();
    const result = await useCase.execute({
      requirementId,
      templateCategory,
      userId: req.user!.userId,
      userRole: req.user!.role,
    });

    return sendSuccess(
      res,
      result,
      `Se generaron ${result.templateUsed.casesGenerated} casos desde la plantilla "${result.templateUsed.name}"`,
      201
    );
  })
);

// GET /api/v1/test-cases/templates - Listar plantillas ISTQB disponibles (Propuesta 36)
testCasesRouter.get(
  '/templates',
  asyncHandler(async (_req: Request, res: Response) => {
    const templates = ISTQB_TEMPLATES.map((t) => ({
      key: t.key,
      name: t.name,
      description: t.description,
      icon: t.icon,
      casesCount: t.cases.length,
    }));

    return sendSuccess(res, templates, `${templates.length} plantillas ISTQB disponibles`);
  })
);

const bvaSchema = z.object({
  requirementId: z.string().uuid('ID de requisito inválido'),
  variable: z.object({
    name: z.string().min(2, 'El nombre de la variable debe tener al menos 2 caracteres'),
    type: z.enum(['integer', 'decimal', 'string_length']),
    min: z.number(),
    max: z.number(),
    unit: z.string().optional(),
    decimals: z.number().int().min(1).max(6).optional(),
  }),
});

// POST /api/v1/test-cases/from-bva - Generar casos deterministas con Análisis de Valores Límite
testCasesRouter.post(
  '/from-bva',
  asyncHandler(async (req: Request, res: Response) => {
    const { requirementId, variable } = bvaSchema.parse(req.body);

    const useCase = new GenerateFromBvaUseCase();
    const result = await useCase.execute({
      requirementId,
      variable,
      userId: req.user!.userId,
      userRole: req.user!.role,
    });

    return sendSuccess(
      res,
      result,
      `Se generaron ${result.bvaSummary.casesInserted} casos formales de BVA para "${variable.name}"`,
      201
    );
  })
);

// POST /api/v1/test-cases/from-formal - Generador Formal (Tablas de Decisión, Transición de Estados, Pairwise, CTM, Casos de Uso, Error Guessing)
testCasesRouter.post(
  '/from-formal',
  asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      requirementId: z.string().uuid(),
      method: z.enum(['decision_table', 'state_transition', 'pairwise', 'error_guessing', 'classification_tree', 'use_case']),
      payload: z.record(z.unknown()).default({}),
    });

    const { requirementId, method, payload } = schema.parse(req.body);

    const useCase = new GenerateFromFormalUseCase();
    const result = await useCase.execute({
      requirementId,
      method,
      payload,
      userId: req.user!.userId,
      userRole: req.user!.role,
    });

    return sendSuccess(res, result, `Se generaron ${result.casesInserted} casos con la técnica ${method}`, 201);
  })
);

// POST /api/v1/test-cases/from-bug - Propuesta 38: Generador Bug-to-Test
testCasesRouter.post(
  '/from-bug',
  asyncHandler(async (req: Request, res: Response) => {
    const bugSchema = z.object({
      requirementId: z.string().uuid(),
      defectTitle: z.string().min(3),
      stepsToReproduce: z.array(z.string().min(1)).min(1),
      actualBehavior: z.string().min(3),
      expectedBehavior: z.string().min(3),
      severity: z.enum(['high', 'medium', 'low']).default('high'),
    });

    const data = bugSchema.parse(req.body);
    const useCase = new CreateTestCaseFromBugUseCase();
    const result = await useCase.execute({
      ...data,
      userId: req.user!.userId,
      userRole: req.user!.role,
    });

    return sendSuccess(res, result, 'Caso de regresión derivado de defecto exitosamente', 201);
  })
);

// POST /api/v1/test-cases/import - Propuesta 35: Importador Universal JSON/CSV
testCasesRouter.post(
  '/import',
  asyncHandler(async (req: Request, res: Response) => {
    const importSchema = z.object({
      requirementId: z.string().uuid(),
      cases: z.array(
        z.object({
          title: z.string().min(3),
          type: z.enum(['positive', 'negative', 'alternative', 'boundary', 'validation']).optional(),
          preconditions: z.array(z.string()).optional(),
          steps: z.array(z.string()).min(1),
          testData: z.string().optional().nullable(),
          expectedResult: z.string().min(2),
          priority: z.enum(['high', 'medium', 'low']).optional(),
        })
      ).min(1),
    });

    const data = importSchema.parse(req.body);
    const useCase = new ImportTestCasesUseCase();
    const result = await useCase.execute({
      ...data,
      userId: req.user!.userId,
      userRole: req.user!.role,
    });

    return sendSuccess(res, result, `Se importaron ${result.importedCount} casos exitosamente`, 201);
  })
);

// POST /api/v1/test-cases/bulk-update - Propuesta 33: Editor Masivo de Casos en Cuadrícula
testCasesRouter.post(
  '/bulk-update',
  asyncHandler(async (req: Request, res: Response) => {
    const bulkSchema = z.object({
      caseIds: z.array(z.string().uuid()).min(1),
      updates: z.object({
        priority: z.enum(['high', 'medium', 'low']).optional(),
        status: z.enum(['PENDING', 'APPROVED', 'MODIFIED', 'REJECTED']).optional(),
      }),
    });

    const { caseIds, updates } = bulkSchema.parse(req.body);

    const updated = await prisma.testCase.updateMany({
      where: { id: { in: caseIds } },
      data: updates,
    });

    return sendSuccess(res, { count: updated.count }, `${updated.count} casos actualizados exitosamente`);
  })
);

// GET /api/v1/test-cases/regression-suite/:projectId - Propuesta 39: Selector de Casos para Regresión
testCasesRouter.get(
  '/regression-suite/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.projectId, req.user!.userId, req.user!.role);

    // Selecciona casos de alta prioridad y técnicas de frontera/negativas de requisitos activos
    const regressionCases = await prisma.testCase.findMany({
      where: {
        requirement: { projectId: req.params.projectId, status: { not: 'OBSOLETE' } },
        isObsolete: false,
        OR: [
          { priority: 'high' },
          { type: 'boundary' },
          { type: 'negative' },
        ],
      },
      orderBy: [{ priority: 'asc' }, { code: 'asc' }],
      include: {
        requirement: { select: { id: true, code: true, title: true, version: true } },
      },
    });

    return sendSuccess(
      res,
      {
        totalSelected: regressionCases.length,
        cases: regressionCases,
      },
      `Suite de regresión generada con ${regressionCases.length} casos críticos`
    );
  })
);

// GET /api/v1/test-cases/synthetic-data - Generar lote de datos sintéticos de prueba industriales
testCasesRouter.get(
  '/synthetic-data',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = {
      luhnCards: {
        visaValid: SyntheticDataEngine.generateLuhnCard('visa', true),
        visaInvalid: SyntheticDataEngine.generateLuhnCard('visa', false),
        mastercardValid: SyntheticDataEngine.generateLuhnCard('mastercard', true),
        amexValid: SyntheticDataEngine.generateLuhnCard('amex', true),
        dinersValid: SyntheticDataEngine.generateLuhnCard('diners', true),
        jcbValid: SyntheticDataEngine.generateLuhnCard('jcb', true),
      },
      regionalDocs: {
        dniPeru: SyntheticDataEngine.generateDni(true),
        rucPeru: SyntheticDataEngine.generateRuc('juridica', true),
        rutChile: SyntheticDataEngine.generateRutChile(true),
        rfcMexico: SyntheticDataEngine.generateRfcMexico('moral', true),
        curpMexico: SyntheticDataEngine.generateCurpMexico(true),
        cuitArgentina: SyntheticDataEngine.generateCuitArgentina(true),
        nifSpain: SyntheticDataEngine.generateNifSpain(true),
      },
      criticalBoundaryDates: SyntheticDataEngine.getCriticalBoundaryDates(),
      passiveSecurityPayloads: SyntheticDataEngine.getPassiveSecurityPayloads(),
      boundaryStrings: SyntheticDataEngine.getBoundaryDataSet(255),
      boundaryGeoCoordinates: SyntheticDataEngine.getBoundaryGeoCoordinates(),
      syntheticFiles: SyntheticDataEngine.getSyntheticFiles(),
      networkData: SyntheticDataEngine.getNetworkData(),
      emails: {
        valid: SyntheticDataEngine.getSyntheticEmail(true),
        invalid: SyntheticDataEngine.getSyntheticEmail(false),
      },
    };

    return sendSuccess(res, data, 'Conjunto completo de datos sintéticos generado exitosamente');
  })
);

// POST /api/v1/test-cases/synthetic-data/validate - Validar dato contra algoritmos oficiales
testCasesRouter.post(
  '/synthetic-data/validate',
  asyncHandler(async (req: Request, res: Response) => {
    const { type, value } = z
      .object({
        type: z.enum(['luhn_card', 'ruc_pe', 'dni_pe', 'rut_cl', 'cuit_ar', 'nif_es']),
        value: z.string().min(1),
      })
      .parse(req.body);

    let isValid = false;
    let description = '';

    if (type === 'luhn_card') {
      isValid = SyntheticDataEngine.validateLuhn(value);
      description = isValid
        ? 'Tarjeta válida según el algoritmo de Luhn (ISO/IEC 7812)'
        : 'Tarjeta inválida: no cumple el algoritmo de Luhn';
    } else if (type === 'ruc_pe') {
      isValid = SyntheticDataEngine.validateRuc(value);
      description = isValid
        ? 'RUC válido según Módulo 11 de SUNAT'
        : 'RUC inválido: prefijo no reconocido o dígito verificador incorrecto';
    } else if (type === 'dni_pe') {
      isValid = /^\d{8}$/.test(value.trim());
      description = isValid
        ? 'DNI formalmente válido (8 dígitos numéricos)'
        : 'DNI inválido: debe contener exactamente 8 dígitos numéricos';
    } else if (type === 'rut_cl') {
      isValid = SyntheticDataEngine.validateRutChile(value);
      description = isValid
        ? 'RUT chileno válido según Módulo 11'
        : 'RUT chileno inválido';
    } else if (type === 'cuit_ar') {
      isValid = SyntheticDataEngine.validateCuitArgentina(value);
      description = isValid
        ? 'CUIT argentino válido según Módulo 11'
        : 'CUIT argentino inválido';
    } else if (type === 'nif_es') {
      isValid = SyntheticDataEngine.validateNifSpain(value);
      description = isValid
        ? 'NIF español válido según Módulo 23'
        : 'NIF español inválido';
    }

    return sendSuccess(res, { type, value, isValid, description });
  })
);

// ==========================================================================
// Rutas parametrizadas por ID (al final para no colisionar con rutas estáticas)
// ==========================================================================

// POST /api/v1/test-cases/:id/clone - Propuesta 34: Clonador Inteligente
testCasesRouter.post(
  '/:id/clone',
  asyncHandler(async (req: Request, res: Response) => {
    await assertTestCaseAccess(req.params.id, req.user!.userId, req.user!.role);
    const { replaceFind, replaceWith } = z
      .object({
        replaceFind: z.string().optional(),
        replaceWith: z.string().optional(),
      })
      .parse(req.body);

    const useCase = new CloneTestCaseUseCase();
    const result = await useCase.execute({
      testCaseId: req.params.id,
      userId: req.user!.userId,
      userRole: req.user!.role,
      replaceFind,
      replaceWith,
    });

    return sendSuccess(res, result, `Caso de prueba clonado como ${result.code}`, 201);
  })
);

// GET /api/v1/test-cases/:id - Caso individual con trazabilidad y revisiones
testCasesRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await assertTestCaseAccess(req.params.id, req.user!.userId, req.user!.role);
    const testCase = await prisma.testCase.findUnique({
      where: { id: req.params.id },
      include: {
        requirement: {
          select: { id: true, code: true, title: true, description: true, acceptanceCriteria: true, version: true, projectId: true },
        },
        generation: {
          select: { id: true, provider: true, model: true, inputTokens: true, outputTokens: true, estimatedCost: true, responseTimeMs: true, createdAt: true },
        },
        ...reviewsInclude,
      },
    });
    return sendSuccess(res, testCase);
  })
);

// GET /api/v1/test-cases/:id/history - Historial de revisiones (antes vs después del mismo caso)
testCasesRouter.get(
  '/:id/history',
  asyncHandler(async (req: Request, res: Response) => {
    await assertTestCaseAccess(req.params.id, req.user!.userId, req.user!.role);
    const reviews = await prisma.testCaseReview.findMany({
      where: { testCaseId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { id: true, fullName: true, role: true } },
      },
    });
    return sendSuccess(res, reviews);
  })
);

// PATCH /api/v1/test-cases/:id/review - Punto Único de Revisión, Edición y Aprobación/Rechazo
testCasesRouter.patch(
  '/:id/review',
  asyncHandler(async (req: Request, res: Response) => {
    await assertTestCaseAccess(req.params.id, req.user!.userId, req.user!.role);
    const { decision, comments, justification, expectedVersion, ...updates } = reviewSchema.parse(req.body);

    const useCase = new ReviewTestCaseUseCase();
    const result = await useCase.execute({
      testCaseId: req.params.id,
      reviewerId: req.user!.userId,
      reviewerRole: req.user!.role,
      decision,
      comments,
      justification,
      expectedVersion,
      updates: Object.keys(updates).length > 0 ? updates : undefined,
    });

    return sendSuccess(
      res,
      result,
      `Caso de prueba procesado como '${decision}' exitosamente`
    );
  })
);
