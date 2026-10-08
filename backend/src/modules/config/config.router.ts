import { Router, Request, Response } from 'express';
import { env } from '../../config/env';
import { sendSuccess } from '../../common/utils/api-response';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AI_PRICING_TABLE } from '../../config/ai-pricing';

export const configRouter = Router();

configRouter.use(authenticateJWT);

// GET /api/v1/config/ai-providers - Estado de configuración y capacidades de proveedores de IA
configRouter.get(
  '/ai-providers',
  asyncHandler(async (_req: Request, res: Response) => {
    const geminiAvailable = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0);
    const openaiAvailable = Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 0);

    const providers = [
      {
        id: 'gemini',
        name: 'Google Gemini',
        isConfigured: geminiAvailable,
        isDefault: env.AI_PROVIDER_DEFAULT === 'gemini',
        supportedModels: [
          {
            id: 'gemini-2.5-flash-lite',
            name: 'Gemini 2.5 Flash-Lite (Económico y Rápido)',
            pricing: AI_PRICING_TABLE['gemini-2.5-flash-lite'],
          },
          {
            id: 'gemini-1.5-flash',
            name: 'Gemini 1.5 Flash (Equilibrado)',
            pricing: AI_PRICING_TABLE['gemini-1.5-flash'],
          },
          {
            id: 'gemini-1.5-pro',
            name: 'Gemini 1.5 Pro (Máximo Razonamiento)',
            pricing: AI_PRICING_TABLE['gemini-1.5-pro'],
          },
        ],
      },
      {
        id: 'openai',
        name: 'OpenAI GPT',
        isConfigured: openaiAvailable,
        isDefault: env.AI_PROVIDER_DEFAULT === 'openai',
        supportedModels: [
          {
            id: 'gpt-5-nano',
            name: 'GPT-5 Nano (Ultra Compacto)',
            pricing: AI_PRICING_TABLE['gpt-5-nano'],
          },
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o Mini (Ágil y Económico)',
            pricing: AI_PRICING_TABLE['gpt-4o-mini'],
          },
          {
            id: 'gpt-4o',
            name: 'GPT-4o (Completo y Multimodal)',
            pricing: AI_PRICING_TABLE['gpt-4o'],
          },
        ],
      },
    ];

    return sendSuccess(res, {
      defaultProvider: env.AI_PROVIDER_DEFAULT,
      budgetLimitUsd: env.AI_PROJECT_BUDGET_USD,
      providers,
    });
  })
);
