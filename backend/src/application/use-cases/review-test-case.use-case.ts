// ==========================================================================
// Application Use Case: ReviewTestCaseUseCase
// Punto único de revisión y edición humana (Human-in-the-Loop):
// Optimistic Locking (versión atómica) -> Snapshots completos -> Trazabilidad
// ==========================================================================

import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { logger } from '../../common/utils/logger';
import { SecurityPolicy } from '../../core/domain/security/security-policy';
import { ApiError } from '../../common/errors/api-error';

export interface ReviewTestCaseInputDTO {
  testCaseId: string;
  reviewerId: string;
  reviewerRole: string;
  decision: 'APPROVED' | 'MODIFIED' | 'REJECTED';
  comments?: string;
  justification?: string; // Obligatoria para aprobar casos con evidenceStatus === 'conflict'
  expectedVersion?: number; // Para control de concurrencia optimista
  updates?: {
    title?: string;
    preconditions?: string[];
    steps?: string[];
    testData?: string | null;
    expectedResult?: string;
    priority?: 'high' | 'medium' | 'low';
    evidenceStatus?: 'derived' | 'suggested' | 'ambiguous' | 'conflict' | 'pending';
    evidenceText?: string | null;
  };
}

export class ReviewTestCaseUseCase {
  public async execute(input: ReviewTestCaseInputDTO) {
    const {
      testCaseId,
      reviewerId,
      reviewerRole,
      decision,
      comments,
      justification,
      expectedVersion,
      updates,
    } = input;

    // 1. Autorización de auditoría y rol
    SecurityPolicy.assertCanReview({ userId: reviewerId, role: reviewerRole });

    // 2. Obtener caso con requisito y proyecto para comprobar propiedad
    const currentCase = await prisma.testCase.findUnique({
      where: { id: testCaseId },
      include: {
        requirement: { include: { project: true } },
      },
    });

    if (!currentCase) {
      throw ApiError.notFound(`Caso de prueba con ID ${testCaseId} no encontrado.`);
    }

    if (currentCase.requirement.project.status === 'ARCHIVED') {
      throw ApiError.forbidden('El proyecto está archivado. Reactívelo para realizar revisiones.');
    }

    SecurityPolicy.assertProjectAccess(
      currentCase.requirement.project.ownerId,
      { userId: reviewerId, role: reviewerRole }
    );

    // 3. Verificación de bloqueo optimista (Optimistic Concurrency Control)
    if (expectedVersion !== undefined && currentCase.version !== expectedVersion) {
      throw ApiError.conflict(
        `Conflicto de concurrencia: El caso fue modificado por otro usuario (versión actual: ${currentCase.version}, versión esperada: ${expectedVersion}). Recargue la vista antes de continuar.`
      );
    }

    // 4. Reglas de negocio del README
    // Si se rechaza, exigir una explicación útil
    if (decision === 'REJECTED' && (!comments || comments.trim().length < 3)) {
      throw ApiError.badRequest(
        'Para rechazar un caso de prueba debe proporcionar un comentario justificativo que quede registrado en el historial.'
      );
    }

    // Si se aprueba un caso con evidencia en conflicto, exigir justificación explícita
    const effectiveEvidenceStatus = updates?.evidenceStatus || currentCase.evidenceStatus;
    if (decision === 'APPROVED' && effectiveEvidenceStatus === 'conflict') {
      const explicitJustification = justification?.trim() || comments?.trim();
      if (!explicitJustification || explicitJustification.length < 5) {
        throw ApiError.badRequest(
          'Para aprobar un caso en estado de CONFLICTO debe ingresar una justificación explícita registrada.'
        );
      }
    }

    // 5. Construcción de Snapshots completos (anterior y nuevo)
    const previousSnapshot = {
      title: currentCase.title,
      type: currentCase.type,
      preconditions: currentCase.preconditions,
      steps: currentCase.steps,
      testData: currentCase.testData,
      expectedResult: currentCase.expectedResult,
      priority: currentCase.priority,
      evidenceStatus: currentCase.evidenceStatus,
      evidenceText: currentCase.evidenceText,
      status: currentCase.status,
      version: currentCase.version,
      requirementVersion: currentCase.requirementVersion,
    };

    const newTitle = updates?.title?.trim() || currentCase.title;
    const newPreconditions = updates?.preconditions || currentCase.preconditions;
    const newSteps = updates?.steps || currentCase.steps;
    const newTestData = updates?.testData !== undefined ? updates.testData : currentCase.testData;
    const newExpectedResult = updates?.expectedResult?.trim() || currentCase.expectedResult;
    const newPriority = updates?.priority || currentCase.priority;
    const newEvidenceStatus = updates?.evidenceStatus || currentCase.evidenceStatus;
    const newEvidenceText = updates?.evidenceText !== undefined ? updates.evidenceText : currentCase.evidenceText;

    const newSnapshot = {
      title: newTitle,
      type: currentCase.type,
      preconditions: newPreconditions,
      steps: newSteps,
      testData: newTestData,
      expectedResult: newExpectedResult,
      priority: newPriority,
      evidenceStatus: newEvidenceStatus,
      evidenceText: newEvidenceText,
      status: decision,
      version: currentCase.version + 1,
      requirementVersion: currentCase.requirement.version,
    };

    // 6. Transacción Atómica con incremento de versión y registro de revisión
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar con condición atómica de versión para evitar cualquier condición de carrera
      const updateResult = await tx.testCase.updateMany({
        where: {
          id: testCaseId,
          version: currentCase.version, // Condición atómica
        },
        data: {
          title: newTitle,
          preconditions: newPreconditions as unknown as Prisma.InputJsonValue,
          steps: newSteps as unknown as Prisma.InputJsonValue,
          testData: newTestData,
          expectedResult: newExpectedResult,
          priority: newPriority,
          evidenceStatus: newEvidenceStatus,
          evidenceText: newEvidenceText,
          status: decision,
          version: currentCase.version + 1,
          requirementVersion: currentCase.requirement.version,
          isObsolete: false, // Desmarcar obsolescencia al ser revisado formalmente
          updatedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw ApiError.conflict(
          'Conflicto de concurrencia: Otro usuario modificó el caso simultáneamente. Intente nuevamente.'
        );
      }

      // Insertar el registro de revisión inmutable
      const review = await tx.testCaseReview.create({
        data: {
          testCaseId,
          reviewerId,
          decision,
          comments: comments?.trim() || null,
          justification: justification?.trim() || null,
          reviewedRequirementVersion: currentCase.requirement.version,
          previousContent: previousSnapshot as unknown as Prisma.InputJsonValue,
          newContent: newSnapshot as unknown as Prisma.InputJsonValue,
        },
        include: {
          reviewer: { select: { id: true, fullName: true, role: true } },
        },
      });

      // Obtener el caso actualizado con todas sus relaciones
      const updatedCase = await tx.testCase.findUniqueOrThrow({
        where: { id: testCaseId },
        include: {
          requirement: { select: { id: true, code: true, title: true, version: true } },
          reviews: {
            orderBy: { createdAt: 'desc' },
            include: { reviewer: { select: { id: true, fullName: true, role: true } } },
          },
        },
      });

      return { updatedCase, review };
    });

    logger.info(
      {
        testCaseId,
        decision,
        reviewerId,
        newVersion: currentCase.version + 1,
      },
      '[ReviewTestCaseUseCase] Revisión de caso de prueba guardada exitosamente'
    );

    return {
      testCase: result.updatedCase,
      createdReview: result.review,
    };
  }
}
