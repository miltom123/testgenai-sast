// ==============================================================================
// Application Use Case: CreateTestCaseFromBugUseCase (Propuesta 38)
// Generador de Casos a Partir de Defectos (Bug-to-Test)
// Convierte un reporte de fallo en una prueba de regresión automatizada.
// ==============================================================================

import { prisma } from '../../config/prisma';
import { logger } from '../../common/utils/logger';
import { ApiError } from '../../common/errors/api-error';
import { SecurityPolicy } from '../../core/domain/security/security-policy';

export interface CreateFromBugInputDTO {
  requirementId: string;
  userId: string;
  userRole: string;
  defectTitle: string;
  stepsToReproduce: string[];
  actualBehavior: string;
  expectedBehavior: string;
  severity: 'high' | 'medium' | 'low';
}

export class CreateTestCaseFromBugUseCase {
  public async execute(input: CreateFromBugInputDTO) {
    const {
      requirementId,
      userId,
      userRole,
      defectTitle,
      stepsToReproduce,
      actualBehavior,
      expectedBehavior,
      severity,
    } = input;

    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: { project: true },
    });

    if (!requirement) {
      throw ApiError.notFound(`Requisito ${requirementId} no encontrado.`);
    }

    SecurityPolicy.assertProjectAccess(requirement.project.ownerId, { userId, role: userRole });

    const createdCase = await prisma.$transaction(async (tx) => {
      const currentReq = await tx.requirement.findUniqueOrThrow({
        where: { id: requirementId },
        select: { nextCaseNumber: true, version: true },
      });

      const codeNum = currentReq.nextCaseNumber;
      const code = `CP-${String(codeNum).padStart(3, '0')}`;

      await tx.requirement.update({
        where: { id: requirementId },
        data: { nextCaseNumber: codeNum + 1 },
      });

      const title = `[Regresión Defecto] ${defectTitle}`;
      const preconditions = [
        'El sistema cuenta con el parche de corrección desplegado.',
        `Defecto histórico original verificado: ${defectTitle}.`,
      ];
      const testData = `Comportamiento anómalo previo: "${actualBehavior}"`;

      return tx.testCase.create({
        data: {
          requirementId,
          generationId: null,
          code,
          type: 'negative',
          title,
          preconditions,
          steps: stepsToReproduce,
          testData,
          expectedResult: expectedBehavior,
          priority: severity,
          evidenceStatus: 'pending',
          originalContent: {
            defectTitle,
            actualBehavior,
            expectedBehavior,
            technique: 'BUG_TO_TEST_REGRESSION',
          },
          version: 1,
          requirementVersion: currentReq.version,
          isObsolete: false,
          source: 'MANUAL',
          status: 'PENDING',
        },
      });
    });

    logger.info({ code: createdCase.code, defectTitle }, 'Caso de regresión derivado de defecto exitosamente');

    return createdCase;
  }
}
