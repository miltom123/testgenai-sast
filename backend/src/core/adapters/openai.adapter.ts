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

export class OpenAIAdapter implements IAIProvider {
  readonly providerName = 'openai' as const;

  async generateTestCases(
    requirementCode: string,
    requirementTitle: string,
    description: string,
    acceptanceCriteria: string,
    options?: GenerateOptions
  ): Promise<AIGenerationResult> {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY no está configurada en las variables de entorno del backend. Configure la clave oficial en el archivo .env.'
      );
    }

    const modelName = options?.model || 'gpt-4o-mini';
    const { systemPrompt, userPrompt, version } = buildPromptForRequirement(
      requirementCode,
      requirementTitle,
      description,
      acceptanceCriteria
    );

    const startTime = Date.now();

    const response = await withRetry(
      (signal) =>
        fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            response_format: { type: 'json_object' },
            temperature: options?.temperature ?? 0.2,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
          signal,
        }).then(async (res) => {
          if (!res.ok && res.status >= 500) {
            throw new Error(`OpenAI respondió con código HTTP ${res.status} (error transitorio del servidor)`);
          }
          return res;
        }),
      {
        retries: env.AI_MAX_RETRIES,
        timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
        label: 'OpenAI generateTestCases',
      }
    );

    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Fallo en la llamada a la API de OpenAI (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as {
      usage?: { prompt_tokens: number; completion_tokens: number };
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content || '{}';
    const validated = validateAIResponse(content);

    const inputTokens = data.usage?.prompt_tokens ?? 0;
    const outputTokens = data.usage?.completion_tokens ?? 0;
    const estimatedCost = calculateAICost(modelName, inputTokens, outputTokens);

    return {
      provider: 'openai',
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
