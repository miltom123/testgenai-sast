// ==========================================================================
// Core Spec Engine: punto de entrada público
// ==========================================================================

export * from './spec-types';
export { TextNormalizer } from './text-normalizer';
export { ProjectSpecEngine, SPEC_ENGINE_VERSION } from './project-spec-engine';
export type { SpecEngineInput, SpecEngineOptions } from './project-spec-engine';
export { DeterministicTestDeriver, DERIVATION_LIMITS } from './test-deriver';
export type { DerivationInput, DerivedTestCase } from './test-deriver';
export {
  ALL_MODULES,
  ACTOR_CATALOG,
  ENTITY_CATALOG,
  NON_FUNCTIONAL_TEMPLATES,
  FALLBACK_MODULE_KEY,
  ENTITY_MODULE_KEY,
  NON_FUNCTIONAL_MODULE_KEY,
  buildEntityCrudUseCase,
  findModule,
  findActor,
  findEntity,
  getCatalogStats,
} from './catalog';
