// ==============================================================================
// Application Use Case: GenerateFromFormalUseCase
// Genera casos de prueba formales deterministas sin IA (ISTQB CTFL v4.0):
// - Tablas de Decisión (Decision Tables)
// - Transición de Estados (State Transition)
// - Pairwise Combinatorio (All-Pairs)
// - Heurística de Adivinanza de Errores (Error Guessing)
// - Árboles de Clasificación (Classification Tree Method - CTM)
// - Casos de Uso (Use Case Scenario Engine)
// ==============================================================================

import { prisma } from '../../config/prisma';
import { logger } from '../../common/utils/logger';
import { ApiError } from '../../common/errors/api-error';
import { SecurityPolicy } from '../../core/domain/security/security-policy';
import {
  DecisionTableEngine,
  StateTransitionEngine,
  PairwiseEngine,
  ErrorGuessingEngine,
  ClassificationTreeEngine,
  UseCaseEngine,
  FormalGeneratedCase,
  DecisionCondition,
  DecisionAction,
  StateTransition,
  ParameterOption,
  ClassificationClass,
  UseCaseInput,
} from '../../core/test-design/formal-methods';

export type FormalMethodType =
  | 'decision_table'
  | 'state_transition'
  | 'pairwise'
  | 'error_guessing'
  | 'classification_tree'
  | 'use_case';

export interface GenerateFromFormalInputDTO {
  requirementId: string;
  method: FormalMethodType;
  userId: string;
  userRole: string;
  payload: {
    conditions?: DecisionCondition[];
    actions?: DecisionAction[];
    states?: string[];
    validTransitions?: StateTransition[];
    parameters?: ParameterOption[];
    classes?: ClassificationClass[];
    useCase?: UseCaseInput;
    entityName?: string;
  };
}

export class GenerateFromFormalUseCase {
  public async execute(input: GenerateFromFormalInputDTO) {
    const { requirementId, method, userId, userRole, payload } = input;

    // 1. Validar requisito y proyecto
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

    // 2. Invocar motor formal determinista correspondiente
    let generatedCases: FormalGeneratedCase[] = [];

    switch (method) {
      case 'decision_table': {
        const conditions = payload.conditions || [
          { id: 'C1', label: '¿Usuario autenticado?' },
          { id: 'C2', label: '¿Datos válidos?' },
        ];
        const actions = payload.actions || [
          { id: 'A1', label: 'Operación exitosa procesada' },
          { id: 'A2', label: 'Error de validación retornado' },
        ];
        generatedCases = DecisionTableEngine.generate(conditions, actions, requirement.title);
        break;
      }

      case 'state_transition': {
        const states = payload.states || ['Borrador', 'En Revisión', 'Aprobado', 'Rechazado'];
        const transitions = payload.validTransitions || [
          { from: 'Borrador', to: 'En Revisión', event: 'Enviar a revisión' },
          { from: 'En Revisión', to: 'Aprobado', event: 'Aprobar auditoría' },
          { from: 'En Revisión', to: 'Rechazado', event: 'Rechazar auditoría' },
        ];
        generatedCases = StateTransitionEngine.generate(states, transitions, requirement.title);
        break;
      }

      case 'pairwise': {
        const params = payload.parameters || [
          { param: 'Navegador', values: ['Chrome', 'Firefox', 'Safari'] },
          { param: 'Dispositivo', values: ['Desktop', 'Mobile', 'Tablet'] },
          { param: 'Conexión', values: ['WiFi', '4G', 'Offline'] },
        ];
        generatedCases = PairwiseEngine.generate(params, requirement.title);
        break;
      }

      case 'error_guessing': {
        const entityName = payload.entityName || requirement.title;
        generatedCases = ErrorGuessingEngine.generate(entityName);
        break;
      }

      case 'classification_tree': {
        const classes = payload.classes || [
          { name: 'Monto Transacción', elements: ['Bajo (< S/.100)', 'Medio (S/.100-S/.1000)', 'Alto (> S/.1000)'] },
          { name: 'Canal', elements: ['Web', 'App Móvil', 'API'] },
        ];
        generatedCases = ClassificationTreeEngine.generate(classes, requirement.title);
        break;
      }

      case 'use_case': {
        const ucSpec: UseCaseInput = payload.useCase || {
          name: requirement.title,
          actor: 'Usuario Final',
          happyPathSteps: [
            'Navegar al módulo.',
            'Ingresar datos requeridos.',
            'Confirmar transacción y verificar persistencia.',
          ],
          alternativeFlows: [
            {
              name: 'Guardado Parcial en Borrador',
              condition: 'El usuario presiona "Guardar como borrador"',
              steps: ['Ingresar datos preliminares.', 'Presionar "Guardar borrador".'],
            },
          ],
          exceptionFlows: [
            {
              name: 'Pérdida de Conexión',
              trigger: 'Fallo de red durante el guardado',
              steps: ['Presionar guardar.', 'Simular desconexión.'],
              expectedError: 'Error 503 / Sin conexión: reintento automático',
            },
          ],
        };
        generatedCases = UseCaseEngine.generate(ucSpec);
        break;
      }

      default:
        throw ApiError.badRequest(`Método formal '${method}' no reconocido.`);
    }

    if (generatedCases.length === 0) {
      throw ApiError.badRequest('No se pudieron derivar casos con los parámetros proporcionados.');
    }

    // 3. Persistencia atómica de casos correlativos CP-XXX
    const insertedCases = await prisma.$transaction(async (tx) => {
      const currentReq = await tx.requirement.findUniqueOrThrow({
        where: { id: requirementId },
        select: { nextCaseNumber: true, version: true },
      });

      let nextNum = currentReq.nextCaseNumber;
      const createdList = [];

      for (const gc of generatedCases) {
        const code = `CP-${String(nextNum).padStart(3, '0')}`;
        nextNum++;

        const tc = await tx.testCase.create({
          data: {
            requirementId,
            generationId: null,
            code,
            type: gc.type,
            title: gc.title,
            preconditions: gc.preconditions,
            steps: gc.steps,
            testData: gc.testData,
            expectedResult: gc.expectedResult,
            priority: gc.priority,
            evidenceStatus: 'pending',
            originalContent: {
              title: gc.title,
              type: gc.type,
              preconditions: gc.preconditions,
              steps: gc.steps,
              expectedResult: gc.expectedResult,
              priority: gc.priority,
              technique: gc.technique,
            },
            version: 1,
            requirementVersion: currentReq.version,
            isObsolete: false,
            source: 'FORMAL_DESIGN',
            status: 'PENDING',
          },
        });

        createdList.push(tc);
      }

      // Actualizar contador correlativo
      await tx.requirement.update({
        where: { id: requirementId },
        data: { nextCaseNumber: nextNum },
      });

      return createdList;
    });

    logger.info(
      { requirementId, method, casesGenerated: insertedCases.length },
      'Casos de prueba formales generados y persistidos exitosamente'
    );

    return {
      method,
      requirementId,
      casesInserted: insertedCases.length,
      cases: insertedCases,
    };
  }
}
