import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  IAIProvider,
  AIGenerationResult,
  GenerateOptions,
} from '../interfaces/ai-provider.interface';
import { calculateAICost } from '../../config/ai-pricing';
import { buildPromptForRequirement } from '../prompts/prompt-builder';
import { env } from '../../config/env';
import { withRetry } from '../../common/utils/retry';
import { validateAIResponse } from '../validation/ai-output.validator';

export class GeminiAdapter implements IAIProvider {
  readonly providerName = 'gemini' as const;

  async generateTestCases(
    requirementCode: string,
    requirementTitle: string,
    description: string,
    acceptanceCriteria: string,
    options?: GenerateOptions
  ): Promise<AIGenerationResult> {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY no está configurada en las variables de entorno del backend. Configure la clave oficial en el archivo .env.'
      );
    }

    const modelName = options?.model || 'gemini-1.5-flash';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: options?.temperature ?? 0.2,
      },
    });

    const { systemPrompt, userPrompt, version } = buildPromptForRequirement(
      requirementCode,
      requirementTitle,
      description,
      acceptanceCriteria
    );

    const startTime = Date.now();
    const fullPrompt = `${systemPrompt}\n\n---\n${userPrompt}`;

    const result = await withRetry(
      () => model.generateContent(fullPrompt),
      {
        retries: env.AI_MAX_RETRIES,
        timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
        label: 'Gemini generateTestCases',
      }
    );

    const response = await result.response;
    const responseTimeMs = Date.now() - startTime;
    const responseText = response.text();

    // Validación rigurosa de esquema Zod
    const validated = validateAIResponse(responseText);

    const usageMetadata = response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount ?? Math.floor(fullPrompt.length / 4);
    const outputTokens = usageMetadata?.candidatesTokenCount ?? Math.floor(responseText.length / 4);
    const estimatedCost = calculateAICost(modelName, inputTokens, outputTokens);

    return {
      provider: 'gemini',
      model: modelName,
      promptVersion: version,
      inputTokens,
      outputTokens,
      responseTimeMs,
      estimatedCost,
      cases: validated.cases,
    };
  }
}
