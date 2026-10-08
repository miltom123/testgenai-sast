// ==============================================================================
// TestGenAI - Tabla de Tarifas Oficiales de Modelos LLM (USD por 1M tokens)
// Modelos oficiales vigentes para Google Gemini y OpenAI.
// Modelos desconocidos devuelven null (costo desconocido, no inventado).
// ==============================================================================

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

export const AI_PRICING_TABLE: Record<string, ModelPricing> = {
  // Modelos de Google Gemini (tarifas oficiales vigentes)
  'gemini-2.5-flash-lite': { inputPerMillion: 0.10, outputPerMillion: 0.40 },
  'gemini-1.5-flash': { inputPerMillion: 0.075, outputPerMillion: 0.30 },
  'gemini-1.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5.00 },

  // Modelos de OpenAI (tarifas oficiales vigentes)
  'gpt-5-nano': { inputPerMillion: 0.05, outputPerMillion: 0.40 },
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.60 },
  'gpt-4o': { inputPerMillion: 2.50, outputPerMillion: 10.00 },
};

/**
 * Calcula el costo en USD según los tokens de entrada y salida reales.
 * Si el modelo no tiene tarifa registrada, devuelve null (costo no disponible).
 */
export function calculateAICost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number | null {
  const pricing = AI_PRICING_TABLE[model];
  if (!pricing) {
    return null;
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  const total = inputCost + outputCost;

  // Redondeo a 6 decimales para precisión de micro-dólares
  return Math.round(total * 1_000_000) / 1_000_000;
}
