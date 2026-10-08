// ==========================================================================
// Core Spec Engine: ProjectSpecEngine
// Analiza el nombre y la descripción de un proyecto y produce de forma
// determinista: actores, módulos, entidades, casos de uso, requisitos
// funcionales y no funcionales con criterios de aceptación en Gherkin.
// Sin IA: detección léxica por catálogo + plantillas parametrizadas.
// ==========================================================================

import {
  ALL_MODULES,
  ACTOR_CATALOG,
  DEFAULT_ADMIN_ACTOR_KEY,
  DEFAULT_PRIMARY_ACTOR_KEY,
  ENTITY_CATALOG,
  ENTITY_MODULE_KEY,
  FALLBACK_MODULE_KEY,
  NON_FUNCTIONAL_MODULE_KEY,
  NON_FUNCTIONAL_TEMPLATES,
  buildEntityCrudUseCase,
  findActor,
  findModule,
} from './catalog';
import { GherkinCompiler } from '../test-design/gherkin-compiler';
import { TextNormalizer } from './text-normalizer';
import { DeterministicTestDeriver } from './test-deriver';
import {
  ActorDefinition,
  ActorRole,
  ActorSpec,
  DerivationDepth,
  DomainModule,
  EntityField,
  EntitySpec,
  ModuleSpec,
  ProjectSpecification,
  RequirementSpec,
  RequirementTemplate,
  ScenarioTemplate,
  UseCaseSpec,
  UseCaseTemplate,
} from './spec-types';

export const SPEC_ENGINE_VERSION = '1.0.0';

export interface SpecEngineInput {
  name: string;
  description: string;
}

export interface SpecEngineOptions {
  depth?: DerivationDepth;
  includeNonFunctional?: boolean;
  includeEntityCrud?: boolean;
  maxModules?: number;
  maxEntities?: number;
}

interface HydrationContext {
  actor: string;
  admin: string;
  project: string;
}

interface ScoredModule {
  module: DomainModule;
  score: number;
  matched: string[];
  implied: boolean;
  order: number;
}

const MODULE_SCORE_THRESHOLD = 2;
const IMPLIED_MODULE_SCORE = 1.5;
const MAX_KEYWORD_HITS = 3;
const MIN_DESCRIPTION_LENGTH = 30;

const PATTERN_ENTITY_REGEX =
  /(?:gestion|gestionar|administrar|administracion|registro|registrar|control|mantenimiento|catalogo|listado|lista|modulo|manejo|seguimiento|inventario) de (?:los |las |el |la |sus |mis |nuestros |nuestras |un |una )?([a-z]{4,})/g;

const DEFAULT_PATTERN_FIELDS: EntityField[] = [
  { name: 'nombre', type: 'text', required: true, unique: true, min: 2, max: 120, unit: 'caracteres' },
  { name: 'descripción', type: 'text', required: false, min: 0, max: 500, unit: 'caracteres' },
  { name: 'estado', type: 'enum', required: true, options: ['activo', 'inactivo'] },
];

export class ProjectSpecEngine {
  public static analyze(input: SpecEngineInput, options: SpecEngineOptions = {}): ProjectSpecification {
    const name = String(input.name || '').trim();
    const description = String(input.description || '').trim();
    const depth: DerivationDepth = options.depth || 'standard';
    const includeNonFunctional = options.includeNonFunctional !== false;
    const includeEntityCrud = options.includeEntityCrud !== false;
    const maxModules = options.maxModules ?? 10;
    const maxEntities = options.maxEntities ?? 8;

    const warnings: string[] = [];
    const normalized = TextNormalizer.normalize(`${name}. ${description}`);

    if (description.length < MIN_DESCRIPTION_LENGTH) {
      warnings.push(
        'La descripción es muy breve; el análisis se basa en pocas señales. Mencione actores, módulos, reglas de negocio y límites numéricos para mejorar la cobertura.'
      );
    }

    // 1. Actores
    const detectedActors = this.detectActors(normalized);
    const detectedActorKeys = new Set(detectedActors.map((a) => a.key));
    if (detectedActors.length === 0) {
      warnings.push('No se identificaron actores explícitos; se asumen "Usuario" y "Administrador".');
    }

    // 2. Módulos
    const scoredModules = this.detectModules(normalized, maxModules, warnings);
    const moduleKeys = new Set(scoredModules.map((s) => s.module.key));

    // 3. Entidades
    const covered = new Set<string>();
    scoredModules.forEach((s) => (s.module.coveredEntities || []).forEach((k) => covered.add(k)));
    const detectedModuleTerms = new Set<string>();
    scoredModules.forEach((s) =>
      s.module.keywords.forEach((k) => detectedModuleTerms.add(TextNormalizer.normalize(k.term)))
    );
    const entities = includeEntityCrud
      ? this.detectEntities(normalized, covered, detectedModuleTerms, maxEntities)
      : [];

    // 4. Construcción de casos de uso y requisitos
    const useCases: UseCaseSpec[] = [];
    const requirements: RequirementSpec[] = [];
    const usedActors = new Map<string, ActorDefinition>();
    let ucCounter = 1;
    let reqCounter = 1;
    const pad = (n: number) => String(n).padStart(3, '0');
    const projectLabel = name || 'el sistema';

    const resolveActor = (module: DomainModule, role: ActorRole): ActorDefinition => {
      if (role === 'admin') {
        const admin = findActor(DEFAULT_ADMIN_ACTOR_KEY)!;
        usedActors.set(admin.key, admin);
        return admin;
      }
      const prefs =
        role === 'secondary' && module.secondaryActors && module.secondaryActors.length > 0
          ? module.secondaryActors
          : module.preferredActors;
      const detectedKey = prefs.find((k) => detectedActorKeys.has(k));
      const key = detectedKey || prefs[0] || DEFAULT_PRIMARY_ACTOR_KEY;
      const actor = findActor(key) || findActor(DEFAULT_PRIMARY_ACTOR_KEY)!;
      usedActors.set(actor.key, actor);
      return actor;
    };

    const buildRequirement = (
      tpl: RequirementTemplate,
      ctx: HydrationContext,
      moduleKey: string,
      useCase: UseCaseSpec | null,
      isPrimary: boolean
    ): RequirementSpec => {
      const scenarios: ScenarioTemplate[] = tpl.scenarios.map((s) => ({
        name: this.hydrate(s.name, ctx),
        type: s.type,
        given: s.given.map((g) => this.hydrate(g, ctx)),
        when: s.when.map((w) => this.hydrate(w, ctx)),
        then: s.then.map((t) => this.hydrate(t, ctx)),
      }));
      const acceptanceCriteria = GherkinCompiler.format(scenarios);
      const title = this.hydrate(tpl.title, ctx);
      const descriptionText = this.hydrate(tpl.description, ctx);
      const variables = (tpl.variables || []).map((v) => ({ ...v }));
      const templateCategory = tpl.templateCategory ?? null;
      const code = `REQ-${pad(reqCounter++)}`;

      const estimatedTestCases = DeterministicTestDeriver.estimate({
        code,
        title,
        description: descriptionText,
        acceptanceCriteria,
        priority: tpl.priority,
        variables,
        templateCategory,
        useCase: isPrimary && useCase ? DeterministicTestDeriver.buildUseCaseInput(useCase) : null,
        useCaseCode: useCase ? useCase.code : null,
        depth,
      });

      return {
        code,
        key: tpl.key,
        title,
        description: descriptionText,
        acceptanceCriteria,
        priority: tpl.priority,
        kind: tpl.kind || 'functional',
        moduleKey,
        useCaseCode: useCase ? useCase.code : null,
        scenarios,
        variables,
        templateCategory,
        estimatedTestCases,
      };
    };

    const addUseCase = (
      tpl: UseCaseTemplate,
      module: DomainModule,
      moduleKey: string,
      moduleName: string
    ) => {
      const actor = resolveActor(module, tpl.actor);
      const ctx: HydrationContext = {
        actor: actor.label.toLowerCase(),
        admin: findActor(DEFAULT_ADMIN_ACTOR_KEY)!.label.toLowerCase(),
        project: projectLabel,
      };
      const h = (t: string) => this.hydrate(t, ctx);

      const uc: UseCaseSpec = {
        code: `UC-${pad(ucCounter++)}`,
        key: tpl.key,
        name: h(tpl.name),
        actor: actor.label,
        moduleKey,
        moduleName,
        priority: tpl.priority,
        description: h(tpl.description),
        preconditions: tpl.preconditions.map(h),
        mainFlow: tpl.mainFlow.map(h),
        alternativeFlows: tpl.alternativeFlows.map((a) => ({
          name: h(a.name),
          condition: h(a.condition),
          steps: a.steps.map(h),
        })),
        exceptionFlows: tpl.exceptionFlows.map((e) => ({
          name: h(e.name),
          trigger: h(e.trigger),
          steps: e.steps.map(h),
          expectedError: h(e.expectedError),
        })),
        postconditions: tpl.postconditions.map(h),
        requirementCodes: [],
      };

      tpl.requirements.forEach((rt, index) => {
        const req = buildRequirement(rt, ctx, moduleKey, uc, index === 0);
        uc.requirementCodes.push(req.code);
        requirements.push(req);
      });

      useCases.push(uc);
    };

    // Orden de generación: autenticación primero (base del resto), luego por puntaje
    const generationOrder = [...scoredModules].sort((a, b) => {
      if (a.module.key === 'authentication') return -1;
      if (b.module.key === 'authentication') return 1;
      if (b.score !== a.score) return b.score - a.score;
      return a.order - b.order;
    });

    for (const scored of generationOrder) {
      for (const tpl of scored.module.useCases) {
        addUseCase(tpl, scored.module, scored.module.key, scored.module.name);
      }
    }

    const moduleSpecs: ModuleSpec[] = scoredModules.map((s) => ({
      key: s.module.key,
      name: s.module.name,
      icon: s.module.icon,
      description: s.module.description,
      score: Math.round(s.score * 10) / 10,
      matchedKeywords: s.matched,
      implied: s.implied,
    }));

    // 4b. CRUD por entidad detectada
    if (entities.length > 0) {
      const entityModule: DomainModule = {
        key: ENTITY_MODULE_KEY,
        name: 'Mantenimiento de Entidades de Negocio',
        icon: '🗃️',
        description: 'Casos de uso CRUD derivados de las entidades mencionadas en la descripción.',
        keywords: [],
        preferredActors:
          detectedActors.length > 0 ? detectedActors.map((a) => a.key) : [DEFAULT_PRIMARY_ACTOR_KEY],
        templateCategory: 'crud',
        useCases: [],
      };
      for (const entity of entities) {
        addUseCase(buildEntityCrudUseCase(entity), entityModule, ENTITY_MODULE_KEY, entityModule.name);
      }
      moduleSpecs.push({
        key: ENTITY_MODULE_KEY,
        name: entityModule.name,
        icon: entityModule.icon,
        description: entityModule.description,
        score: entities.reduce((acc, e) => acc + e.score, 0),
        matchedKeywords: entities.map((e) => e.plural),
        implied: false,
      });
    }

    // 4c. Requisitos no funcionales transversales
    if (includeNonFunctional) {
      const primaryActor = detectedActors.find((a) => !a.isAdmin) || findActor(DEFAULT_PRIMARY_ACTOR_KEY)!;
      usedActors.set(primaryActor.key, primaryActor);
      const ctx: HydrationContext = {
        actor: primaryActor.label.toLowerCase(),
        admin: findActor(DEFAULT_ADMIN_ACTOR_KEY)!.label.toLowerCase(),
        project: projectLabel,
      };
      let added = 0;
      for (const nfr of NON_FUNCTIONAL_TEMPLATES) {
        const applies = !nfr.requiresModules || nfr.requiresModules.some((k) => moduleKeys.has(k));
        if (!applies) continue;
        requirements.push(buildRequirement(nfr.template, ctx, NON_FUNCTIONAL_MODULE_KEY, null, false));
        added++;
      }
      if (added > 0) {
        moduleSpecs.push({
          key: NON_FUNCTIONAL_MODULE_KEY,
          name: 'Requisitos No Funcionales',
          icon: '⚙️',
          description: 'Seguridad, rendimiento, usabilidad e integridad aplicables a todo el sistema.',
          score: 0,
          matchedKeywords: [],
          implied: true,
        });
      }
    }

    // 5. Actores finales (detectados + usados por defecto)
    const actors: ActorSpec[] = detectedActors.map((a) => ({
      key: a.key,
      label: a.label,
      description: a.description,
      isAdmin: Boolean(a.isAdmin),
      source: 'detected',
      score: a.score,
    }));
    for (const used of usedActors.values()) {
      if (!detectedActorKeys.has(used.key)) {
        actors.push({
          key: used.key,
          label: used.label,
          description: used.description,
          isAdmin: Boolean(used.isAdmin),
          source: 'default',
          score: 0,
        });
      }
    }

    const functionalRequirements = requirements.filter((r) => r.kind === 'functional').length;
    const estimatedTestCases = requirements.reduce((acc, r) => acc + r.estimatedTestCases, 0);

    return {
      project: { name, description },
      summary: {
        engineVersion: SPEC_ENGINE_VERSION,
        depth,
        actorsDetected: detectedActors.length,
        modulesDetected: scoredModules.filter((s) => !s.implied).length,
        entitiesDetected: entities.length,
        totalUseCases: useCases.length,
        totalRequirements: requirements.length,
        functionalRequirements,
        nonFunctionalRequirements: requirements.length - functionalRequirements,
        estimatedTestCases,
      },
      actors,
      modules: moduleSpecs,
      entities,
      useCases,
      requirements,
      warnings,
    };
  }

  /** Sustituye los marcadores de las plantillas por los valores del contexto. */
  public static hydrate(text: string, ctx: HydrationContext): string {
    return String(text || '')
      .replace(/\{ACTOR_CAP\}/g, TextNormalizer.capitalize(ctx.actor))
      .replace(/\{ACTOR\}/g, ctx.actor)
      .replace(/\{ADMIN\}/g, ctx.admin)
      .replace(/\{PROJECT\}/g, ctx.project);
  }

  // ---------------------------------------------------------------------
  // Detección
  // ---------------------------------------------------------------------

  private static detectActors(normalized: string): Array<ActorDefinition & { score: number }> {
    const scored = ACTOR_CATALOG.map((actor, order) => {
      const score = actor.keywords.reduce(
        (acc, kw) => acc + TextNormalizer.countOccurrences(normalized, kw),
        0
      );
      return { ...actor, score, order };
    }).filter((a) => a.score > 0);

    scored.sort((a, b) => (b.score !== a.score ? b.score - a.score : a.order - b.order));
    return scored.map(({ order: _order, ...rest }) => rest);
  }

  private static detectModules(normalized: string, maxModules: number, warnings: string[]): ScoredModule[] {
    const scored: ScoredModule[] = [];

    ALL_MODULES.forEach((module, order) => {
      if (module.key === FALLBACK_MODULE_KEY) return;
      let score = 0;
      const matched: string[] = [];
      for (const rule of module.keywords) {
        const hits = TextNormalizer.countOccurrences(normalized, rule.term);
        if (hits > 0) {
          score += Math.min(hits, MAX_KEYWORD_HITS) * rule.weight;
          matched.push(rule.term);
        }
      }
      if (score >= MODULE_SCORE_THRESHOLD) {
        scored.push({ module, score, matched, implied: false, order });
      }
    });

    // Módulos implicados por los detectados
    const present = new Set(scored.map((s) => s.module.key));
    for (const s of [...scored]) {
      for (const impliedKey of s.module.implies || []) {
        if (present.has(impliedKey)) continue;
        const impliedModule = findModule(impliedKey);
        if (!impliedModule) continue;
        present.add(impliedKey);
        scored.push({
          module: impliedModule,
          score: IMPLIED_MODULE_SCORE,
          matched: [],
          implied: true,
          order: ALL_MODULES.indexOf(impliedModule),
        });
      }
    }

    scored.sort((a, b) => (b.score !== a.score ? b.score - a.score : a.order - b.order));

    if (scored.length > maxModules) {
      warnings.push(
        `Se detectaron ${scored.length} módulos; se conservaron los ${maxModules} de mayor puntaje. Divida el proyecto o acote la descripción para cubrir el resto.`
      );
    }
    const limited = scored.slice(0, maxModules);

    if (limited.length === 0) {
      const fallback = findModule(FALLBACK_MODULE_KEY)!;
      limited.push({
        module: fallback,
        score: 0,
        matched: [],
        implied: true,
        order: ALL_MODULES.indexOf(fallback),
      });
      warnings.push(
        'La descripción no coincide con ningún dominio del catálogo; se generó un núcleo funcional genérico. Describa las funciones concretas (por ejemplo: ventas, reservas, inventario, pacientes, cursos) para obtener casos de uso específicos.'
      );
    }

    return limited;
  }

  private static detectEntities(
    normalized: string,
    covered: Set<string>,
    detectedModuleTerms: Set<string>,
    maxEntities: number
  ): EntitySpec[] {
    const catalogMatches: EntitySpec[] = [];
    const knownTerms = new Set<string>();

    ENTITY_CATALOG.forEach((entity) => {
      entity.keywords.forEach((k) => knownTerms.add(TextNormalizer.normalize(k)));
      if (covered.has(entity.key)) return;
      const score = entity.keywords.reduce(
        (acc, kw) => acc + TextNormalizer.countOccurrences(normalized, kw),
        0
      );
      if (score > 0) {
        catalogMatches.push({
          key: entity.key,
          singular: entity.singular,
          plural: entity.plural,
          gender: entity.gender,
          score,
          source: 'catalog',
          fields: entity.fields,
        });
      }
    });
    catalogMatches.sort((a, b) => b.score - a.score);

    // Entidades por patrón léxico ("gestión de X") no presentes en el catálogo
    const actorTerms = new Set<string>();
    ACTOR_CATALOG.forEach((a) => a.keywords.forEach((k) => actorTerms.add(TextNormalizer.normalize(k))));
    const coveredTerms = new Set<string>();
    ENTITY_CATALOG.filter((e) => covered.has(e.key)).forEach((e) =>
      e.keywords.forEach((k) => coveredTerms.add(TextNormalizer.normalize(k)))
    );

    const patternMatches: EntitySpec[] = [];
    const seenPattern = new Set<string>();
    let match: RegExpExecArray | null;
    PATTERN_ENTITY_REGEX.lastIndex = 0;
    while ((match = PATTERN_ENTITY_REGEX.exec(normalized)) !== null) {
      const word = match[1];
      if (
        TextNormalizer.STOPWORDS.has(word) ||
        actorTerms.has(word) ||
        knownTerms.has(word) ||
        coveredTerms.has(word) ||
        detectedModuleTerms.has(word)
      ) {
        continue;
      }
      const singular = TextNormalizer.singularize(word);
      if (seenPattern.has(singular) || singular.length < 4) continue;
      seenPattern.add(singular);
      patternMatches.push({
        key: `pattern_${singular}`,
        singular,
        plural: TextNormalizer.pluralize(singular),
        gender: this.guessGender(singular),
        score: 1,
        source: 'pattern',
        fields: DEFAULT_PATTERN_FIELDS,
      });
      if (patternMatches.length >= 3) break;
    }

    return [...catalogMatches, ...patternMatches].slice(0, maxEntities);
  }

  private static guessGender(word: string): 'm' | 'f' {
    if (/(cion|sion|dad|tad|tud|umbre|ie)$/.test(word)) return 'f';
    if (word.endsWith('a') && !/(ma|ta)$/.test(word)) return 'f';
    return 'm';
  }
}
