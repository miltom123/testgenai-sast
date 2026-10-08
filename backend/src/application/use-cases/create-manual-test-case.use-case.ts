// ==========================================================================
// Application Use Case: CreateManualTestCaseUseCase
// Crea un caso de prueba manualmente sin depender de IA (RF-15).
// Sigue el mismo flujo de asignación de código y trazabilidad.
// ==========================================================================

import { prisma } from '../../config/prisma';
import { logger } from '../../common/utils/logger';
import { SecurityPolicy } from '../../core/domain/security/security-policy';
import { ApiError } from '../../common/errors/api-error';

export interface CreateManualTestCaseInputDTO {
  requirementId: string;
  userId: string;
  userRole: string;
  type: 'positive' | 'negative' | 'alternative' | 'boundary' | 'validation';
  title: string;
  preconditions: string[];
  steps: string[];
  testData?: string | null;
  expectedResult: string;
  priority: 'high' | 'medium' | 'low';
}

export class CreateManualTestCaseUseCase {
  public async execute(input: CreateManualTestCaseInputDTO) {
    const {
      requirementId,
      userId,
      userRole,
      type,
      title,
      preconditions,
      steps,
      testData,
      expectedResult,
      priority,
    } = input;

    // 1. Verificar que el requisito existe y el proyecto está activo
    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: { project: true },
    });

    if (!requirement) {
      throw ApiError.notFound(`Requisito con ID ${requirementId} no encontrado.`);
    }

    if (requirement.project.status === 'ARCHIVED') {
      throw ApiError.forbidden('El proyecto está archivado. Reactívelo antes de crear casos.');
    }

    SecurityPolicy.assertProjectAccess(requirement.project.ownerId, { userId, role: userRole });

    // 2. Persistencia transaccional con reserva atómica de código CP-XXX
    const createdCase = await prisma.$transaction(async (tx) => {
      const currentReq = await tx.requirement.findUniqueOrThrow({
        where: { id: requirementId },
        select: { nextCaseNumber: true, version: true },
      });

      const codeNum = currentReq.nextCaseNumber;
      const code = `CP-${String(codeNum).padStart(3, '0')}`;

      // Incrementar contador
      await tx.requirement.update({
        where: { id: requirementId },
        data: { nextCaseNumber: codeNum + 1 },
      });

      // Crear el caso de prueba
      const testCase = await tx.testCase.create({
        data: {
          requirementId,
          generationId: null, // Sin generación de IA
          code,
          type,
          title,
          preconditions,
          steps,
          testData: testData || null,
          expectedResult,
          priority,
          evidenceStatus: 'pending',
          originalContent: {
            title,
            type,
            preconditions,
            steps,
            expectedResult,
            priority,
            evidenceStatus: 'pending',
          },
          version: 1,
          requirementVersion: currentReq.version,
          isObsolete: false,
          source: 'MANUAL',
          status: 'PENDING',
        },
      });

      return testCase;
    });

    logger.info(
      { requirementId, caseCode: createdCase.code, userId },
      '[CreateManualTestCaseUseCase] Caso de prueba creado manualmente (sin IA)'
    );

    return createdCase;
  }
}
