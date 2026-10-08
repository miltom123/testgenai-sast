export interface MaskingResult {
  maskedText: string;
  piiFound: boolean;
  totalMasked: number;
  maskMap: Map<string, string>; // placeholder -> original
}

export interface MultiMaskingResult<T extends Record<string, string>> {
  maskedFields: T;
  piiFound: boolean;
  totalMasked: number;
  maskMap: Map<string, string>;
}

export class PIIMasker {
  private static readonly EMAIL_REGEX = /\b[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,63}\b/g;
  private static readonly CREDIT_CARD_REGEX = /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b|\b\d{15,16}\b/g;
  private static readonly PHONE_REGEX = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g;
  private static readonly API_KEY_REGEX = /\b(?:sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{30,}|AIza[0-9A-Za-z-_]{35}|Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)\b/g;
  private static readonly DNI_REGEX = /\b\d{8}[A-Z]?\b|\b[A-Z]{1,2}-?\d{6,8}\b/g;
  private static readonly IP_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;

  /**
   * Enmascara un solo texto.
   */
  static mask(text: string): MaskingResult {
    const res = this.maskWithMap(text, new Map<string, string>(), { counter: 1 });
    return {
      maskedText: res.masked,
      piiFound: res.maskMap.size > 0,
      totalMasked: res.maskMap.size,
      maskMap: res.maskMap,
    };
  }

  /**
   * Enmascara múltiples campos (título, descripción, criterios de aceptación)
   * utilizando un único contador y mapa compartido para evitar colisiones de placeholders.
   */
  static maskMultiple<T extends Record<string, string>>(fields: T): MultiMaskingResult<T> {
    const maskMap = new Map<string, string>();
    const state = { counter: 1 };
    const maskedFields = {} as T;

    for (const key of Object.keys(fields) as Array<keyof T>) {
      const res = this.maskWithMap(fields[key] || '', maskMap, state);
      maskedFields[key] = res.masked as T[keyof T];
    }

    return {
      maskedFields,
      piiFound: maskMap.size > 0,
      totalMasked: maskMap.size,
      maskMap,
    };
  }

  private static maskWithMap(
    text: string,
    maskMap: Map<string, string>,
    state: { counter: number }
  ): { masked: string; maskMap: Map<string, string> } {
    let masked = text || '';

    // 1. Claves API y Tokens
    masked = masked.replace(this.API_KEY_REGEX, (match) => {
      const tag = `{{SECRET_TOKEN_${state.counter++}}}`;
      maskMap.set(tag, match);
      return tag;
    });

    // 2. Tarjetas de crédito
    masked = masked.replace(this.CREDIT_CARD_REGEX, (match) => {
      const cleanDigits = match.replace(/\D/g, '');
      if (cleanDigits.length >= 13 && cleanDigits.length <= 19) {
        const tag = `{{CARD_MASKED_${state.counter++}}}`;
        maskMap.set(tag, match);
        return tag;
      }
      return match;
    });

    // 3. Correos electrónicos
    masked = masked.replace(this.EMAIL_REGEX, (match) => {
      const tag = `{{EMAIL_MASKED_${state.counter++}}}`;
      maskMap.set(tag, match);
      return tag;
    });

    // 4. Teléfonos
    masked = masked.replace(this.PHONE_REGEX, (match) => {
      const digits = match.replace(/\D/g, '');
      if (digits.length >= 7 && digits.length <= 15) {
        const tag = `{{PHONE_MASKED_${state.counter++}}}`;
        maskMap.set(tag, match);
        return tag;
      }
      return match;
    });

    // 5. Documentos de Identidad (DNI)
    masked = masked.replace(this.DNI_REGEX, (match) => {
      const tag = `{{ID_MASKED_${state.counter++}}}`;
      maskMap.set(tag, match);
      return tag;
    });

    // 6. Direcciones IP
    masked = masked.replace(this.IP_REGEX, (match) => {
      const tag = `{{IP_MASKED_${state.counter++}}}`;
      maskMap.set(tag, match);
      return tag;
    });

    return { masked, maskMap };
  }

  /**
   * Restaura los datos originales en un texto previamente enmascarado.
   */
  static unmask(maskedText: string, maskMap: Map<string, string>): string {
    if (!maskedText) return maskedText;
    let unmasked = maskedText;
    maskMap.forEach((original, placeholder) => {
      unmasked = unmasked.split(placeholder).join(original);
    });
    return unmasked;
  }
}
