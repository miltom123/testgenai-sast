// ==========================================================================
// Application Use Case: GenerateFromBvaUseCase
// Genera casos de prueba formales deterministas mediante Análisis de Valores Límite
// (BVA) y Partición de Equivalencia (EP) sin depender de IA.
// ==========================================================================

import { prisma } from '../../config/prisma';
import { logger } from '../../common/utils/logger';
import { SecurityPolicy } from '../../core/domain/security/security-policy';
import { ApiError } from '../../common/errors/api-error';
import { BvaEngine, BvaVariableInput } from '../../core/test-design/bva-engine';

export interface GenerateFromBvaInputDTO {
  requirementId: string;
  variable: BvaVariableInput;
  userId: string;
  userRole: string;
}

export class GenerateFromBvaUseCase {
  public async execute(input: GenerateFromBvaInputDTO) {
    const { requirementId, variable, userId, userRole } = input;

    // 1. Validar que el requisito existe y pertenece a un proyecto activo
    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: {
        project: true,
        testCases: {
          select: { title: true, code: true },
        },
      },
    });

    if (!requirement) {
      throw ApiError.notFound(`Requisito con ID ${requirementId} no encontrado.`);
    }

    if (requirement.project.status === 'ARCHIVED') {
      throw ApiError.forbidden('El proyecto está archivado. Reactívelo antes de generar casos.');
    }

    SecurityPolicy.assertProjectAccess(requirement.project.ownerId, { userId, role: userRole });

    // 2. Ejecutar el motor matemático BVA
    const calculatedCases = BvaEngine.calculate(variable);

    if (calculatedCases.length === 0) {
      throw ApiError.badRequest('No se pudieron calcular casos para los parámetros proporcionados.');
    }

    // 3. Detección básica de duplicados contra casos existentes (RF-14)
    const normalize = (t: string) =>
      t.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

    const existingNormalizedTitles = new Set(
      requirement.testCases.map((tc) => normalize(tc.title))
    );

    const casesToInsert = calculatedCases.filter(
      (c) => !existingNormalizedTitles.has(normalize(c.title))
    );

    if (casesToInsert.length === 0) {
      throw ApiError.badRequest(
        `Todos los casos de valores límite calculados para "${variable.name}" ya existen en este requisito.`
      );
    }

    // 4. Inserción transaccional atómica con reserva correlativa de CP-XXX
    const createdCases = await prisma.$transaction(async (tx) => {
      const currentReq = await tx.requirement.findUniqueOrThrow({
        where: { id: requirementId },
        select: { nextCaseNumber: true, version: true },
      });

      let codeCounter = currentReq.nextCaseNumber;
      const inserted = [];

      for (const item of casesToInsert) {
        const code = `CP-${String(codeCounter).padStart(3, '0')}`;
        codeCounter++;

        const testCase = await tx.testCase.create({
          data: {
            requirementId,
            generationId: null, // Sin consumo de IA
            code,
            type: item.type,
            title: item.title,
            preconditions: item.preconditions,
            steps: item.steps,
            testData: item.testData,
            expectedResult: item.expectedResult,
            priority: item.priority,
            evidenceStatus: 'suggested',
            evidenceText: `Generado mediante técnica formal ISTQB de Análisis de Valores Límite (${item.tag}).`,
            originalContent: {
              title: item.title,
              type: item.type,
              preconditions: item.preconditions,
              steps: item.steps,
              expectedResult: item.expectedResult,
              priority: item.priority,
              testData: item.testData,
              evidenceStatus: 'suggested',
              technique: 'BVA_THREE_POINT',
              tag: item.tag,
            },
            version: 1,
            requirementVersion: currentReq.version,
            isObsolete: false,
            source: 'ISTQB_BVA',
            status: 'PENDING',
          },
        });

        inserted.push(testCase);
      }

      // Actualizar contador correlativo en el requisito
      await tx.requirement.update({
        where: { id: requirementId },
        data: { nextCaseNumber: codeCounter },
      });

      return inserted;
    });

    logger.info(
      {
        requirementId,
        variableName: variable.name,
        casesGenerated: createdCases.length,
        duplicatesOmitted: calculatedCases.length - casesToInsert.length,
        userId,
      },
      '[GenerateFromBvaUseCase] Casos formales de BVA generados exitosamente'
    );

    return {
      cases: createdCases,
      bvaSummary: {
        variable: variable.name,
        type: variable.type,
        min: variable.min,
        max: variable.max,
        unit: variable.unit || null,
        casesCalculated: calculatedCases.length,
        casesInserted: createdCases.length,
        duplicatesOmitted: calculatedCases.length - casesToInsert.length,
      },
    };
  }
}
