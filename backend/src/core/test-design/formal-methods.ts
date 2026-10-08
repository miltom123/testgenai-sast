// ==============================================================================
// Core Domain: FormalMethodsEngine (ISTQB CTFL v4.0 Black-Box Test Design)
// Motores Deterministas de Diseño Formal de Pruebas:
// 1. Tablas de Decisión (Decision Table Testing)
// 2. Pruebas de Transición de Estados (State Transition Testing)
// 3. Pruebas Combinatorias Pairwise (All-Pairs Testing)
// 4. Casos de Uso (Use Case Scenario Engine)
// 5. Adivinanza Heurística de Errores (Error Guessing Engine)
// ==============================================================================

export interface FormalGeneratedCase {
  type: 'positive' | 'negative' | 'alternative' | 'boundary' | 'validation';
  title: string;
  preconditions: string[];
  steps: string[];
  testData: string;
  expectedResult: string;
  priority: 'high' | 'medium' | 'low';
  technique: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. MOTOR DE TABLAS DE DECISIÓN (DECISION TABLE TESTING)
// ──────────────────────────────────────────────────────────────────────────────

export interface DecisionCondition {
  id: string; // ej. "C1"
  label: string; // ej. "¿Es cliente VIP?"
}

export interface DecisionAction {
  id: string; // ej. "A1"
  label: string; // ej. "Aplicar 20% de descuento"
}

export class DecisionTableEngine {
  /**
   * Genera casos deterministas a partir de condiciones y acciones lógicas.
   * Modela la matriz de verdad de 2^N reglas.
   */
  public static generate(
    conditions: DecisionCondition[],
    actions: DecisionAction[],
    requirementTitle = 'Requisito'
  ): FormalGeneratedCase[] {
    if (conditions.length === 0) return [];

    const n = Math.min(conditions.length, 5); // Limitar a 2^5 = 32 reglas para evitar explosión combinatoria
    const totalRules = Math.pow(2, n);
    const cases: FormalGeneratedCase[] = [];

    for (let r = 0; r < totalRules; r++) {
      const conditionStates: { label: string; state: boolean }[] = [];

      for (let c = 0; c < n; c++) {
        // Extraer bit para la condición c en la regla r
        const state = Boolean((r >> (n - 1 - c)) & 1);
        conditionStates.push({ label: conditions[c].label, state });
      }

      const allTrue = conditionStates.every((cs) => cs.state);
      const allFalse = conditionStates.every((cs) => !cs.state);

      const type: FormalGeneratedCase['type'] = allTrue
        ? 'positive'
        : allFalse
        ? 'negative'
        : 'alternative';

      const ruleNum = r + 1;
      const condSummary = conditionStates
        .map((cs) => `${cs.label}: ${cs.state ? 'SÍ' : 'NO'}`)
        .join(' | ');

      const expectedAction = allTrue
        ? actions[0]?.label || 'Acción exitosa permitida'
        : allFalse
        ? 'Operación denegada: no se cumple ninguna condición'
        : actions[1]?.label || 'Acción alternativa aplicada según combinación de reglas';

      cases.push({
        type,
        title: `[Tabla de Decisión - R${ruleNum}] ${allTrue ? 'Camino óptimo' : allFalse ? 'Rechazo total' : 'Flujo condicional'} — ${requirementTitle}`,
        preconditions: [
          'El sistema se encuentra en estado operativo normal.',
          `Configuración de estado de negocio evaluada: ${condSummary}.`,
        ],
        steps: [
          `1. Configurar las condiciones de entrada: ${condSummary}.`,
          '2. Ejecutar la acción o transacción evaluada.',
          '3. Verificar la respuesta del motor de reglas del sistema.',
        ],
        testData: `Regla ${ruleNum}: [${condSummary}]`,
        expectedResult: `El sistema evalúa la tabla de verdad y ejecuta: ${expectedAction}.`,
        priority: allTrue || allFalse ? 'high' : 'medium',
        technique: 'DECISION_TABLE',
      });
    }

    return cases;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. MOTOR DE TRANSICIÓN DE ESTADOS (STATE TRANSITION TESTING)
// ──────────────────────────────────────────────────────────────────────────────

export interface StateTransition {
  from: string;
  to: string;
  event: string;
  action?: string;
}

export class StateTransitionEngine {
  /**
   * Genera casos de prueba para transiciones válidas (0-switch) y negativas (transiciones ilegales).
   */
  public static generate(
    states: string[],
    validTransitions: StateTransition[],
    requirementTitle = 'Entidad'
  ): FormalGeneratedCase[] {
    const cases: FormalGeneratedCase[] = [];

    // 1. Cobertura de 0-Switch: Todas las transiciones válidas
    validTransitions.forEach((trans, idx) => {
      cases.push({
        type: 'positive',
        title: `[Transición de Estado] ${trans.from} ➔ ${trans.to} mediante evento "${trans.event}" — ${requirementTitle}`,
        preconditions: [
          `La entidad se encuentra en el estado inicial "${trans.from}".`,
          'El usuario cuenta con permisos para disparar el evento.',
        ],
        steps: [
          `1. Ubicar la entidad en estado "${trans.from}".`,
          `2. Accionar el evento "${trans.event}".`,
          `3. Confirmar la transición.`,
        ],
        testData: `Estado anterior: ${trans.from} | Evento: ${trans.event} | Estado esperado: ${trans.to}`,
        expectedResult: `La entidad transiciona exitosamente al estado "${trans.to}" y registra la acción en el historial.`,
        priority: 'high',
        technique: 'STATE_TRANSITION_VALID',
      });
    });

    // 2. Transiciones ilegales (Casos negativos de robustez)
    const validPairs = new Set(validTransitions.map((t) => `${t.from}->${t.to}`));

    if (states.length >= 2) {
      // Tomar primer estado y último estado para probar salto ilegal
      const firstState = states[0];
      const lastState = states[states.length - 1];

      if (!validPairs.has(`${firstState}->${lastState}`)) {
        cases.push({
          type: 'negative',
          title: `[Transición Inválida] Rechazo de salto ilegal directo de "${firstState}" a "${lastState}" — ${requirementTitle}`,
          preconditions: [
            `La entidad se encuentra en el estado inicial "${firstState}".`,
          ],
          steps: [
            `1. Ubicar la entidad en estado "${firstState}".`,
            `2. Intentar forzar el cambio de estado directo a "${lastState}" sin pasar por los estados intermedios.`,
          ],
          testData: `Intento de transición prohibida: ${firstState} ➔ ${lastState}`,
          expectedResult: `El sistema bloquea la operación y retorna error de transición ilegal de máquina de estados.`,
          priority: 'high',
          technique: 'STATE_TRANSITION_ILLEGAL',
        });
      }

      // Intentar modificar desde estado terminal
      cases.push({
        type: 'negative',
        title: `[Estado Terminal] Impedir modificación de entidad en estado final "${lastState}" — ${requirementTitle}`,
        preconditions: [`La entidad se encuentra en estado terminal "${lastState}".`],
        steps: [
          `1. Consultar la entidad en estado "${lastState}".`,
          `2. Intentar editar o modificar los campos de la entidad.`,
        ],
        testData: `Estado terminal inmutable: ${lastState}`,
        expectedResult: `El sistema no permite edición en estado terminal; los controles se muestran bloqueados o en modo solo lectura.`,
        priority: 'high',
        technique: 'STATE_TRANSITION_TERMINAL',
      });
    }

    return cases;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. MOTOR DE PRUEBAS COMBINATORIAS PAIRWISE (ALL-PAIRS TESTING)
// ──────────────────────────────────────────────────────────────────────────────

export interface ParameterOption {
  param: string;
  values: string[];
}

export class PairwiseEngine {
  /**
   * Genera un conjunto mínimo ortogonal de combinaciones de 2 vías (2-way / all-pairs).
   * Algoritmo determinista voraz (Greedy All-Pairs Approximation).
   */
  public static generate(
    parameters: ParameterOption[],
    requirementTitle = 'Configuración'
  ): FormalGeneratedCase[] {
    if (parameters.length < 2) return [];

    // Recolectar todos los pares requeridos
    const missingPairs = new Set<string>();

    for (let i = 0; i < parameters.length; i++) {
      for (let j = i + 1; j < parameters.length; j++) {
        for (const valA of parameters[i].values) {
          for (const valB of parameters[j].values) {
            missingPairs.add(`${i}:${valA}|${j}:${valB}`);
          }
        }
      }
    }

    const testRuns: Record<string, string>[] = [];
    const maxCombinations = 25; // Cota de seguridad

    while (missingPairs.size > 0 && testRuns.length < maxCombinations) {
      // Elegir el siguiente caso vorazmente cubriendo la mayor cantidad de pares faltantes
      const currentRun: Record<string, string> = {};

      for (let i = 0; i < parameters.length; i++) {
        const param = parameters[i];
        let bestVal = param.values[0];
        let maxCovered = -1;

        for (const val of param.values) {
          let count = 0;
          for (let j = 0; j < i; j++) {
            const pairKey = `${j}:${currentRun[parameters[j].param]}|${i}:${val}`;
            if (missingPairs.has(pairKey)) count++;
          }
          if (count > maxCovered) {
            maxCovered = count;
            bestVal = val;
          }
        }
        currentRun[param.param] = bestVal;
      }

      // Eliminar pares cubiertos por esta corrida
      for (let i = 0; i < parameters.length; i++) {
        for (let j = i + 1; j < parameters.length; j++) {
          const pairKey = `${i}:${currentRun[parameters[i].param]}|${j}:${currentRun[parameters[j].param]}`;
          missingPairs.delete(pairKey);
        }
      }

      testRuns.push(currentRun);
    }

    return testRuns.map((run, idx) => {
      const summary = Object.entries(run)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');

      return {
        type: idx === 0 ? 'positive' : 'boundary',
        title: `[Pairwise Combinatorio #${idx + 1}] Combinación ortogonal: ${summary} — ${requirementTitle}`,
        preconditions: [
          'El entorno de pruebas soporta las matrices de configuración seleccionadas.',
        ],
        steps: [
          `1. Establecer los parámetros de entorno/entrada: ${summary}.`,
          '2. Ejecutar el caso de prueba o flujo correspondiente.',
          '3. Validar consistencia y ausencia de incompatibilidades.',
        ],
        testData: `Parámetros: ${summary}`,
        expectedResult: `El sistema procesa la combinación [${summary}] correctamente sin colapsar ni degradar la integridad.`,
        priority: idx === 0 ? 'high' : 'medium',
        technique: 'PAIRWISE_ALL_PAIRS',
      };
    });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. MOTOR HEURÍSTICO DE ADIVINANZA DE ERRORES (ERROR GUESSING TAXONOMY)
// ──────────────────────────────────────────────────────────────────────────────

export class ErrorGuessingEngine {
  /**
   * Genera casos de prueba basados en fallos recurrentes de software.
   */
  public static generate(entityName: string): FormalGeneratedCase[] {
    return [
      {
        type: 'negative',
        title: `[Adivinanza de Error] Pérdida de foco y doble clic rápido — ${entityName}`,
        preconditions: ['El formulario contiene botones de acción con persistencia en BD.'],
        steps: [
          '1. Completar el formulario.',
          '2. Hacer clic rápidamente 3 veces consecutivas en "Aceptar/Enviar".',
        ],
        testData: '3 eventos de clic en intervalo < 200ms',
        expectedResult: 'El sistema desactiva el botón al primer clic y previene duplicación de registros.',
        priority: 'high',
        technique: 'ERROR_GUESSING_DOUBLE_CLICK',
      },
      {
        type: 'validation',
        title: `[Adivinanza de Error] Espacios en blanco al inicio y final en campos clave — ${entityName}`,
        preconditions: ['El campo es un identificador o texto descriptivo.'],
        steps: [
          '1. Ingresar texto con espacios antes y después (ej. "   valor con espacios   ").',
          '2. Guardar y verificar el valor almacenado.',
        ],
        testData: '"   texto con espacios perimetrales   "',
        expectedResult: 'El sistema aplica trim() automáticamente o preserva los espacios sin generar errores de consulta.',
        priority: 'medium',
        technique: 'ERROR_GUESSING_TRIM',
      },
      {
        type: 'negative',
        title: `[Adivinanza de Error] Sesión caducada durante la edición de datos — ${entityName}`,
        preconditions: ['El usuario tiene el formulario abierto por tiempo prolongado.'],
        steps: [
          '1. Abrir formulario de edición.',
          '2. Esperar expiración de sesión JWT o invalidar token en otra pestaña.',
          '3. Intentar guardar el formulario.',
        ],
        testData: 'Token JWT expirado en cabecera HTTP',
        expectedResult: 'El sistema retorna 401 Unauthorized sin perder los datos editados localmente.',
        priority: 'high',
        technique: 'ERROR_GUESSING_SESSION_EXPIRY',
      },
    ];
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. MOTOR DE ÁRBOLES DE CLASIFICACIÓN (CLASSIFICATION TREE METHOD - CTM)
// ──────────────────────────────────────────────────────────────────────────────

export interface ClassificationClass {
  name: string; // ej. "Tipo de Tarjeta"
  elements: string[]; // ej. ["Débito", "Crédito", "Prepago"]
}

export class ClassificationTreeEngine {
  /**
   * Genera combinaciones representativas seleccionando un elemento de cada clase de clasificación.
   */
  public static generate(
    classes: ClassificationClass[],
    requirementTitle = 'Funcionalidad'
  ): FormalGeneratedCase[] {
    if (classes.length === 0) return [];

    // Combinación de cobertura ortogonal mínima
    const maxLen = Math.max(...classes.map((c) => c.elements.length));
    const cases: FormalGeneratedCase[] = [];

    for (let i = 0; i < maxLen; i++) {
      const selected = classes.map((c) => ({
        class: c.name,
        value: c.elements[i % c.elements.length],
      }));

      const spec = selected.map((s) => `${s.class}: ${s.value}`).join(' | ');

      cases.push({
        type: i === 0 ? 'positive' : 'boundary',
        title: `[CTM Árbol de Clasificación #${i + 1}] Combinación de particiones disjuntas — ${requirementTitle}`,
        preconditions: [
          'El árbol de clasificación contiene clases disjuntas mutuamente excluyentes.',
        ],
        steps: [
          `1. Configurar los atributos de entrada según las hojas seleccionadas: ${spec}.`,
          '2. Ejecutar la acción del sistema.',
          '3. Validar el comportamiento esperado.',
        ],
        testData: `Selección CTM: [${spec}]`,
        expectedResult: `El sistema procesa la combinación [${spec}] sin conflictos en las clases de clasificación.`,
        priority: i === 0 ? 'high' : 'medium',
        technique: 'CLASSIFICATION_TREE_METHOD',
      });
    }

    return cases;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. MOTOR BASADO EN CASOS DE USO (USE CASE SCENARIO ENGINE)
// ──────────────────────────────────────────────────────────────────────────────

export interface UseCaseInput {
  name: string;
  actor: string;
  happyPathSteps: string[];
  alternativeFlows?: { name: string; condition: string; steps: string[] }[];
  exceptionFlows?: { name: string; trigger: string; steps: string[]; expectedError: string }[];
}

export class UseCaseEngine {
  /**
   * Deriva casos de prueba para el flujo básico, flujos alternativos y excepciones.
   */
  public static generate(uc: UseCaseInput): FormalGeneratedCase[] {
    const cases: FormalGeneratedCase[] = [];

    // 1. Curso Básico (Happy Path)
    cases.push({
      type: 'positive',
      title: `[Caso de Uso - Camino Feliz] Ejecución exitosa de "${uc.name}"`,
      preconditions: [
        `El actor principal "${uc.actor}" ha iniciado sesión.`,
        'Los datos requeridos se encuentran disponibles.',
      ],
      steps: uc.happyPathSteps.map((step, idx) => `${idx + 1}. ${step}`),
      testData: `Actor: ${uc.actor} | Flujo principal sin interrupciones`,
      expectedResult: `El flujo básico del caso de uso "${uc.name}" se completa exitosamente y el estado queda persistido.`,
      priority: 'high',
      technique: 'USE_CASE_BASIC_COURSE',
    });

    // 2. Flujos Alternativos
    if (uc.alternativeFlows) {
      uc.alternativeFlows.forEach((alt, idx) => {
        cases.push({
          type: 'alternative',
          title: `[Caso de Uso - Flujo Alternativo] ${alt.name} en "${uc.name}"`,
          preconditions: [
            `El actor "${uc.actor}" ejecuta la transacción.`,
            `Condición de desvío activada: ${alt.condition}.`,
          ],
          steps: alt.steps.map((step, sIdx) => `${sIdx + 1}. ${step}`),
          testData: `Condición alternativa: ${alt.condition}`,
          expectedResult: `El sistema completa el flujo alternativo y converge al objetivo del caso de uso.`,
          priority: 'medium',
          technique: 'USE_CASE_ALTERNATIVE_FLOW',
        });
      });
    }

    // 3. Flujos de Excepción
    if (uc.exceptionFlows) {
      uc.exceptionFlows.forEach((exc, idx) => {
        cases.push({
          type: 'negative',
          title: `[Caso de Uso - Flujo de Excepción] ${exc.name} en "${uc.name}"`,
          preconditions: [
            `Ocurre la condición de fallo/cancelación: ${exc.trigger}.`,
          ],
          steps: exc.steps.map((step, sIdx) => `${sIdx + 1}. ${step}`),
          testData: `Disparador de excepción: ${exc.trigger}`,
          expectedResult: `El sistema intercepta el error, cancela la transacción de forma segura y muestra: "${exc.expectedError}".`,
          priority: 'high',
          technique: 'USE_CASE_EXCEPTION_FLOW',
        });
      });
    }

    return cases;
  }
}

