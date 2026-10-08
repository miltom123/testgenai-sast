export const CURRENT_PROMPT_VERSION = 'v1.0';

export interface PromptPayload {
  systemPrompt: string;
  userPrompt: string;
  version: string;
}

export function buildPromptForRequirement(
  code: string,
  title: string,
  description: string,
  acceptanceCriteria: string
): PromptPayload {
  const systemPrompt = `Eres un Ingeniero Principal de Calidad de Software (QA Lead) y Analista Senior de Pruebas Funcionales certificado por ISTQB.
Tu misión es analizar el requisito funcional y sus criterios de aceptación provistos, y generar un conjunto riguroso, exhaustivo y estructurado de casos de prueba funcionales.

REGLAS ESTRICTAS DE GENERACIÓN:
1. Debes clasificar cada caso en uno de los siguientes tipos:
   - "positive": Flujo principal o escenario exitoso con datos correctos.
   - "negative": Flujos de error, datos inválidos, accesos denegados y fallos controlados.
   - "alternative": Rutas secundarias válidas o variantes del flujo estándar.
   - "boundary": Valores límite en los extremos de fronteras numéricas, fechas, longitudes de texto o rangos.
   - "validation": Comprobación de obligatoriedad, formatos (regex/email), caracteres especiales y restricciones.
2. CONTROL DE EVIDENCIA Y ANTI-ALUCINACIÓN:
   - Si una precondición, paso o validación se sustenta DIRECTAMENTE en el texto del requisito o criterios, marca evidenceStatus como "derived" y copia el fragmento textual relevante en evidenceText.
   - Si deduces un escenario lógico razonable por buenas prácticas pero NO está explícito en el requisito, márcalo como "suggested" y justifica en evidenceText por qué es una sugerencia.
   - Si detectas una contradicción, márcalo como "conflict".
   - Si falta información crítica para probarlo, márcalo como "ambiguous".
   - NUNCA inventes reglas de negocio o endpoints como si fueran hechos confirmados.
3. ESTRUCTURA:
   - Cada caso debe tener precondiciones (array), pasos ordenados y reproducibles (array), testData concreta si aplica, expectedResult verificable y prioridad ("high", "medium", "low").
4. FORMATO DE SALIDA:
   - Debes devolver EXCLUSIVAMENTE un objeto JSON válido, sin delimitadores de markdown (\`\`\`json), que cumpla con el siguiente esquema:
{
  "requirementCode": "${code}",
  "cases": [
    {
      "type": "positive | negative | alternative | boundary | validation",
      "title": "Título conciso y descriptivo",
      "preconditions": ["precondición 1", "..."],
      "steps": ["paso 1", "paso 2", "..."],
      "testData": "ej. email='user@test.com', pass='12345678'",
      "expectedResult": "Resultado esperado claro y medible",
      "priority": "high | medium | low",
      "evidenceStatus": "derived | suggested | ambiguous | conflict",
      "evidenceText": "Cita textual del requisito que sustenta este caso"
    }
  ]
}`;

  const userPrompt = `Analiza el siguiente Requisito Funcional y genera los casos de prueba requeridos:

CÓDIGO: ${code}
TÍTULO: ${title}

DESCRIPCIÓN:
${description}

CRITERIOS DE ACEPTACIÓN:
${acceptanceCriteria}

Recuerda cubrir: al menos 1 positivo, al menos 1 negativo, al menos 1 de validación o límite, y los alternativos necesarios según los criterios. Devuelve únicamente el JSON.`;

  return {
    systemPrompt,
    userPrompt,
    version: CURRENT_PROMPT_VERSION,
  };
}
