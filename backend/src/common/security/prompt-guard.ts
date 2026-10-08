export interface PromptGuardResult {
  isSafe: boolean;
  riskScore: number; // 0 (muy seguro) - 100 (inyección confirmada)
  threatsDetected: string[];
  sanitizedText: string;
}

export class PromptGuard {
  // Patrones conocidos de Prompt Injection y Jailbreak
  private static readonly INJECTION_PATTERNS = [
    {
      regex: /(?:ignore|disregard|forget|omit)\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|rules|commands)/gi,
      name: 'DIRECT_INSTRUCTION_OVERRIDE',
      weight: 45,
    },
    {
      regex: /(?:olvida|ignora|desobedece|omite)\s+(?:todas?\s+)?(?:las\s+)?(?:instrucciones|reglas|órdenes|ordenes)\s+(?:previas|anteriores)/gi,
      name: 'DIRECT_INSTRUCTION_OVERRIDE_ES',
      weight: 45,
    },
    {
      regex: /\b(?:dan mode|jailbreak|unrestricted mode|god mode|developer mode enabled)\b/gi,
      name: 'JAILBREAK_ROLEPLAY',
      weight: 50,
    },
    {
      regex: /(?:system\s+prompt|developer\s+message|system\s+instructions|show\s+your\s+hidden\s+prompt)/gi,
      name: 'SYSTEM_PROMPT_LEAK_ATTEMPT',
      weight: 40,
    },
    {
      regex: /(?:muestra|revela|imprime|dime)\s+(?:tu\s+)?(?:prompt\s+del\s+sistema|instrucciones\s+ocultas)/gi,
      name: 'SYSTEM_PROMPT_LEAK_ATTEMPT_ES',
      weight: 40,
    },
    {
      regex: /(?:<\|im_start\|>|<\|im_end\|>|\[SYSTEM\]|\[INST\]|<<SYS>>)/gi,
      name: 'SPECIAL_TOKEN_INJECTION',
      weight: 50,
    },
    {
      regex: /(?:base64\s+decode|execute\s+eval|run\s+exec)\s*[(:]/gi,
      name: 'CODE_EXECUTION_ATTEMPT',
      weight: 35,
    },
  ];

  /**
   * Analiza un texto de entrada en busca de vectores de inyección o jailbreak.
   */
  static inspect(input: string): PromptGuardResult {
    let riskScore = 0;
    const threatsDetected: string[] = [];
    let sanitizedText = input;

    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.regex.test(input)) {
        riskScore += pattern.weight;
        threatsDetected.push(pattern.name);
        // Neutralizar el patrón reemplazándolo por marca de sanitización
        sanitizedText = sanitizedText.replace(pattern.regex, '[SANITIZED_PROMPT_GUARD]');
      }
    }

    riskScore = Math.min(100, riskScore);
    const isSafe = riskScore < 40;

    return {
      isSafe,
      riskScore,
      threatsDetected,
      sanitizedText: isSafe ? input : sanitizedText,
    };
  }

  /**
   * Asegura que el prompt esté libre de inyecciones críticas, lanzando un error si sobrepasa el umbral.
   */
  static assertSafe(input: string, threshold: number = 40): string {
    const result = this.inspect(input);
    if (!result.isSafe || result.riskScore >= threshold) {
      throw new Error(
        `[PromptGuard] Intento de inyección de prompt o manipulación no autorizada detectada (${result.threatsDetected.join(
          ', '
        )}). Operación bloqueada por seguridad.`
      );
    }
    return input;
  }
}
