// ==========================================================================
// Core Spec Engine: Tipos del Motor Determinista de Especificación
// Define el contrato del catálogo (módulos, actores, entidades) y de la
// especificación generada (casos de uso, requisitos, escenarios).
// 100% código: sin modelos de lenguaje ni servicios externos.
// ==========================================================================

import { BvaVariableInput } from '../test-design/bva-engine';
import { ScenarioType } from '../test-design/gherkin-compiler';

export type Priority = 'high' | 'medium' | 'low';
export type RequirementKind = 'functional' | 'non_functional';
export type DerivationDepth = 'basic' | 'standard' | 'exhaustive';

// ---------------------------------------------------------------------------
// Catálogo (plantillas parametrizables)
// ---------------------------------------------------------------------------

export interface ScenarioTemplate {
  name: string;
  type: ScenarioType;
  given: string[];
  when: string[];
  then: string[];
}

export interface RequirementTemplate {
  key: string;
  title: string;
  description: string;
  priority: Priority;
  kind?: RequirementKind;
  scenarios: ScenarioTemplate[];
  /** Variables cuantitativas para derivar casos BVA de 3 puntos. */
  variables?: BvaVariableInput[];
  /** Categoría del catálogo ISTQB_TEMPLATES usada en profundidad exhaustiva. */
  templateCategory?: string;
}

export interface FlowAlternative {
  name: string;
  condition: string;
  steps: string[];
}

export interface FlowException {
  name: string;
  trigger: string;
  steps: string[];
  expectedError: string;
}

export type ActorRole = 'primary' | 'admin' | 'secondary';

export interface UseCaseTemplate {
  key: string;
  name: string;
  actor: ActorRole;
  priority: Priority;
  description: string;
  preconditions: string[];
  mainFlow: string[];
  alternativeFlows: FlowAlternative[];
  exceptionFlows: FlowException[];
  postconditions: string[];
  requirements: RequirementTemplate[];
}

export interface KeywordRule {
  term: string;
  weight: number;
}

export interface DomainModule {
  key: string;
  name: string;
  icon: string;
  description: string;
  keywords: KeywordRule[];
  /** Claves de actor en orden de preferencia para el rol "primary". */
  preferredActors: string[];
  /** Claves de actor en orden de preferencia para el rol "secondary". */
  secondaryActors?: string[];
  /** Entidades cuyo CRUD ya queda cubierto por este módulo (evita duplicados). */
  coveredEntities?: string[];
  /** Módulos que se incluyen automáticamente cuando este módulo se detecta. */
  implies?: string[];
  templateCategory: string;
  useCases: UseCaseTemplate[];
}

export interface ActorDefinition {
  key: string;
  label: string;
  description: string;
  keywords: string[];
  isAdmin?: boolean;
}

export type EntityFieldType =
  'text' | 'integer' | 'decimal' | 'date' | 'email' | 'phone' | 'enum' | 'boolean';

export interface EntityField {
  name: string;
  type: EntityFieldType;
  required: boolean;
  unique?: boolean;
  min?: number;
  max?: number;
  unit?: string;
  options?: string[];
  example?: string;
}

export interface EntityDefinition {
  key: string;
  singular: string;
  plural: string;
  gender: 'm' | 'f';
  keywords: string[];
  fields: EntityField[];
}

// ---------------------------------------------------------------------------
// Especificación generada
// ---------------------------------------------------------------------------

export interface ActorSpec {
  key: string;
  label: string;
  description: string;
  isAdmin: boolean;
  source: 'detected' | 'default';
  score: number;
}

export interface ModuleSpec {
  key: string;
  name: string;
  icon: string;
  description: string;
  score: number;
  matchedKeywords: string[];
  implied: boolean;
}

export interface EntitySpec {
  key: string;
  singular: string;
  plural: string;
  gender: 'm' | 'f';
  score: number;
  source: 'catalog' | 'pattern';
  fields: EntityField[];
}

export interface UseCaseSpec {
  code: string;
  key: string;
  name: string;
  actor: string;
  moduleKey: string;
  moduleName: string;
  priority: Priority;
  description: string;
  preconditions: string[];
  mainFlow: string[];
  alternativeFlows: FlowAlternative[];
  exceptionFlows: FlowException[];
  postconditions: string[];
  requirementCodes: string[];
}

export interface RequirementSpec {
  code: string;
  key: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  priority: Priority;
  kind: RequirementKind;
  moduleKey: string;
  useCaseCode: string | null;
  scenarios: ScenarioTemplate[];
  variables: BvaVariableInput[];
  templateCategory: string | null;
  estimatedTestCases: number;
}

export interface SpecificationSummary {
  engineVersion: string;
  depth: DerivationDepth;
  actorsDetected: number;
  modulesDetected: number;
  entitiesDetected: number;
  totalUseCases: number;
  totalRequirements: number;
  functionalRequirements: number;
  nonFunctionalRequirements: number;
  estimatedTestCases: number;
}

export interface ProjectSpecification {
  project: { name: string; description: string };
  summary: SpecificationSummary;
  actors: ActorSpec[];
  modules: ModuleSpec[];
  entities: EntitySpec[];
  useCases: UseCaseSpec[];
  requirements: RequirementSpec[];
  warnings: string[];
}
