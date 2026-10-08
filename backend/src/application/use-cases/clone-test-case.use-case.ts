// ==============================================================================
// Application Use Case: CloneTestCaseUseCase (Propuesta 34)
// Clona un caso de prueba existente con reserva atómica de código CP-XXX
// y sustitución inteligente de variables (ej. "Usuario Regular" -> "Usuario VIP").
// ==============================================================================

import { prisma } from '../../config/prisma';
import { logger } from '../../common/utils/logger';
import { ApiError } from '../../common/errors/api-error';
import { SecurityPolicy } from '../../core/domain/security/security-policy';

export interface CloneTestCaseInputDTO {
  testCaseId: string;
  userId: string;
  userRole: string;
  replaceFind?: string;
  replaceWith?: string;
}

export class CloneTestCaseUseCase {
  public async execute(input: CloneTestCaseInputDTO) {
    const { testCaseId, userId, userRole, replaceFind, replaceWith } = input;

    const sourceCase = await prisma.testCase.findUnique({
      where: { id: testCaseId },
      include: { requirement: { include: { project: true } } },
    });

    if (!sourceCase) {
      throw ApiError.notFound(`Caso de prueba con ID ${testCaseId} no encontrado.`);
    }

    if (sourceCase.requirement.project.status === 'ARCHIVED') {
      throw ApiError.forbidden('El proyecto está archivado.');
    }

    SecurityPolicy.assertProjectAccess(sourceCase.requirement.project.ownerId, { userId, role: userRole });

    const requirementId = sourceCase.requirementId;

    // Sustitución de variables si se especifica
    const applyReplace = (text: string | null | undefined): string => {
      if (!text) return '';
      if (!replaceFind || replaceWith === undefined) return text;
      return text.replaceAll(replaceFind, replaceWith);
    };

    const preArray = Array.isArray(sourceCase.preconditions)
      ? (sourceCase.preconditions as string[])
      : [];
    const stepsArray = Array.isArray(sourceCase.steps)
      ? (sourceCase.steps as string[])
      : [];

    const newTitle = replaceFind && replaceWith !== undefined
      ? applyReplace(sourceCase.title)
      : `[Copia] ${sourceCase.title}`;
    const newPreconditions = preArray.map((p) => applyReplace(p));
    const newSteps = stepsArray.map((s) => applyReplace(s));
    const newTestData = applyReplace(sourceCase.testData);
    const newExpectedResult = applyReplace(sourceCase.expectedResult);

    const cloned = await prisma.$transaction(async (tx) => {
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

      return tx.testCase.create({
        data: {
          requirementId,
          generationId: null,
          code,
          type: sourceCase.type,
          title: newTitle,
          preconditions: newPreconditions,
          steps: newSteps,
          testData: newTestData || null,
          expectedResult: newExpectedResult,
          priority: sourceCase.priority,
          evidenceStatus: 'pending',
          originalContent: {
            title: newTitle,
            clonedFrom: sourceCase.code,
            replaceFind,
            replaceWith,
          },
          version: 1,
          requirementVersion: currentReq.version,
          isObsolete: false,
          source: 'CLONE',
          status: 'PENDING',
        },
      });
    });

    logger.info({ sourceCode: sourceCase.code, newCode: cloned.code }, 'Caso de prueba clonado exitosamente');

    return cloned;
  }
}
