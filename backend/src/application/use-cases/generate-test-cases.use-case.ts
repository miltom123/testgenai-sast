// ==========================================================================
// Application Use Case: GenerateTestCasesUseCase
// Orquestación central de generación con IA Real:
// Gemini / OpenAI -> Zod Validation -> Transacciones cortas -> Trazabilidad
// ==========================================================================

import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { logger } from '../../common/utils/logger';
import { AIFactory } from '../../core/ai.factory';
import { AIGenerationResult } from '../../core/interfaces/ai-provider.interface';
import { PromptGuard } from '../../common/security/prompt-guard';
import { PIIMasker } from '../../common/security/pii-masker';
import { RequirementFingerprintService } from '../../core/domain/services/requirement-fingerprint.service';
import { SecurityPolicy } from '../../core/domain/security/security-policy';
import { ApiError } from '../../common/errors/api-error';
import { DuplicateDetector, DuplicateCandidate } from '../../modules/test-cases/duplicate-detector';

export interface GenerateTestCasesInputDTO {
  requirementId: string;
  userId: string;
  userRole: string;
  provider?: 'gemini' | 'openai';
  model?: string;
  temperature?: number;
  useCache?: boolean;
}

export interface GenerateTestCasesOutputDTO {
  cases: Array<Record<string, unknown>>;
  generation: {
    id: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number | null;
    responseTimeMs: number;
    cached: boolean;
  };
  duplicateWarnings?: DuplicateCandidate[];
}

export class GenerateTestCasesUseCase {
  public async execute(input: GenerateTestCasesInputDTO): Promise<GenerateTestCasesOutputDTO> {
    const {
      requirementId,
      userId,
      userRole,
      provider,
      model,
      temperature,
      useCache = true,
    } = input;

    // 1. Autorización & verificación del requisito y su proyecto
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

    const selectedProvider = (provider || env.AI_PROVIDER_DEFAULT || 'gemini').toLowerCase() as
      | 'gemini'
      | 'openai';

    if (selectedProvider !== 'gemini' && selectedProvider !== 'openai') {
      throw ApiError.badRequest(`Proveedor '${selectedProvider}' inválido. Solo se admiten 'gemini' u 'openai'.`);
    }

    const selectedModel = model?.trim() || (selectedProvider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');

    // 2. Control de presupuesto del proyecto
    const budgetLimit = requirement.project.budgetUsd ?? env.AI_PROJECT_BUDGET_USD;
    if (budgetLimit > 0) {
      const currentSpendAggregate = await prisma.aiGeneration.aggregate({
        where: { requirement: { projectId: requirement.projectId } },
        _sum: { estimatedCost: true },
      });
      const currentSpent = currentSpendAggregate._sum.estimatedCost ?? 0;
      if (currentSpent >= budgetLimit) {
        throw ApiError.badRequest(
          `Presupuesto de IA alcanzado para este proyecto ($${currentSpent.toFixed(2)} de $${budgetLimit.toFixed(
            2
          )} USD permitidos). Contacte a su administrador.`
        );
      }
    }

    // 3. Cálculo de huella determinista (Fingerprint para Caché)
    const inputHash = RequirementFingerprintService.compute({
      code: requirement.code,
      title: requirement.title,
      description: requirement.description,
      acceptanceCriteria: requirement.acceptanceCriteria,
      provider: selectedProvider,
      model: selectedModel,
    });

    // 4. CACHÉ: Reutilización de casos exitosos de la MISMA versión del requisito y MISMA generación
    if (useCache) {
      const cachedGen = await prisma.aiGeneration.findFirst({
        where: {
          requirementId,
          requirementVersion: requirement.version,
          inputHash,
          status: 'SUCCEEDED',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (cachedGen) {
        const cachedCases = await prisma.testCase.findMany({
          where: {
            requirementId,
            generationId: cachedGen.id,
            isObsolete: false,
          },
          orderBy: { code: 'asc' },
          include: {
            reviews: {
              orderBy: { createdAt: 'desc' },
              include: { reviewer: { select: { id: true, fullName: true, role: true } } },
            },
          },
        });

        if (cachedCases.length > 0) {
          logger.info(
            { requirementId, generationId: cachedGen.id, hash: inputHash.slice(0, 8) },
            '[GenerateTestCasesUseCase] Reutilizando generación previa idéntica en caché'
          );

          return {
            cases: cachedCases.map((tc) => ({
              ...tc,
              preconditions: tc.preconditions,
              steps: tc.steps,
              originalContent: tc.originalContent,
            })),
            generation: {
              id: cachedGen.id,
              provider: cachedGen.provider,
              model: cachedGen.model,
              inputTokens: 0,
              outputTokens: 0,
              estimatedCost: 0,
              responseTimeMs: cachedGen.responseTimeMs,
              cached: true,
            },
          };
        }
      }
    }

    // 5. Guardrails de Seguridad: Anti-Prompt Injection & Anonimización PII compartida
    PromptGuard.assertSafe(requirement.title);
    PromptGuard.assertSafe(requirement.description);
    PromptGuard.assertSafe(requirement.acceptanceCriteria);

    const masking = PIIMasker.maskMultiple({
      title: requirement.title,
      description: requirement.description,
      criteria: requirement.acceptanceCriteria,
    });

    if (masking.totalMasked > 0) {
      logger.info(
        { tokensAnonimizados: masking.totalMasked },
        '[GenerateTestCasesUseCase] PII detectado y enmascarado antes del envío a la IA'
      );
    }

    // 6. Invocación al proveedor de IA Real (fuera de la transacción de BD)
    const aiProvider = AIFactory.getProvider(selectedProvider);
    const startTime = Date.now();
    let result: AIGenerationResult;

    try {
      result = await aiProvider.generateTestCases(
        requirement.code,
        masking.maskedFields.title,
        masking.maskedFields.description,
        masking.maskedFields.criteria,
        {
          model: selectedModel,
          temperature,
        }
      );

      // Si hubo PII enmascarado, restaurar en todos los casos generados
      if (masking.piiFound) {
        result.cases = result.cases.map((c) => ({
          ...c,
          title: PIIMasker.unmask(c.title, masking.maskMap),
          expectedResult: PIIMasker.unmask(c.expectedResult, masking.maskMap),
          preconditions: (c.preconditions || []).map((p) => PIIMasker.unmask(p, masking.maskMap)),
          steps: (c.steps || []).map((s) => PIIMasker.unmask(s, masking.maskMap)),
          testData: c.testData ? PIIMasker.unmask(c.testData, masking.maskMap) : c.testData,
        }));
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const latency = Date.now() - startTime;

      // Registrar la ejecución fallida para trazabilidad y auditoría
      await prisma.aiGeneration.create({
        data: {
          requirementId,
          userId,
          requirementVersion: requirement.version,
          provider: selectedProvider,
          model: selectedModel,
          promptVersion: 'v1.0',
          inputTokens: 0,
          outputTokens: 0,
          estimatedCost: null,
          responseTimeMs: latency,
          inputHash,
          status: 'FAILED',
          errorMessage: errorMsg.slice(0, 500),
        },
      });

      logger.error(
        { provider: selectedProvider, model: selectedModel, error: errorMsg },
        '[GenerateTestCasesUseCase] Fallo al invocar proveedor de IA'
      );

      throw ApiError.badGateway(
        `Fallo al generar casos con el proveedor '${selectedProvider}': ${errorMsg}. Verifique la API key o intente nuevamente.`
      );
    }

    const responseTimeMs = Date.now() - startTime;

    // 7. Persistencia transaccional corta con reserva atómica de códigos CP-XXX
    const { createdCases, generationRecord } = await prisma.$transaction(async (tx) => {
      // Bloquear fila del requisito para reservar códigos secuenciales atómicamente
      const currentReq = await tx.requirement.findUniqueOrThrow({
        where: { id: requirementId },
        select: { nextCaseNumber: true, version: true },
      });

      const startCodeNum = currentReq.nextCaseNumber;
      const nextCodeNum = startCodeNum + result.cases.length;

      // Actualizar contador atómico del requisito
      await tx.requirement.update({
        where: { id: requirementId },
        data: {
          nextCaseNumber: nextCodeNum,
          status: 'GENERATED',
        },
      });

      // Crear registro de auditoría de la llamada a IA exitosa
      const genRecord = await tx.aiGeneration.create({
        data: {
          requirementId,
          userId,
          requirementVersion: currentReq.version,
          provider: result.provider,
          model: result.model,
          promptVersion: result.promptVersion || 'v1.0',
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          estimatedCost: result.estimatedCost,
          responseTimeMs,
          inputHash,
          status: 'SUCCEEDED',
        },
      });

      // Insertar los casos generados asociados a la generación y versión del requisito
      const inserted = [];
      for (let i = 0; i < result.cases.length; i++) {
        const c = result.cases[i];
        const codeNum = startCodeNum + i;
        const code = `CP-${String(codeNum).padStart(3, '0')}`;

        const created = await tx.testCase.create({
          data: {
            requirementId,
            generationId: genRecord.id,
            code,
            type: c.type,
            title: c.title,
            preconditions: c.preconditions,
            steps: c.steps,
            testData: c.testData || null,
            expectedResult: c.expectedResult,
            priority: c.priority,
            evidenceStatus: c.evidenceStatus,
            evidenceText: c.evidenceText || null,
            originalContent: {
              title: c.title,
              type: c.type,
              preconditions: c.preconditions,
              steps: c.steps,
              expectedResult: c.expectedResult,
              priority: c.priority,
              evidenceStatus: c.evidenceStatus,
              evidenceText: c.evidenceText,
            },
            version: 1,
            requirementVersion: currentReq.version,
            isObsolete: false,
            source: 'AI_GENERATED',
            status: 'PENDING',
          },
        });
        inserted.push(created);
      }

      return { createdCases: inserted, generationRecord: genRecord };
    });

    // 8. Detección informativa de duplicados potenciales entre los casos del requisito (RF-14)
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
        provider: result.provider,
        casesCount: createdCases.length,
        cost: result.estimatedCost,
        duplicateWarningsCount: duplicateWarnings.length,
      },
      '[GenerateTestCasesUseCase] Generación exitosa de casos de prueba con IA real'
    );

    return {
      cases: createdCases,
      generation: {
        id: generationRecord.id,
        provider: result.provider,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        estimatedCost: result.estimatedCost,
        responseTimeMs,
        cached: false,
      },
      duplicateWarnings: duplicateWarnings.length > 0 ? duplicateWarnings : undefined,
    };
  }
}
