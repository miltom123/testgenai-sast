// ==========================================================================
// Core Spec Engine: DeterministicTestDeriver
// Deriva casos de prueba a partir de un requisito combinando técnicas
// deterministas: escenarios BDD, flujos del caso de uso, BVA de 3 puntos,
// plantillas ISTQB y adivinanza de errores. Misma entrada → misma salida.
// ==========================================================================

import { BvaEngine, BvaVariableInput, BvaCalculatedCase } from '../test-design/bva-engine';
import {
  ErrorGuessingEngine,
  FormalGeneratedCase,
  UseCaseEngine,
  UseCaseInput,
} from '../test-design/formal-methods';
import { GherkinCompiler, ScenarioType } from '../test-design/gherkin-compiler';
import { RequirementsQualityGate } from '../test-design/requirements-quality-gate';
import { ISTQB_TEMPLATES, hydrateTemplate } from '../templates/istqb-templates';
import { TextNormalizer } from './text-normalizer';
import { DerivationDepth, FlowAlternative, FlowException, Priority } from './spec-types';

export interface DerivationInput {
  code?: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  priority?: Priority;
  variables?: BvaVariableInput[];
  templateCategory?: string | null;
  useCase?: UseCaseInput | null;
  useCaseCode?: string | null;
  depth: DerivationDepth;
}

export interface DerivedTestCase {
  type: ScenarioType;
  title: string;
  preconditions: string[];
  steps: string[];
  testData: string | null;
  expectedResult: string;
  priority: Priority;
  evidenceStatus: 'derived' | 'suggested';
  evidenceText: string | null;
  technique: string;
}

export const DERIVATION_LIMITS: Record<DerivationDepth, number> = {
  basic: 8,
  standard: 20,
  exhaustive: 40,
};

/** Etiquetas BVA incluidas en profundidad estándar (frontera esencial de 5 puntos). */
const STANDARD_BVA_TAGS: ReadonlySet<string> = new Set([
  'EP_NOMINAL',
  'BVA_MIN_EXACT',
  'BVA_MAX_EXACT',
  'BVA_BELOW_MIN',
  'BVA_ABOVE_MAX',
  'EP_STRING_NOMINAL',
  'BVA_STRING_MIN_EXACT',
  'BVA_STRING_MAX_EXACT',
  'BVA_STRING_EMPTY',
  'BVA_STRING_ABOVE_MAX',
]);

const USE_CASE_TECHNIQUE_LABELS: Record<string, string> = {
  USE_CASE_BASIC_COURSE: 'flujo principal',
  USE_CASE_ALTERNATIVE_FLOW: 'flujo alternativo',
  USE_CASE_EXCEPTION_FLOW: 'flujo de excepción',
};

export class DeterministicTestDeriver {
  /** Deriva el conjunto completo de casos para la profundidad indicada. */
  public static derive(input: DerivationInput): DerivedTestCase[] {
    const depth = input.depth || 'standard';
    const collected: DerivedTestCase[] = [];

    // 1. Escenarios BDD de los criterios de aceptación (evidencia directa)
    const gherkinCases = this.fromGherkin(input);
    collected.push(...gherkinCases);

    // 2. Respaldo cuando el requisito no tiene escenarios estructurados
    if (gherkinCases.length === 0) {
      collected.push(...this.fallbackCases(input));
    }

    // 3. Flujos del caso de uso vinculado
    if (depth !== 'basic' && input.useCase) {
      collected.push(...this.fromUseCase(input));
    }

    // 4. Análisis de valores límite sobre variables explícitas y extraídas
    if (depth !== 'basic') {
      collected.push(...this.fromVariables(input, depth));
    }

    // 5. Profundidad exhaustiva: plantilla ISTQB y adivinanza de errores
    if (depth === 'exhaustive') {
      collected.push(...this.fromTemplate(input));
      collected.push(...this.fromErrorGuessing(input));
    }

    return this.dedupe(collected).slice(0, DERIVATION_LIMITS[depth]);
  }

  /** Cantidad de casos que produciría derive() para la misma entrada. */
  public static estimate(input: DerivationInput): number {
    return this.derive(input).length;
  }

  /** Construye la entrada del motor de casos de uso desde una especificación. */
  public static buildUseCaseInput(uc: {
    name: string;
    actor: string;
    mainFlow: string[];
    alternativeFlows: FlowAlternative[];
    exceptionFlows: FlowException[];
  }): UseCaseInput {
    return {
      name: uc.name,
      actor: uc.actor,
      happyPathSteps: uc.mainFlow,
      alternativeFlows: uc.alternativeFlows.map((a) => ({
        name: a.name,
        condition: a.condition,
        steps: a.steps,
      })),
      exceptionFlows: uc.exceptionFlows.map((e) => ({
        name: e.name,
        trigger: e.trigger,
        steps: e.steps,
        expectedError: e.expectedError,
      })),
    };
  }

  // ---------------------------------------------------------------------
  // Fuentes de derivación
  // ---------------------------------------------------------------------

  private static fromGherkin(input: DerivationInput): DerivedTestCase[] {
    const compiled = GherkinCompiler.compile(input.acceptanceCriteria, { fallbackName: input.title });
    return compiled.map((c) => ({
      type: c.type,
      title: c.title,
      preconditions: c.preconditions,
      steps: c.steps,
      testData: null,
      expectedResult: c.expectedResult,
      priority: this.priorityFor(c.type, input.priority),
      evidenceStatus: 'derived',
      evidenceText: c.evidenceText,
      technique: 'BDD_SCENARIO',
    }));
  }

  private static fromUseCase(input: DerivationInput): DerivedTestCase[] {
    if (!input.useCase) return [];
    const generated: FormalGeneratedCase[] = UseCaseEngine.generate(input.useCase);
    const codeLabel = input.useCaseCode ? `${input.useCaseCode} ` : '';

    return generated.map((fc) => ({
      type: fc.type,
      title: fc.title,
      preconditions: fc.preconditions,
      steps: fc.steps.map((s) => this.stripNumbering(s)),
      testData: fc.testData || null,
      expectedResult: fc.expectedResult,
      priority: fc.priority,
      evidenceStatus: 'derived',
      evidenceText:
        `Caso de uso ${codeLabel}"${input.useCase!.name}" — ${USE_CASE_TECHNIQUE_LABELS[fc.technique] || fc.technique}`.slice(
          0,
          600
        ),
      technique: fc.technique,
    }));
  }

  private static fromVariables(input: DerivationInput, depth: DerivationDepth): DerivedTestCase[] {
    const variables = this.collectVariables(input, depth === 'exhaustive' ? 3 : 2);
    const out: DerivedTestCase[] = [];

    for (const variable of variables) {
      let calculated: BvaCalculatedCase[] = [];
      try {
        calculated = BvaEngine.calculate(variable);
      } catch {
        continue;
      }

      const selected =
        depth === 'exhaustive' ? calculated : calculated.filter((c) => STANDARD_BVA_TAGS.has(c.tag));

      for (const bc of selected) {
        out.push({
          type: bc.type,
          title: bc.title,
          preconditions: bc.preconditions,
          steps: bc.steps.map((s) => this.stripNumbering(s)),
          testData: bc.testData,
          expectedResult: bc.expectedResult,
          priority: bc.priority,
          evidenceStatus: 'suggested',
          evidenceText: `Análisis de valores límite (ISTQB 3-Point BVA) sobre "${variable.name}" [${variable.min}, ${variable.max}] — ${bc.tag}`,
          technique: `BVA_${bc.tag}`,
        });
      }
    }

    return out;
  }

  private static fromTemplate(input: DerivationInput): DerivedTestCase[] {
    if (!input.templateCategory) return [];
    const template = ISTQB_TEMPLATES.find((t) => t.key === input.templateCategory);
    if (!template) return [];

    return template.cases.slice(0, 5).map((tc) => {
      const hydrated = hydrateTemplate(tc, input.title);
      return {
        type: hydrated.type,
        title: hydrated.titleTemplate,
        preconditions: hydrated.preconditions,
        steps: hydrated.steps,
        testData: null,
        expectedResult: hydrated.expectedResultTemplate,
        priority: hydrated.priority,
        evidenceStatus: 'suggested',
        evidenceText: `Patrón del catálogo ISTQB "${template.name}"`,
        technique: `TEMPLATE_${template.key.toUpperCase()}`,
      };
    });
  }

  private static fromErrorGuessing(input: DerivationInput): DerivedTestCase[] {
    return ErrorGuessingEngine.generate(input.title).map((fc) => ({
      type: fc.type,
      title: fc.title,
      preconditions: fc.preconditions,
      steps: fc.steps.map((s) => this.stripNumbering(s)),
      testData: fc.testData || null,
      expectedResult: fc.expectedResult,
      priority: fc.priority,
      evidenceStatus: 'suggested',
      evidenceText: 'Taxonomía de fallos recurrentes (Error Guessing, ISTQB experiencia)',
      technique: fc.technique,
    }));
  }

  private static fallbackCases(input: DerivationInput): DerivedTestCase[] {
    const ears = RequirementsQualityGate.parseEarsSyntax(input.description);
    const action = ears.pattern === 'NON_EARS' ? input.title : ears.action;
    const evidence = input.description.slice(0, 300);
    const basePriority = input.priority || 'high';

    return [
      {
        type: 'positive',
        title: `Ejecución correcta: ${input.title}`,
        preconditions: ['El actor tiene sesión iniciada y acceso a la funcionalidad.'],
        steps: [
          `Acceder a la funcionalidad "${input.title}".`,
          'Completar los datos requeridos con valores válidos.',
          'Confirmar la operación.',
        ],
        testData: null,
        expectedResult: `El sistema completa la acción (${action}) y refleja el resultado esperado según la descripción del requisito.`,
        priority: basePriority,
        evidenceStatus: 'suggested',
        evidenceText: evidence,
        technique: 'EARS_FALLBACK_POSITIVE',
      },
      {
        type: 'negative',
        title: `Rechazo de datos inválidos: ${input.title}`,
        preconditions: ['El actor tiene acceso a la funcionalidad.'],
        steps: [
          `Acceder a la funcionalidad "${input.title}".`,
          'Ingresar datos que incumplen las reglas descritas en el requisito.',
          'Intentar confirmar la operación.',
        ],
        testData: null,
        expectedResult:
          'El sistema rechaza la operación, muestra un mensaje de error específico y no persiste cambios.',
        priority: basePriority,
        evidenceStatus: 'suggested',
        evidenceText: evidence,
        technique: 'EARS_FALLBACK_NEGATIVE',
      },
      {
        type: 'validation',
        title: `Campos obligatorios: ${input.title}`,
        preconditions: ['El actor tiene acceso a la funcionalidad.'],
        steps: [
          `Acceder a la funcionalidad "${input.title}".`,
          'Dejar vacíos los campos obligatorios.',
          'Intentar confirmar la operación.',
        ],
        testData: null,
        expectedResult: 'El sistema resalta los campos obligatorios faltantes y bloquea la confirmación.',
        priority: 'medium',
        evidenceStatus: 'suggested',
        evidenceText: evidence,
        technique: 'EARS_FALLBACK_VALIDATION',
      },
    ];
  }

  // ---------------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------------

  private static collectVariables(input: DerivationInput, max: number): BvaVariableInput[] {
    const seen = new Set<string>();
    const result: BvaVariableInput[] = [];

    const push = (v: BvaVariableInput) => {
      if (v.min >= v.max) return;
      const key = `${TextNormalizer.comparisonKey(v.name)}|${v.type}|${v.min}|${v.max}`;
      if (seen.has(key)) return;
      seen.add(key);
      result.push(v);
    };

    (input.variables || []).forEach(push);

    if (result.length < max) {
      const extracted = RequirementsQualityGate.extractDeterministicVariables(
        `${input.description}\n${input.acceptanceCriteria}`
      );
      extracted.forEach((v) => push({ name: v.name, type: v.type, min: v.min, max: v.max, unit: v.unit }));
    }

    return result.slice(0, max);
  }

  private static priorityFor(type: ScenarioType, base?: Priority): Priority {
    if (type === 'positive' || type === 'negative') return base || 'high';
    return 'medium';
  }

  private static stripNumbering(step: string): string {
    return step.replace(/^\s*\d+[.)]\s*/, '').trim();
  }

  private static dedupe(cases: DerivedTestCase[]): DerivedTestCase[] {
    const seen = new Set<string>();
    const out: DerivedTestCase[] = [];
    for (const c of cases) {
      const key = TextNormalizer.comparisonKey(c.title);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
    return out;
  }
}
