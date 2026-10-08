// ==========================================================================
// Application Use Case: GenerateFromTemplateUseCase
// Genera casos de prueba deterministas basados en plantillas ISTQB (RF-15).
// Sin IA, sin consumo de tokens, sin API keys.
// ==========================================================================

import { prisma } from '../../config/prisma';
import { logger } from '../../common/utils/logger';
import { SecurityPolicy } from '../../core/domain/security/security-policy';
import { ApiError } from '../../common/errors/api-error';
import { ISTQB_TEMPLATES, hydrateTemplate } from '../../core/templates/istqb-templates';
import { DuplicateDetector, DuplicateCandidate } from '../../modules/test-cases/duplicate-detector';

export interface GenerateFromTemplateInputDTO {
  requirementId: string;
  userId: string;
  userRole: string;
  templateCategory: string;
}

export interface GenerateFromTemplateOutputDTO {
  cases: Array<Record<string, unknown>>;
  templateUsed: {
    category: string;
    name: string;
    casesGenerated: number;
  };
  duplicateWarnings?: DuplicateCandidate[];
}

export class GenerateFromTemplateUseCase {
  public async execute(input: GenerateFromTemplateInputDTO): Promise<GenerateFromTemplateOutputDTO> {
    const { requirementId, userId, userRole, templateCategory } = input;

    // 1. Verificar requisito y acceso
    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: { project: true },
    });

    if (!requirement) {
      throw ApiError.notFound(`Requisito con ID ${requirementId} no encontrado.`);
    }

    if (requirement.project.status === 'ARCHIVED') {
      throw ApiError.forbidden('El proyecto está archivado. Reactívelo antes de generar casos.');
    }

    SecurityPolicy.assertProjectAccess(requirement.project.ownerId, { userId, role: userRole });

    // 2. Buscar la plantilla solicitada
    const template = ISTQB_TEMPLATES.find((t) => t.key === templateCategory);
    if (!template) {
      const available = ISTQB_TEMPLATES.map((t) => t.key).join(', ');
      throw ApiError.badRequest(
        `Categoría de plantilla '${templateCategory}' no encontrada. Categorías disponibles: ${available}`
      );
    }

    // 3. Hidratar las plantillas con el título del requisito
    const hydratedCases = template.cases.map((tc) => hydrateTemplate(tc, requirement.title));

    // 4. Persistencia transaccional con códigos atómicos
    const createdCases = await prisma.$transaction(async (tx) => {
      const currentReq = await tx.requirement.findUniqueOrThrow({
        where: { id: requirementId },
        select: { nextCaseNumber: true, version: true },
      });

      const startCodeNum = currentReq.nextCaseNumber;
      const nextCodeNum = startCodeNum + hydratedCases.length;

      // Actualizar contador atómico
      await tx.requirement.update({
        where: { id: requirementId },
        data: { nextCaseNumber: nextCodeNum },
      });

      const inserted = [];
      for (let i = 0; i < hydratedCases.length; i++) {
        const c = hydratedCases[i];
        const codeNum = startCodeNum + i;
        const code = `CP-${String(codeNum).padStart(3, '0')}`;

        const created = await tx.testCase.create({
          data: {
            requirementId,
            generationId: null,
            code,
            type: c.type,
            title: c.titleTemplate,
            preconditions: c.preconditions,
            steps: c.steps,
            testData: null,
            expectedResult: c.expectedResultTemplate,
            priority: c.priority,
            evidenceStatus: c.evidenceStatus,
            originalContent: {
              title: c.titleTemplate,
              type: c.type,
              preconditions: c.preconditions,
              steps: c.steps,
              expectedResult: c.expectedResultTemplate,
              priority: c.priority,
              evidenceStatus: c.evidenceStatus,
              templateCategory: template.key,
            },
            version: 1,
            requirementVersion: currentReq.version,
            isObsolete: false,
            source: 'TEMPLATE',
            status: 'PENDING',
          },
        });
        inserted.push(created);
      }

      return inserted;
    });

    // 5. Detección de duplicados (RF-14)
    const allRequirementCases = await prisma.testCase.findMany({
      where: { requirementId, isObsolete: false },
      select: { id: true, code: true, title: true, steps: true, expectedResult: true },
    });

    const duplicateWarnings = DuplicateDetector.findDuplicates(
      allRequirementCases.map((tc) => ({
        id: tc.id,
        code: tc.code,
        title: tc.title,
        steps: Array.isArray(tc.steps) ? (tc.steps as string[]) : [],
        expectedResult: tc.expectedResult,
      }))
    );

    logger.info(
      {
        requirementId,
        template: template.key,
        casesCount: createdCases.length,
        duplicateWarningsCount: duplicateWarnings.length,
      },
      '[GenerateFromTemplateUseCase] Casos generados desde plantilla ISTQB (sin IA)'
    );

    return {
      cases: createdCases,
      templateUsed: {
        category: template.key,
        name: template.name,
        casesGenerated: createdCases.length,
      },
      duplicateWarnings: duplicateWarnings.length > 0 ? duplicateWarnings : undefined,
    };
  }
}
