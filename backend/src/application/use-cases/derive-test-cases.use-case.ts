// ==========================================================================
// Application Use Case: DeriveTestCasesUseCase
// Deriva casos de prueba para UN requisito existente con el motor
// determinista (escenarios BDD, flujos del caso de uso vinculado, BVA,
// plantillas y adivinanza de errores según la profundidad).
// ==========================================================================

import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { logger } from '../../common/utils/logger';
import { ApiError } from '../../common/errors/api-error';
import { SecurityPolicy } from '../../core/domain/security/security-policy';
import { DerivationDepth, DeterministicTestDeriver, TextNormalizer } from '../../core/spec-engine';
import { BvaVariableInput } from '../../core/test-design/bva-engine';
import { DuplicateDetector, DuplicateCandidate } from '../../modules/test-cases/duplicate-detector';

export interface DeriveTestCasesInputDTO {
  requirementId: string;
  userId: string;
  userRole: string;
  depth?: DerivationDepth;
}

export interface DeriveTestCasesOutputDTO {
  requirementId: string;
  requirementCode: string;
  depth: DerivationDepth;
  derived: number;
  inserted: number;
  omittedAsExisting: number;
  techniques: Record<string, number>;
  cases: Array<Record<string, unknown>>;
  duplicateWarnings?: DuplicateCandidate[];
}

interface DerivationHints {
  variables?: BvaVariableInput[];
  templateCategory?: string | null;
  priority?: 'high' | 'medium' | 'low';
}

const pad3 = (n: number) => String(n).padStart(3, '0');

export class DeriveTestCasesUseCase {
  public async execute(input: DeriveTestCasesInputDTO): Promise<DeriveTestCasesOutputDTO> {
    const { requirementId, userId, userRole } = input;
    const depth: DerivationDepth = input.depth || 'standard';

    // 1. Requisito, proyecto, caso de uso vinculado y casos existentes
    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: {
        project: true,
        useCase: {
          include: {
            requirements: { select: { id: true, code: true }, orderBy: { code: 'asc' } },
          },
        },
        testCases: { select: { title: true } },
      },
    });

    if (!requirement) {
      throw ApiError.notFound(`Requisito con ID ${requirementId} no encontrado.`);
    }
    if (requirement.project.status === 'ARCHIVED') {
      throw ApiError.forbidden('El proyecto está archivado. Reactívelo antes de derivar casos.');
    }
    if (requirement.status === 'OBSOLETE') {
      throw ApiError.badRequest(
        'El requisito está marcado como obsoleto; no se derivan casos para requisitos obsoletos.'
      );
    }
    SecurityPolicy.assertProjectAccess(requirement.project.ownerId, { userId, role: userRole });

    const hints = (requirement.derivationHints || {}) as DerivationHints;

    // Los flujos del caso de uso se adjuntan solo al primer requisito vinculado (evita duplicados entre hermanos)
    const useCase = requirement.useCase;
    const isPrimaryOfUseCase = Boolean(useCase && useCase.requirements[0]?.id === requirement.id);

    // 2. Derivación determinista
    const derived = DeterministicTestDeriver.derive({
      code: requirement.code,
      title: requirement.title,
      description: requirement.description,
      acceptanceCriteria: requirement.acceptanceCriteria,
      priority: hints.priority,
      variables: hints.variables || [],
      templateCategory: hints.templateCategory ?? null,
      useCase:
        useCase && isPrimaryOfUseCase
          ? DeterministicTestDeriver.buildUseCaseInput({
              name: useCase.name,
              actor: useCase.actor,
              mainFlow: (useCase.mainFlow as string[]) || [],
              alternativeFlows:
                (useCase.alternativeFlows as Array<{ name: string; condition: string; steps: string[] }>) ||
                [],
              exceptionFlows:
                (useCase.exceptionFlows as Array<{
                  name: string;
                  trigger: string;
                  steps: string[];
                  expectedError: string;
                }>) || [],
            })
          : null,
      useCaseCode: useCase ? useCase.code : null,
      depth,
    });

    if (derived.length === 0) {
      throw ApiError.badRequest(
        'No fue posible derivar casos: el requisito no tiene criterios ni descripción analizables.'
      );
    }

    // 3. Omitir casos cuyo título ya existe en el requisito
    const existingTitles = new Set(requirement.testCases.map((tc) => TextNormalizer.comparisonKey(tc.title)));
    const toInsert = derived.filter((d) => !existingTitles.has(TextNormalizer.comparisonKey(d.title)));

    if (toInsert.length === 0) {
      throw ApiError.badRequest(
        `Los ${derived.length} casos derivados para ${requirement.code} ya existen. Edite los criterios de aceptación o use una profundidad mayor para obtener casos nuevos.`
      );
    }

    // 4. Inserción transaccional con códigos CP-XXX correlativos
    const createdCases = await prisma.$transaction(async (tx) => {
      const current = await tx.requirement.findUniqueOrThrow({
        where: { id: requirementId },
        select: { nextCaseNumber: true, version: true },
      });

      let counter = current.nextCaseNumber;
      const inserted = [];

      for (const d of toInsert) {
        const code = `CP-${pad3(counter++)}`;
        const created = await tx.testCase.create({
          data: {
            requirementId,
            code,
            type: d.type,
            title: d.title,
            preconditions: d.preconditions,
            steps: d.steps,
            testData: d.testData,
            expectedResult: d.expectedResult,
            priority: d.priority,
            evidenceStatus: d.evidenceStatus,
            evidenceText: d.evidenceText,
            technique: d.technique,
            originalContent: {
              title: d.title,
              type: d.type,
              preconditions: d.preconditions,
              steps: d.steps,
              testData: d.testData,
              expectedResult: d.expectedResult,
              priority: d.priority,
              evidenceStatus: d.evidenceStatus,
              technique: d.technique,
              depth,
            } as unknown as Prisma.InputJsonValue,
            version: 1,
            requirementVersion: current.version,
            isObsolete: false,
            source: 'AUTO_DERIVED',
            status: 'PENDING',
          },
        });
        inserted.push(created);
      }

      await tx.requirement.update({
        where: { id: requirementId },
        data: { nextCaseNumber: counter, status: 'GENERATED' },
      });

      return inserted;
    });

    // 5. Advertencias de duplicados potenciales (RF-14)
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

    const techniques: Record<string, number> = {};
    toInsert.forEach((d) => {
      techniques[d.technique] = (techniques[d.technique] || 0) + 1;
    });

    logger.info(
      {
        requirementId,
        code: requirement.code,
        depth,
        derived: derived.length,
        inserted: createdCases.length,
      },
      '[DeriveTestCasesUseCase] Casos derivados por el motor determinista'
    );

    return {
      requirementId,
      requirementCode: requirement.code,
      depth,
      derived: derived.length,
      inserted: createdCases.length,
      omittedAsExisting: derived.length - toInsert.length,
      techniques,
      cases: createdCases,
      duplicateWarnings: duplicateWarnings.length > 0 ? duplicateWarnings : undefined,
    };
  }
}
