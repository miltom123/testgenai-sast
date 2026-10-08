// ==========================================================================
// Application Use Case: GenerateProjectSpecUseCase
// Orquesta el motor determinista de especificación: analiza nombre y
// descripción del proyecto y persiste casos de uso, requisitos (con versión
// inicial) y casos de prueba derivados, con auditoría en SpecGeneration.
// Sin IA, sin tokens, sin servicios externos.
// ==========================================================================

import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { logger } from '../../common/utils/logger';
import { ApiError } from '../../common/errors/api-error';
import { SecurityPolicy } from '../../core/domain/security/security-policy';
import {
  DerivationDepth,
  DeterministicTestDeriver,
  ProjectSpecEngine,
  ProjectSpecification,
  SPEC_ENGINE_VERSION,
  TextNormalizer,
  UseCaseSpec,
} from '../../core/spec-engine';

export interface GenerateProjectSpecInputDTO {
  projectId: string;
  userId: string;
  userRole: string;
  name?: string;
  description?: string;
  depth?: DerivationDepth;
  includeNonFunctional?: boolean;
  includeEntityCrud?: boolean;
}

export interface GeneratedUseCaseSummary {
  id: string;
  code: string;
  name: string;
  actor: string;
  moduleKey: string;
  moduleName: string;
  requirementCount: number;
}

export interface GeneratedRequirementSummary {
  id: string;
  code: string;
  title: string;
  kind: 'functional' | 'non_functional';
  useCaseCode: string | null;
  testCasesCreated: number;
}

export interface GenerateProjectSpecOutputDTO {
  generationId: string;
  engineVersion: string;
  depth: DerivationDepth;
  summary: ProjectSpecification['summary'];
  actors: ProjectSpecification['actors'];
  modules: ProjectSpecification['modules'];
  entities: ProjectSpecification['entities'];
  warnings: string[];
  created: { useCases: number; requirements: number; testCases: number };
  skipped: { useCases: number; requirements: number };
  useCases: GeneratedUseCaseSummary[];
  requirements: GeneratedRequirementSummary[];
  durationMs: number;
}

const MIN_DESCRIPTION_LENGTH = 10;
const pad3 = (n: number) => String(n).padStart(3, '0');

export class GenerateProjectSpecUseCase {
  public async execute(input: GenerateProjectSpecInputDTO): Promise<GenerateProjectSpecOutputDTO> {
    const { projectId, userId, userRole } = input;
    const depth: DerivationDepth = input.depth || 'standard';
    const includeNonFunctional = input.includeNonFunctional !== false;
    const includeEntityCrud = input.includeEntityCrud !== false;

    // 1. Proyecto, acceso y estado
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        useCases: { select: { id: true, code: true, name: true } },
        requirements: { select: { title: true } },
      },
    });

    if (!project) {
      throw ApiError.notFound(`Proyecto con ID ${projectId} no encontrado.`);
    }
    if (project.status === 'ARCHIVED') {
      throw ApiError.forbidden('El proyecto está archivado. Reactívelo antes de generar la especificación.');
    }
    SecurityPolicy.assertProjectAccess(project.ownerId, { userId, role: userRole });

    const name = (input.name || '').trim() || project.name;
    const description = (input.description || '').trim() || (project.description || '').trim();

    if (description.length < MIN_DESCRIPTION_LENGTH) {
      throw ApiError.badRequest(
        'Agregue una descripción del proyecto de al menos 10 caracteres (qué hace el sistema, quiénes lo usan y qué gestiona) para poder analizarla.'
      );
    }

    // 2. Análisis determinista (puro, sin I/O)
    const startedAt = Date.now();
    const spec = ProjectSpecEngine.analyze(
      { name, description },
      { depth, includeNonFunctional, includeEntityCrud }
    );

    const inputHash = createHash('sha256')
      .update(
        [
          name,
          description,
          depth,
          String(includeNonFunctional),
          String(includeEntityCrud),
          SPEC_ENGINE_VERSION,
        ].join('::'),
        'utf-8'
      )
      .digest('hex');

    const existingUseCases = new Map<string, { id: string; code: string }>();
    project.useCases.forEach((uc) =>
      existingUseCases.set(TextNormalizer.comparisonKey(uc.name), { id: uc.id, code: uc.code })
    );
    const existingRequirementTitles = new Set(
      project.requirements.map((r) => TextNormalizer.comparisonKey(r.title))
    );

    // 3. Persistencia transaccional
    const result = await prisma.$transaction(
      async (tx) => {
        const generation = await tx.specGeneration.create({
          data: {
            projectId,
            userId,
            engineVersion: SPEC_ENGINE_VERSION,
            depth,
            inputName: name,
            inputDescription: description,
            inputHash,
            actorsDetected: spec.actors as unknown as Prisma.InputJsonValue,
            modulesDetected: spec.modules as unknown as Prisma.InputJsonValue,
            entitiesDetected: spec.entities.map((e) => ({
              key: e.key,
              singular: e.singular,
              plural: e.plural,
              source: e.source,
              score: e.score,
            })) as unknown as Prisma.InputJsonValue,
            warnings: spec.warnings as unknown as Prisma.InputJsonValue,
            status: 'SUCCEEDED',
          },
        });

        const counters = await tx.project.findUniqueOrThrow({
          where: { id: projectId },
          select: { nextUseCaseNumber: true, nextRequirementNumber: true },
        });
        let ucNumber = counters.nextUseCaseNumber;
        let reqNumber = counters.nextRequirementNumber;

        // 3a. Casos de uso
        const specUcToDb = new Map<string, { id: string; code: string }>();
        const createdUseCases: GeneratedUseCaseSummary[] = [];
        let skippedUseCases = 0;

        for (const uc of spec.useCases) {
          const key = TextNormalizer.comparisonKey(uc.name);
          const existing = existingUseCases.get(key);
          if (existing) {
            specUcToDb.set(uc.code, existing);
            skippedUseCases++;
            continue;
          }

          const code = `UC-${pad3(ucNumber++)}`;
          const created = await tx.useCase.create({
            data: {
              projectId,
              generationId: generation.id,
              code,
              name: uc.name,
              actor: uc.actor,
              moduleKey: uc.moduleKey,
              moduleName: uc.moduleName,
              description: uc.description,
              priority: uc.priority,
              preconditions: uc.preconditions,
              mainFlow: uc.mainFlow,
              alternativeFlows: uc.alternativeFlows as unknown as Prisma.InputJsonValue,
              exceptionFlows: uc.exceptionFlows as unknown as Prisma.InputJsonValue,
              postconditions: uc.postconditions,
              source: 'AUTO_SPEC',
            },
          });

          specUcToDb.set(uc.code, { id: created.id, code });
          existingUseCases.set(key, { id: created.id, code });
          createdUseCases.push({
            id: created.id,
            code,
            name: uc.name,
            actor: uc.actor,
            moduleKey: uc.moduleKey,
            moduleName: uc.moduleName,
            requirementCount: uc.requirementCodes.length,
          });
        }

        // 3b. Requisitos + versión inicial + casos de prueba derivados
        const createdRequirements: GeneratedRequirementSummary[] = [];
        const primaryAssigned = new Set<string>();
        let skippedRequirements = 0;
        let totalTestCases = 0;

        for (const req of spec.requirements) {
          const titleKey = TextNormalizer.comparisonKey(req.title);
          if (existingRequirementTitles.has(titleKey)) {
            skippedRequirements++;
            continue;
          }

          const specUc: UseCaseSpec | undefined = req.useCaseCode
            ? spec.useCases.find((u) => u.code === req.useCaseCode)
            : undefined;
          const dbUc = req.useCaseCode ? specUcToDb.get(req.useCaseCode) : undefined;
          const isPrimary = Boolean(
            specUc && specUc.requirementCodes[0] === req.code && !primaryAssigned.has(specUc.code)
          );
          if (isPrimary && specUc) primaryAssigned.add(specUc.code);

          const code = `REQ-${pad3(reqNumber++)}`;
          const derived = DeterministicTestDeriver.derive({
            code,
            title: req.title,
            description: req.description,
            acceptanceCriteria: req.acceptanceCriteria,
            priority: req.priority,
            variables: req.variables,
            templateCategory: req.templateCategory,
            useCase: isPrimary && specUc ? DeterministicTestDeriver.buildUseCaseInput(specUc) : null,
            useCaseCode: dbUc ? dbUc.code : null,
            depth,
          });

          const createdReq = await tx.requirement.create({
            data: {
              projectId,
              useCaseId: dbUc ? dbUc.id : null,
              code,
              title: req.title,
              description: req.description,
              acceptanceCriteria: req.acceptanceCriteria,
              version: 1,
              status: derived.length > 0 ? 'GENERATED' : 'READY',
              nextCaseNumber: derived.length + 1,
              derivationHints: {
                kind: req.kind,
                moduleKey: req.moduleKey,
                priority: req.priority,
                templateCategory: req.templateCategory,
                variables: req.variables,
                scenarioCount: req.scenarios.length,
                engineVersion: SPEC_ENGINE_VERSION,
              } as unknown as Prisma.InputJsonValue,
            },
          });

          await tx.requirementVersion.create({
            data: {
              requirementId: createdReq.id,
              version: 1,
              title: req.title,
              description: req.description,
              acceptanceCriteria: req.acceptanceCriteria,
              authorId: userId,
              changeSummary: `Generado automáticamente por el motor determinista v${SPEC_ENGINE_VERSION} (${req.moduleKey})`,
            },
          });

          if (derived.length > 0) {
            await tx.testCase.createMany({
              data: derived.map((d, index) => ({
                requirementId: createdReq.id,
                code: `CP-${pad3(index + 1)}`,
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
                  generationId: generation.id,
                } as unknown as Prisma.InputJsonValue,
                version: 1,
                requirementVersion: 1,
                isObsolete: false,
                source: 'AUTO_SPEC',
                status: 'PENDING',
              })),
            });
          }

          totalTestCases += derived.length;
          existingRequirementTitles.add(titleKey);
          createdRequirements.push({
            id: createdReq.id,
            code,
            title: req.title,
            kind: req.kind,
            useCaseCode: dbUc ? dbUc.code : null,
            testCasesCreated: derived.length,
          });
        }

        await tx.project.update({
          where: { id: projectId },
          data: { nextUseCaseNumber: ucNumber, nextRequirementNumber: reqNumber },
        });

        const durationMs = Date.now() - startedAt;
        await tx.specGeneration.update({
          where: { id: generation.id },
          data: {
            useCasesCreated: createdUseCases.length,
            requirementsCreated: createdRequirements.length,
            testCasesCreated: totalTestCases,
            useCasesSkipped: skippedUseCases,
            requirementsSkipped: skippedRequirements,
            durationMs,
          },
        });

        return {
          generationId: generation.id,
          createdUseCases,
          createdRequirements,
          skippedUseCases,
          skippedRequirements,
          totalTestCases,
          durationMs,
        };
      },
      { timeout: 120000, maxWait: 10000 }
    );

    logger.info(
      {
        projectId,
        generationId: result.generationId,
        depth,
        useCases: result.createdUseCases.length,
        requirements: result.createdRequirements.length,
        testCases: result.totalTestCases,
        skippedUseCases: result.skippedUseCases,
        skippedRequirements: result.skippedRequirements,
        durationMs: result.durationMs,
      },
      '[GenerateProjectSpecUseCase] Especificación generada por el motor determinista'
    );

    return {
      generationId: result.generationId,
      engineVersion: SPEC_ENGINE_VERSION,
      depth,
      summary: spec.summary,
      actors: spec.actors,
      modules: spec.modules,
      entities: spec.entities,
      warnings: spec.warnings,
      created: {
        useCases: result.createdUseCases.length,
        requirements: result.createdRequirements.length,
        testCases: result.totalTestCases,
      },
      skipped: { useCases: result.skippedUseCases, requirements: result.skippedRequirements },
      useCases: result.createdUseCases,
      requirements: result.createdRequirements,
      durationMs: result.durationMs,
    };
  }
}
