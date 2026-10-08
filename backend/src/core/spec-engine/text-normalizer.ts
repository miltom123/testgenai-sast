// ==========================================================================
// Core Spec Engine: TextNormalizer
// Normalización léxica determinista en español: acentos, tokenización,
// singularización heurística y conteo de ocurrencias por frontera de palabra.
// ==========================================================================

export class TextNormalizer {
  /** Palabras funcionales y verbos genéricos que no aportan significado de dominio. */
  public static readonly STOPWORDS: ReadonlySet<string> = new Set([
    'a',
    'al',
    'algo',
    'algun',
    'alguna',
    'algunas',
    'alguno',
    'algunos',
    'ante',
    'antes',
    'asi',
    'aun',
    'cada',
    'como',
    'con',
    'contra',
    'cual',
    'cuales',
    'cualquier',
    'cuando',
    'de',
    'del',
    'desde',
    'donde',
    'dos',
    'durante',
    'e',
    'el',
    'ella',
    'ellas',
    'ellos',
    'en',
    'entre',
    'era',
    'eran',
    'es',
    'esa',
    'esas',
    'ese',
    'eso',
    'esos',
    'esta',
    'estan',
    'estar',
    'estas',
    'este',
    'esto',
    'estos',
    'fue',
    'fueron',
    'ha',
    'hace',
    'hacia',
    'han',
    'hasta',
    'hay',
    'la',
    'las',
    'le',
    'les',
    'lo',
    'los',
    'mas',
    'me',
    'mi',
    'mientras',
    'muy',
    'nada',
    'ni',
    'no',
    'nos',
    'o',
    'os',
    'otra',
    'otras',
    'otro',
    'otros',
    'para',
    'pero',
    'poco',
    'por',
    'porque',
    'que',
    'quien',
    'quienes',
    'se',
    'sea',
    'sean',
    'segun',
    'ser',
    'si',
    'sin',
    'sobre',
    'son',
    'su',
    'sus',
    'tal',
    'tambien',
    'tanto',
    'te',
    'tiene',
    'tienen',
    'toda',
    'todas',
    'todo',
    'todos',
    'tras',
    'tu',
    'tus',
    'un',
    'una',
    'uno',
    'unos',
    'ya',
    'yo',
    // Verbos y sustantivos genéricos de especificación
    'debe',
    'deben',
    'debera',
    'deberan',
    'deberia',
    'permitir',
    'permita',
    'permitira',
    'permite',
    'poder',
    'pueda',
    'puedan',
    'puede',
    'pueden',
    'sistema',
    'sistemas',
    'aplicacion',
    'aplicativo',
    'plataforma',
    'software',
    'web',
    'app',
    'proyecto',
    'modulo',
    'modulos',
    'gestion',
    'gestionar',
    'administrar',
    'administracion',
    'registrar',
    'registro',
    'registros',
    'consultar',
    'consulta',
    'crear',
    'editar',
    'eliminar',
    'listar',
    'mediante',
    'traves',
    'ademas',
    'tipo',
    'tipos',
    'forma',
    'manera',
    'nuevo',
    'nueva',
    'nuevos',
    'nuevas',
    'informacion',
    'datos',
    'dato',
    'manejo',
    'control',
    'funcionalidad',
    'funcionalidades',
    'opcion',
    'opciones',
    'proceso',
    'procesos',
    'necesita',
    'necesario',
    'requiere',
    'quiero',
    'desea',
    'queremos',
    'empresa',
    'negocio',
  ]);

  /** Elimina acentos y diacríticos (ñ → n) para comparaciones insensibles. */
  public static stripAccents(input: string): string {
    return String(input || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }

  /** Minúsculas, sin acentos, solo letras/dígitos y espacios simples. */
  public static normalize(input: string): string {
    return this.stripAccents(String(input || '').toLowerCase())
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Tokens significativos (≥ 3 letras, sin stopwords ni números puros). */
  public static tokenize(input: string): string[] {
    return this.normalize(input)
      .split(' ')
      .filter((t) => t.length >= 3 && !this.STOPWORDS.has(t) && !/^\d+$/.test(t));
  }

  /** Cuenta ocurrencias de una frase normalizada respetando fronteras de palabra. */
  public static countOccurrences(normalizedText: string, phrase: string): number {
    const normalizedPhrase = this.normalize(phrase);
    if (!normalizedPhrase) return 0;
    const escaped = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'g');
    return (normalizedText.match(regex) || []).length;
  }

  /** Singularización heurística para sustantivos en español. */
  public static singularize(word: string): string {
    const w = String(word || '').toLowerCase();
    if (w.length <= 3) return w;
    if (w.endsWith('ciones') || w.endsWith('siones')) return w.slice(0, -2);
    if (w.endsWith('ces')) return `${w.slice(0, -3)}z`;
    if (w.endsWith('es')) {
      const stem = w.slice(0, -2);
      if (/(?:l|r|n|d|j|x|s)$/.test(stem)) return stem;
      return `${stem}e`;
    }
    if (/[aeiou]s$/.test(w)) return w.slice(0, -1);
    return w;
  }

  /** Pluralización heurística inversa (para formar títulos coherentes). */
  public static pluralize(word: string): string {
    const w = String(word || '').toLowerCase();
    if (!w) return w;
    if (/[aeiou]$/.test(w)) return `${w}s`;
    if (w.endsWith('z')) return `${w.slice(0, -1)}ces`;
    if (/[lrndjxs]$/.test(w)) return `${w}es`;
    return `${w}s`;
  }

  public static capitalize(input: string): string {
    const s = String(input || '');
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /** Clave de comparación insensible a mayúsculas, acentos y puntuación. */
  public static comparisonKey(input: string): string {
    return this.normalize(input).replace(/\s+/g, ' ');
  }
}
