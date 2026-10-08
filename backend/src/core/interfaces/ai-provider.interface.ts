export type TestCaseType = 'positive' | 'negative' | 'alternative' | 'boundary' | 'validation';
export type EvidenceStatus = 'derived' | 'suggested' | 'ambiguous' | 'conflict' | 'pending';
export type PriorityLevel = 'high' | 'medium' | 'low';

export interface RawGeneratedCase {
  type: TestCaseType;
  title: string;
  preconditions: string[];
  steps: string[];
  testData?: string | null;
  expectedResult: string;
  priority: PriorityLevel;
  evidenceStatus: EvidenceStatus;
  evidenceText?: string | null;
}

export interface AIGenerationResult {
  provider: 'gemini' | 'openai';
  model: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  responseTimeMs: number;
  estimatedCost: number | null;
  cases: RawGeneratedCase[];
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface IAIProvider {
  readonly providerName: 'gemini' | 'openai';
  generateTestCases(
    requirementCode: string,
    requirementTitle: string,
    description: string,
    acceptanceCriteria: string,
    options?: GenerateOptions
  ): Promise<AIGenerationResult>;
}
