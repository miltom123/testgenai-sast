// ==============================================================================
// Application Use Case: ImportTestCasesUseCase (Propuesta 35)
// Importador Universal desde JSON/CSV de casos de prueba preexistentes.
// Mapea y asigna códigos CP-XXX correlativos atómicos sin perder consistencia.
// ==============================================================================

import { prisma } from '../../config/prisma';
import { logger } from '../../common/utils/logger';
import { ApiError } from '../../common/errors/api-error';
import { SecurityPolicy } from '../../core/domain/security/security-policy';

export interface RawImportCaseDTO {
  title: string;
  type?: 'positive' | 'negative' | 'alternative' | 'boundary' | 'validation';
  preconditions?: string[];
  steps: string[];
  testData?: string | null;
  expectedResult: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface ImportTestCasesInputDTO {
  requirementId: string;
  userId: string;
  userRole: string;
  cases: RawImportCaseDTO[];
}

export class ImportTestCasesUseCase {
  public async execute(input: ImportTestCasesInputDTO) {
    const { requirementId, userId, userRole, cases } = input;

    if (!cases || cases.length === 0) {
      throw ApiError.badRequest('El lote de casos a importar no puede estar vacío.');
    }

    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: { project: true },
    });

    if (!requirement) {
      throw ApiError.notFound(`Requisito ${requirementId} no encontrado.`);
    }

    SecurityPolicy.assertProjectAccess(requirement.project.ownerId, { userId, role: userRole });

    const inserted = await prisma.$transaction(async (tx) => {
      const currentReq = await tx.requirement.findUniqueOrThrow({
        where: { id: requirementId },
        select: { nextCaseNumber: true, version: true },
      });

      let nextNum = currentReq.nextCaseNumber;
      const list = [];

      for (const item of cases) {
        const code = `CP-${String(nextNum).padStart(3, '0')}`;
        nextNum++;

        const tc = await tx.testCase.create({
          data: {
            requirementId,
            generationId: null,
            code,
            type: item.type || 'positive',
            title: item.title,
            preconditions: item.preconditions || [],
            steps: item.steps && item.steps.length > 0 ? item.steps : ['1. Ejecutar el caso.'],
            testData: item.testData || null,
            expectedResult: item.expectedResult || 'Resultado satisfactorio.',
            priority: item.priority || 'medium',
            evidenceStatus: 'pending',
            originalContent: {
              source: 'IMPORT',
              importedTitle: item.title,
            },
            version: 1,
            requirementVersion: currentReq.version,
            isObsolete: false,
            source: 'MANUAL',
            status: 'PENDING',
          },
        });
        list.push(tc);
      }

      await tx.requirement.update({
        where: { id: requirementId },
        data: { nextCaseNumber: nextNum },
      });

      return list;
    });

    logger.info({ requirementId, importedCount: inserted.length }, 'Casos importados exitosamente');

    return {
      requirementId,
      importedCount: inserted.length,
      cases: inserted,
    };
  }
}
