// ==============================================================================
// Validador Zod para la Salida Estructurada de Proveedores de IA
// Asegura que las respuestas de Gemini y OpenAI cumplan estrictamente
// la estructura, tipos, límites y evidencia requeridos para el MVP.
// ==============================================================================

import { z } from 'zod';

export const rawGeneratedCaseSchema = z.object({
  type: z.enum(['positive', 'negative', 'alternative', 'boundary', 'validation']),
  title: z
    .string()
    .trim()
    .min(3, 'El título del caso debe tener al menos 3 caracteres')
    .max(250, 'El título no debe exceder 250 caracteres'),
  preconditions: z
    .array(z.string().trim().max(400))
    .default([]),
  steps: z
    .array(z.string().trim().min(1).max(500))
    .min(1, 'El caso de prueba debe tener al menos 1 paso de ejecución')
    .max(25, 'Un caso no debe exceder 25 pasos'),
  testData: z
    .string()
    .trim()
    .max(1000)
    .nullish()
    .transform((val) => val || null),
  expectedResult: z
    .string()
    .trim()
    .min(3, 'El resultado esperado debe tener al menos 3 caracteres')
    .max(600),
  priority: z
    .enum(['high', 'medium', 'low'])
    .default('medium'),
  evidenceStatus: z
    .enum(['derived', 'suggested', 'ambiguous', 'conflict', 'pending'])
    .default('pending'),
  evidenceText: z
    .string()
    .trim()
    .max(600)
    .nullish()
    .transform((val) => val || null),
});

export const aiGeneratedOutputSchema = z.object({
  cases: z
    .array(rawGeneratedCaseSchema)
    .min(1, 'El proveedor de IA no devolvió ningún caso de prueba válido')
    .max(20, 'La cantidad de casos generados no debe superar los 20 casos por lote'),
});

export type ValidatedGeneratedCase = z.infer<typeof rawGeneratedCaseSchema>;
export type ValidatedAIOutput = z.infer<typeof aiGeneratedOutputSchema>;

/**
 * Parsea y valida el texto JSON devuelto por el modelo de IA.
 * Lanza un error descriptivo si el JSON es inválido o no cumple el esquema.
 */
export function validateAIResponse(jsonText: string): ValidatedAIOutput {
  let rawJson: unknown;
  try {
    rawJson = JSON.parse(jsonText);
  } catch {
    // Si viene envuelto en bloques markdown ```json ... ```
    const cleaned = jsonText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    try {
      rawJson = JSON.parse(cleaned);
    } catch {
      throw new Error('El proveedor de IA devolvió una respuesta que no es un formato JSON válido.');
    }
  }

  // Normalizar si la respuesta vino directamente como array o bajo la propiedad "test_cases"
  if (Array.isArray(rawJson)) {
    rawJson = { cases: rawJson };
  } else if (rawJson && typeof rawJson === 'object') {
    const obj = rawJson as Record<string, unknown>;
    if (!obj.cases && Array.isArray(obj.test_cases)) {
      obj.cases = obj.test_cases;
    } else if (!obj.cases && Array.isArray(obj.testCases)) {
      obj.cases = obj.testCases;
    }
  }

  const parsed = aiGeneratedOutputSchema.safeParse(rawJson);
  if (!parsed.success) {
    const errorDetails = parsed.error.errors
      .map((e) => `[${e.path.join('.') || 'raíz'}]: ${e.message}`)
      .join(', ');
    throw new Error(`La respuesta de la IA no cumple con el esquema requerido: ${errorDetails}`);
  }

  return parsed.data;
}
