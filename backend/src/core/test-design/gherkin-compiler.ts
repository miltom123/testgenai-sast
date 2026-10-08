// ==========================================================================
// Core Test Design: GherkinCompiler
// Parser y compilador determinista de criterios de aceptación BDD
// (Escenario / Dado que / Cuando / Y / Entonces) a casos de prueba.
// Admite anotaciones explícitas "# tipo: negative" por escenario.
// ==========================================================================

export type ScenarioType = 'positive' | 'negative' | 'alternative' | 'boundary' | 'validation';

export interface GherkinScenarioBlock {
  name: string;
  given: string[];
  when: string[];
  then: string[];
  typeHint: ScenarioType | null;
  rawText: string;
}

export interface CompiledScenarioCase {
  title: string;
  type: ScenarioType;
  preconditions: string[];
  steps: string[];
  expectedResult: string;
  evidenceText: string;
}

export interface GherkinFormatScenario {
  name: string;
  type?: ScenarioType;
  given: string[];
  when: string[];
  then: string[];
}

const SCENARIO_TYPES: ReadonlySet<string> = new Set([
  'positive',
  'negative',
  'alternative',
  'boundary',
  'validation',
]);

export class GherkinCompiler {
  private static readonly SCENARIO_REGEX =
    /^(?:escenario(?:\s+esquema)?|scenario(?:\s+outline)?|caso)\s*:\s*(.+)$/i;
  private static readonly GIVEN_REGEX = /^(?:dado\s+que|dada\s+que|dados\s+que|dado|dada|given)\s+(.+)$/i;
  private static readonly WHEN_REGEX = /^(?:cuando|when)\s+(.+)$/i;
  private static readonly THEN_REGEX = /^(?:entonces|then)\s+(.+)$/i;
  private static readonly AND_REGEX = /^(?:y|e|and|pero|but)\s+(.+)$/i;
  private static readonly TYPE_COMMENT_REGEX = /^#\s*(?:tipo|type)\s*:\s*([a-z_]+)/i;

  /** Divide el texto en bloques de escenario estructurados. */
  public static parse(text: string, fallbackName = 'Escenario principal'): GherkinScenarioBlock[] {
    const lines = String(text || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const blocks: GherkinScenarioBlock[] = [];
    let current: GherkinScenarioBlock | null = null;
    let mode: 'given' | 'when' | 'then' | null = null;
    let rawLines: string[] = [];

    const flush = () => {
      if (current && (current.given.length || current.when.length || current.then.length)) {
        current.rawText = rawLines.join('\n');
        blocks.push(current);
      }
      current = null;
      mode = null;
      rawLines = [];
    };

    const ensureCurrent = (name: string) => {
      if (!current) {
        current = { name, given: [], when: [], then: [], typeHint: null, rawText: '' };
        rawLines = [];
      }
      return current;
    };

    for (const line of lines) {
      const scenarioMatch = line.match(this.SCENARIO_REGEX);
      if (scenarioMatch) {
        flush();
        current = {
          name: scenarioMatch[1].trim(),
          given: [],
          when: [],
          then: [],
          typeHint: null,
          rawText: '',
        };
        rawLines = [line];
        continue;
      }

      const typeMatch = line.match(this.TYPE_COMMENT_REGEX);
      if (typeMatch) {
        const hint = typeMatch[1].toLowerCase();
        if (current && SCENARIO_TYPES.has(hint)) {
          current.typeHint = hint as ScenarioType;
          rawLines.push(line);
        }
        continue;
      }

      if (line.startsWith('#')) continue;

      const givenMatch = line.match(this.GIVEN_REGEX);
      if (givenMatch) {
        ensureCurrent(fallbackName).given.push(givenMatch[1].trim());
        mode = 'given';
        rawLines.push(line);
        continue;
      }

      const whenMatch = line.match(this.WHEN_REGEX);
      if (whenMatch) {
        ensureCurrent(fallbackName).when.push(whenMatch[1].trim());
        mode = 'when';
        rawLines.push(line);
        continue;
      }

      const thenMatch = line.match(this.THEN_REGEX);
      if (thenMatch) {
        ensureCurrent(fallbackName).then.push(thenMatch[1].trim());
        mode = 'then';
        rawLines.push(line);
        continue;
      }

      const andMatch = line.match(this.AND_REGEX);
      if (andMatch && current && mode) {
        current[mode].push(andMatch[1].trim());
        rawLines.push(line);
        continue;
      }

      // Línea libre dentro de un escenario sin palabra clave: se trata como paso
      // cuando ya existe un "Cuando" y aún no hay "Entonces".
      if (current && mode === 'when') {
        current.when.push(line.replace(/^[-*\d.)\s]+/, '').trim());
        rawLines.push(line);
      }
    }

    flush();
    return blocks;
  }

  /** Clasifica el escenario cuando no existe anotación explícita de tipo. */
  public static inferType(block: GherkinScenarioBlock): ScenarioType {
    if (block.typeHint) return block.typeHint;
    const text = `${block.name} ${block.when.join(' ')} ${block.then.join(' ')}`.toLowerCase();

    if (
      /(l[ií]mite|m[aá]ximo|m[ií]nimo|exactamente|frontera|justo|al tope|igual a|último|ultimo)/.test(text)
    ) {
      return 'boundary';
    }
    if (
      /(obligatori|formato|vac[ií]o|caracteres? (?:especial|inv[aá]lid)|longitud|patr[oó]n|validaci[oó]n)/.test(
        text
      )
    ) {
      return 'validation';
    }
    if (
      /(error|rechaz|inv[aá]lid|bloque|deneg|no permit|no debe|impide|falla|fallo|duplicad|insuficiente|expirad|caducad|40[0-9]|422|50[0-9]|prohib)/.test(
        text
      )
    ) {
      return 'negative';
    }
    if (
      /(alternativ|opcional|cancel|reprogram|sin conexi[oó]n|parcial|borrador|desactivad|reintent|sin resultados|otro m[eé]todo)/.test(
        text
      )
    ) {
      return 'alternative';
    }
    return 'positive';
  }

  /** Compila el texto Gherkin a casos de prueba ejecutables. */
  public static compile(
    text: string,
    options: { titlePrefix?: string; fallbackName?: string } = {}
  ): CompiledScenarioCase[] {
    const prefix = options.titlePrefix ?? '';
    const blocks = this.parse(text, options.fallbackName || 'Escenario principal');

    return blocks.map((block) => {
      const type = this.inferType(block);
      const preconditions =
        block.given.length > 0
          ? block.given.map((g) => this.sentence(g))
          : ['El sistema se encuentra operativo y el actor tiene acceso a la funcionalidad.'];
      const steps =
        block.when.length > 0
          ? block.when.map((w) => this.sentence(w))
          : ['Ejecutar la acción descrita en el escenario.'];
      const expectedResult =
        block.then.length > 0
          ? block.then.map((t) => this.sentence(t)).join(' ')
          : 'El comportamiento observado coincide con el criterio de aceptación.';

      return {
        title: `${prefix}${block.name}`.trim(),
        type,
        preconditions,
        steps,
        expectedResult,
        evidenceText: block.rawText.slice(0, 600),
      };
    });
  }

  /** Serializa escenarios estructurados a texto Gherkin con anotación de tipo. */
  public static format(scenarios: GherkinFormatScenario[]): string {
    return scenarios
      .map((s) => {
        const lines: string[] = [`Escenario: ${s.name}`];
        if (s.type) lines.push(`# tipo: ${s.type}`);
        s.given.forEach((g, i) => lines.push(`  ${i === 0 ? 'Dado que' : 'Y'} ${g}`));
        s.when.forEach((w, i) => lines.push(`  ${i === 0 ? 'Cuando' : 'Y'} ${w}`));
        s.then.forEach((t, i) => lines.push(`  ${i === 0 ? 'Entonces' : 'Y'} ${t}`));
        return lines.join('\n');
      })
      .join('\n\n');
  }

  private static sentence(fragment: string): string {
    const trimmed = fragment.trim().replace(/\s+/g, ' ');
    if (!trimmed) return trimmed;
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
  }
}
