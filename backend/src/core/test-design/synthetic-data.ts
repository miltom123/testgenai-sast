import { secureRandomFraction } from '../../common/security/secure-random';
// ==============================================================================
// Core Domain: SyntheticDataEngine (ISTQB & Industrial Boundary Test Data)
// Generador y Validador Matemático de Datos Sintéticos Especializados:
// 1. Algoritmo de Luhn Multimarca (Visa, Mastercard, Amex, Diners Club, JCB)
// 2. Documentos Iberoamérica (Perú DNI/RUC, Chile RUT, México RFC/CURP,
//    Argentina CUIT/CUIL, España NIF/NIE)
// 3. Fechas de Frontera Críticas (Bisiestos, DST, Fin de año, Unix Epoch 2038)
// 4. Catálogo de Payloads de Seguridad Pasiva (SQLi, XSS, Path Traversal, LDAP, XXE)
// 5. Cadenas Extremas, Unicode, Grafemas y Strings Nulos
// 6. Coordenadas Geográficas de Frontera
// 7. Archivos Sintéticos en Memoria (Base64)
// 8. Direcciones IP y Red (IPv4, IPv6, CIDR)
// ==============================================================================

export class SyntheticDataEngine {
  // ============================================================================
  // 1. ALGORITMO DE LUHN (ISO/IEC 7812) - MEDIOS DE PAGO MULTIMARCA
  // ============================================================================

  public static validateLuhn(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  public static generateLuhnCard(
    brand: 'visa' | 'mastercard' | 'amex' | 'diners' | 'jcb' = 'visa',
    isValid = true
  ): { cardNumber: string; brand: string; isValid: boolean; expDate: string; cvv: string } {
    let prefix = '4';
    let length = 16;
    let cvvLength = 3;

    if (brand === 'mastercard') {
      const mcPrefixes = ['51', '52', '53', '54', '55'];
      prefix = mcPrefixes[Math.floor(secureRandomFraction() * mcPrefixes.length)];
      length = 16;
    } else if (brand === 'amex') {
      prefix = secureRandomFraction() > 0.5 ? '34' : '37';
      length = 15;
      cvvLength = 4;
    } else if (brand === 'diners') {
      prefix = '36';
      length = 14;
      cvvLength = 3;
    } else if (brand === 'jcb') {
      prefix = '35';
      length = 16;
      cvvLength = 3;
    }

    let number = prefix;
    while (number.length < length - 1) {
      number += Math.floor(secureRandomFraction() * 10).toString();
    }

    let sum = 0;
    let shouldDouble = true;

    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    const finalCheckDigit = isValid ? checkDigit : (checkDigit + 1) % 10;
    const fullCardNumber = number + finalCheckDigit.toString();

    const currentYear = new Date().getFullYear();
    const expMonth = String(Math.floor(secureRandomFraction() * 12) + 1).padStart(2, '0');
    const expYear = String((currentYear + 2) % 100).padStart(2, '0');

    let cvv = '';
    for (let i = 0; i < cvvLength; i++) {
      cvv += Math.floor(secureRandomFraction() * 10).toString();
    }

    return {
      cardNumber: fullCardNumber,
      brand: brand.toUpperCase(),
      isValid,
      expDate: `${expMonth}/${expYear}`,
      cvv,
    };
  }

  // ============================================================================
  // 2. DOCUMENTOS DE IDENTIDAD IBEROAMÉRICA (PERÚ, CHILE, MÉXICO, ARGENTINA, ESPAÑA)
  // ============================================================================

  // --- PERÚ: DNI & RUC (Módulo 11 SUNAT) ---
  public static generateDni(isValid = true): { dni: string; isValid: boolean } {
    if (!isValid) return { dni: '7482910', isValid: false };
    const dniNum = Math.floor(secureRandomFraction() * (79999999 - 40000000 + 1)) + 40000000;
    return { dni: String(dniNum), isValid: true };
  }

  public static validateRuc(ruc: string): boolean {
    const cleaned = ruc.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    const prefix = cleaned.substring(0, 2);
    if (!['10', '15', '17', '20'].includes(prefix)) return false;

    const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cleaned.charAt(i), 10) * factors[i];

    const mod = sum % 11;
    let checkDigit = 11 - mod;
    if (checkDigit === 10) checkDigit = 0;
    else if (checkDigit === 11) checkDigit = 1;

    return checkDigit === parseInt(cleaned.charAt(10), 10);
  }

  public static generateRuc(
    type: 'natural' | 'juridica' = 'juridica',
    isValid = true
  ): { ruc: string; type: string; isValid: boolean; description: string } {
    const prefix = type === 'natural' ? '10' : '20';
    let base = prefix;
    for (let i = 0; i < 8; i++) base += Math.floor(secureRandomFraction() * 10).toString();

    const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(base.charAt(i), 10) * factors[i];

    const mod = sum % 11;
    let checkDigit = 11 - mod;
    if (checkDigit === 10) checkDigit = 0;
    else if (checkDigit === 11) checkDigit = 1;

    const finalCheck = isValid ? checkDigit : (checkDigit + 1) % 10;
    const desc = type === 'natural' ? 'Persona Natural con RUC' : 'Empresa / Persona Jurídica';

    return {
      ruc: base + finalCheck.toString(),
      type: desc,
      isValid,
      description: isValid ? `RUC válido (${desc}) con Módulo 11 SUNAT` : `RUC corrupto inválido`,
    };
  }

  // --- CHILE: RUT (Módulo 11 con dígito 0-9 o K) ---
  public static validateRutChile(rut: string): boolean {
    const cleaned = rut.replace(/[.-]/g, '').toUpperCase();
    if (cleaned.length < 8 || cleaned.length > 9) return false;

    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);

    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body.charAt(i), 10) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const res = 11 - (sum % 11);
    const expectedDv = res === 11 ? '0' : res === 10 ? 'K' : String(res);
    return dv === expectedDv;
  }

  public static generateRutChile(isValid = true): { rut: string; isValid: boolean } {
    const num = Math.floor(secureRandomFraction() * (25000000 - 10000000 + 1)) + 10000000;
    const body = String(num);

    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body.charAt(i), 10) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const res = 11 - (sum % 11);
    let dv = res === 11 ? '0' : res === 10 ? 'K' : String(res);
    if (!isValid) dv = dv === 'K' ? '1' : 'K';

    return { rut: `${body}-${dv}`, isValid };
  }

  // --- MÉXICO: RFC & CURP ---
  public static generateRfcMexico(type: 'fisica' | 'moral' = 'moral', isValid = true): { rfc: string; isValid: boolean } {
    if (!isValid) return { rfc: 'RFC-INVALID-99', isValid: false };
    if (type === 'moral') {
      return { rfc: 'AAA010101AAA', isValid: true };
    }
    return { rfc: 'AAMP850101AAA', isValid: true };
  }

  public static generateCurpMexico(isValid = true): { curp: string; isValid: boolean } {
    if (!isValid) return { curp: 'CURP-MALFORMED-001', isValid: false };
    return { curp: 'AAAA800101HDFRRN09', isValid: true };
  }

  // --- ARGENTINA: CUIT / CUIL (Módulo 11) ---
  public static validateCuitArgentina(cuit: string): boolean {
    const cleaned = cuit.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cleaned.charAt(i), 10) * factors[i];
    const mod = 11 - (sum % 11);
    const dv = mod === 11 ? 0 : mod === 10 ? 9 : mod;
    return dv === parseInt(cleaned.charAt(10), 10);
  }

  public static generateCuitArgentina(isValid = true): { cuit: string; isValid: boolean } {
    const prefix = '20';
    let middle = '';
    for (let i = 0; i < 8; i++) middle += Math.floor(secureRandomFraction() * 10).toString();
    const base = prefix + middle;
    const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(base.charAt(i), 10) * factors[i];
    const mod = 11 - (sum % 11);
    let dv = mod === 11 ? 0 : mod === 10 ? 9 : mod;
    if (!isValid) dv = (dv + 1) % 10;
    return { cuit: `${prefix}-${middle}-${dv}`, isValid };
  }

  // --- ESPAÑA: NIF / NIE (Módulo 23) ---
  public static validateNifSpain(nif: string): boolean {
    const cleaned = nif.trim().toUpperCase();
    if (!/^[0-9XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(cleaned)) return false;
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    let numStr = cleaned.slice(0, 8);
    numStr = numStr.replace('X', '0').replace('Y', '1').replace('Z', '2');
    const expectedLetter = letters[parseInt(numStr, 10) % 23];
    return cleaned.slice(-1) === expectedLetter;
  }

  public static generateNifSpain(isValid = true): { nif: string; isValid: boolean } {
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const num = Math.floor(secureRandomFraction() * (99999999 - 10000000 + 1)) + 10000000;
    let letter = letters[num % 23];
    if (!isValid) letter = letter === 'A' ? 'B' : 'A';
    return { nif: `${num}${letter}`, isValid };
  }

  // ============================================================================
  // 3. FECHAS DE FRONTERA CRÍTICAS (LEAP YEARS, DST, FIN DE AÑO, EPOCH 2038)
  // ============================================================================

  public static getCriticalBoundaryDates(): Record<string, { label: string; value: string; type: string; description: string }> {
    return {
      leapYearValid: {
        label: 'Año Bisiesto Válido (29 Feb)',
        value: '2024-02-29T12:00:00.000Z',
        type: 'boundary',
        description: 'Día bisiesto válido en año divisible por 4.',
      },
      leapYearInvalid: {
        label: 'Año No Bisiesto Inválido (29 Feb 2025)',
        value: '2025-02-29',
        type: 'negative',
        description: 'Fecha inexistente que debe ser rechazada por el validador.',
      },
      yearEndRollover: {
        label: 'Transición Fin de Año (31 Dic 23:59:59.999)',
        value: '2024-12-31T23:59:59.999Z',
        type: 'boundary',
        description: 'Último milisegundo antes del cambio de año fiscal.',
      },
      daylightSavingTime: {
        label: 'Cambio de Horario de Verano (DST)',
        value: '2024-03-31T01:59:59.000Z',
        type: 'boundary',
        description: 'Hora crítica donde el reloj salta 1 hora en regiones con DST.',
      },
      unixEpoch2038: {
        label: 'Límite Crítico Unix Epoch 2038 (Y2K38)',
        value: '2038-01-19T03:14:07.000Z',
        type: 'boundary',
        description: 'Último segundo soportado por enteros de 32 bits signed (2^31 - 1 = 2147483647).',
      },
      unixEpoch2038Overflow: {
        label: 'Desbordamiento Unix Epoch 2038 (+1 segundo)',
        value: '2038-01-19T03:14:08.000Z',
        type: 'boundary',
        description: 'Provoca desbordamiento en sistemas con marcas de tiempo de 32 bits.',
      },
    };
  }

  // ============================================================================
  // 4. PAYLOADS DE SEGURIDAD PASIVA (OWASP ASVS v4.0)
  // ============================================================================

  public static getPassiveSecurityPayloads(): Record<string, { label: string; payload: string; category: string; description: string }> {
    return {
      sqlInjectionAuthBypass: {
        label: 'SQLi - Bypass de Autenticación',
        payload: `' OR '1'='1`,
        category: 'SQL_INJECTION',
        description: 'Comprobar parametrización de consultas en formularios de login.',
      },
      sqlInjectionUnion: {
        label: 'SQLi - Inyección UNION SELECT',
        payload: `' UNION SELECT NULL, NULL, NULL--`,
        category: 'SQL_INJECTION',
        description: 'Verificar mitigación contra extracción no autorizada de esquemas.',
      },
      xssPassiveScript: {
        label: 'XSS - Script Tag Pasivo',
        payload: `<script>console.log("xss_defense_test")</script>`,
        category: 'XSS',
        description: 'Verificar que la vista aplique escape de entidades HTML automáticas.',
      },
      xssImgOnError: {
        label: 'XSS - Event Handler Img OnError',
        payload: `<img src="nonexistent.png" onerror="console.warn('xss_attempt')">`,
        category: 'XSS',
        description: 'Verificar filtrado de manejadores de eventos JavaScript en atributos HTML.',
      },
      pathTraversalLinux: {
        label: 'Path Traversal - Sistema Operativo Linux',
        payload: `../../../../etc/passwd`,
        category: 'PATH_TRAVERSAL',
        description: 'Verificar que rutas de archivos no permitan salir del directorio raíz.',
      },
      pathTraversalWindows: {
        label: 'Path Traversal - Sistema Operativo Windows',
        payload: `..\\..\\..\\..\\Windows\\win.ini`,
        category: 'PATH_TRAVERSAL',
        description: 'Verificar escape de separadores de ruta en sistemas Windows.',
      },
      ldapInjection: {
        label: 'LDAP Injection',
        payload: `*)(uid=*))(|(uid=*`,
        category: 'LDAP',
        description: 'Verificar sanitización de filtros en directorios corporativos.',
      },
      xxeInjection: {
        label: 'XML External Entity (XXE)',
        payload: `<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]><foo>&xxe;</foo>`,
        category: 'XXE',
        description: 'Verificar deshabilitación de DTDs y entidades externas en parsers XML.',
      },
      formulaInjectionExcel: {
        label: 'Inyección de Fórmulas en Hoja de Cálculo',
        payload: `=CMD|' /C calc'!A0`,
        category: 'CSV_INJECTION',
        description: 'Verificar neutralización de caracteres iniciales (=, +, -, @) en exportaciones.',
      },
    };
  }

  // ============================================================================
  // 5. STRINGS EXTREMOS, UNICODE, GRAFEMAS Y VALORES NULOS
  // ============================================================================

  public static getBoundaryDataSet(maxLength = 255): Record<string, { label: string; value: string; type: string; purpose: string }> {
    return {
      emptyString: {
        label: 'Cadena Vacía',
        value: '',
        type: 'negative',
        purpose: 'Verificar validación de campo requerido (longitud 0).',
      },
      singleChar: {
        label: 'Carácter Único',
        value: 'A',
        type: 'boundary',
        purpose: 'Verificar frontera mínima de texto (1 carácter).',
      },
      exactMax: {
        label: `Límite Máximo Exacto (${maxLength} chars)`,
        value: 'X'.repeat(maxLength),
        type: 'boundary',
        purpose: `Verificar aceptación exacta de ${maxLength} caracteres.`,
      },
      exceededMax: {
        label: `Excedente en 1 Carácter (${maxLength + 1} chars)`,
        value: 'X'.repeat(maxLength + 1),
        type: 'negative',
        purpose: 'Verificar rechazo al sobrepasar la longitud en 1 carácter.',
      },
      unicodeDiacritics: {
        label: 'Unicode, Acentos y Diacríticos',
        value: 'José Peña — ¡Áéíóú! Ångström ç Ü ñ',
        type: 'validation',
        purpose: 'Verificar compatibilidad UTF-8 sin corrupción de caracteres (mojibake).',
      },
      rightToLeftArabic: {
        label: 'Texto Bidireccional RTL (Árabe)',
        value: 'مرحبا بالعالم - تجربة الجودة',
        type: 'validation',
        purpose: 'Verificar renderizado correcto de lenguajes derecha a izquierda.',
      },
      rightToLeftHebrew: {
        label: 'Texto Bidireccional RTL (Hebreo)',
        value: 'שלום עולם - בדיקת איכות',
        type: 'validation',
        purpose: 'Verificar renderizado de fuentes hebreas y dirección de texto.',
      },
      multiByteEmojis: {
        label: 'Emojis Compuestos Multi-Byte (ZWJ)',
        value: '👨‍👩‍👧‍👦 🏳️‍🌈 🚀⚡🛡️',
        type: 'validation',
        purpose: 'Verificar almacenamiento en BD compatible con utf8mb4 (4 bytes por grafema).',
      },
      nullByteInjection: {
        label: 'Inyección de Byte Nulo (Null Byte Poisoning)',
        value: 'documento_confidencial.pdf\0.png',
        type: 'negative',
        purpose: 'Verificar que el motor de archivos no trunque rutas al encontrar \\0.',
      },
      falsyStrings: {
        label: 'Cadenas con Literales Reservados de Lenguaje',
        value: 'null',
        type: 'validation',
        purpose: 'Verificar que la cadena literal "null" o "undefined" no sea tratada como valor nulo.',
      },
      spacesPadding: {
        label: 'Espacios en Blanco Perimetrales',
        value: '   texto con espacios perimetrales   ',
        type: 'validation',
        purpose: 'Verificar si el sistema aplica trim() o preserva espacios indebidamente.',
      },
    };
  }

  // ============================================================================
  // 6. COORDENADAS GEOGRÁFICAS DE FRONTERA
  // ============================================================================

  public static getBoundaryGeoCoordinates(): Record<string, { label: string; lat: number; lng: number; isValid: boolean; description: string }> {
    return {
      nullIsland: {
        label: 'Null Island (0, 0)',
        lat: 0.0,
        lng: 0.0,
        isValid: true,
        description: 'Intersección del Ecuador y el Meridiano de Greenwich.',
      },
      northPoleMax: {
        label: 'Polo Norte Máximo (+90° Lat)',
        lat: 90.0,
        lng: 0.0,
        isValid: true,
        description: 'Límite superior exacto de latitud.',
      },
      northPoleExceeded: {
        label: 'Polo Norte Excedido (+90.0001° Lat)',
        lat: 90.0001,
        lng: 0.0,
        isValid: false,
        description: 'Latitud inválida por superar el cénit geográfico.',
      },
      southPoleMin: {
        label: 'Polo Sur Mínimo (-90° Lat)',
        lat: -90.0,
        lng: 0.0,
        isValid: true,
        description: 'Límite inferior exacto de latitud.',
      },
      antimeridianEast: {
        label: 'Antimeridiano Este (+180° Lng)',
        lat: 0.0,
        lng: 180.0,
        isValid: true,
        description: 'Límite este exacto de longitud geográfica.',
      },
      antimeridianWest: {
        label: 'Antimeridiano Oeste (-180° Lng)',
        lat: 0.0,
        lng: -180.0,
        isValid: true,
        description: 'Límite oeste exacto de longitud geográfica.',
      },
      longitudeExceeded: {
        label: 'Longitud Excedida (+180.0001° Lng)',
        lat: 0.0,
        lng: 180.0001,
        isValid: false,
        description: 'Longitud inválida fuera de la esfera terrestre.',
      },
    };
  }

  // ============================================================================
  // 7. ARCHIVOS SINTÉTICOS EN MEMORIA
  // ============================================================================

  public static getSyntheticFiles(): Record<string, { filename: string; mimeType: string; sizeBytes: number; base64: string; purpose: string }> {
    return {
      emptyFileZeroBytes: {
        filename: 'archivo_vacio_0bytes.dat',
        mimeType: 'application/octet-stream',
        sizeBytes: 0,
        base64: '',
        purpose: 'Probar rechazo de archivos vacíos de 0 bytes.',
      },
      minimalPngValid: {
        filename: 'pixel_transparente_1x1.png',
        mimeType: 'image/png',
        sizeBytes: 68,
        // PNG 1x1 transparente válido estándar en Base64
        base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        purpose: 'Probar carga de imagen PNG con Magic Bytes válidos (89 50 4E 47).',
      },
      minimalPdfValid: {
        filename: 'documento_minimo_valido.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 94,
        // PDF mínimo con firma %PDF-1.4
        base64: Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 0>>endobj\nxref\n0 3\ntrailer<</Size 3/Root 1 0 R>>\nstartxref\n70\n%%EOF').toString('base64'),
        purpose: 'Probar procesamiento de documentos PDF estructuralmente válidos.',
      },
      spoofedExeDisguisedAsPdf: {
        filename: 'factura_trampa.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 12,
        // Archivo que comienza con 'MZ' (cabecera ejecutable DOS/Windows) pero tiene extensión .pdf
        base64: Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00').toString('base64'),
        purpose: 'Probar validación de Magic Bytes reales para prevenir spoofing de extensiones.',
      },
    };
  }

  // ============================================================================
  // 8. DIRECCIONES IP Y RED (IPv4, IPv6, CIDR)
  // ============================================================================

  public static getNetworkData(): Record<string, { label: string; value: string; family: 'IPv4' | 'IPv6'; type: string; purpose: string }> {
    return {
      ipv4PrivateClassA: {
        label: 'IPv4 Privada Clase A (RFC 1918)',
        value: '10.0.45.12',
        family: 'IPv4',
        type: 'valid_private',
        purpose: 'Verificar aceptación de rangos LAN corporativos.',
      },
      ipv4Loopback: {
        label: 'IPv4 Loopback Localhost',
        value: '127.0.0.1',
        family: 'IPv4',
        type: 'valid_loopback',
        purpose: 'Verificar restricciones de loopback en entornos de producción.',
      },
      ipv4Broadcast: {
        label: 'IPv4 Broadcast de Red',
        value: '255.255.255.255',
        family: 'IPv4',
        type: 'valid_broadcast',
        purpose: 'Verificar manejo de direcciones de difusión.',
      },
      ipv4InvalidOctet: {
        label: 'IPv4 Inválida (Octeto > 255)',
        value: '192.168.1.300',
        family: 'IPv4',
        type: 'negative',
        purpose: 'Verificar rechazo de octetos numéricos fuera de rango [0-255].',
      },
      ipv6CompressedLoopback: {
        label: 'IPv6 Loopback Comprimido (::1)',
        value: '::1',
        family: 'IPv6',
        type: 'valid_loopback',
        purpose: 'Verificar soporte de compresión doble punto en IPv6.',
      },
      ipv6FullValid: {
        label: 'IPv6 Estructura Completa (8 Grupos)',
        value: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        family: 'IPv6',
        type: 'valid_public',
        purpose: 'Verificar parsing de direcciones completas de 128 bits.',
      },
      cidrCorporateSubnet: {
        label: 'Máscara de Subred CIDR /24',
        value: '192.168.1.0/24',
        family: 'IPv4',
        type: 'valid_cidr',
        purpose: 'Verificar parsing de notación de prefijo de red CIDR.',
      },
    };
  }

  // ============================================================================
  // 9. CORREOS ELECTRÓNICOS SINTÉTICOS DE PRUEBA
  // ============================================================================

  public static getSyntheticEmail(isValid = true): string {
    const timestamp = Date.now().toString().slice(-4);
    if (isValid) {
      return `qa.tester_${timestamp}@sandbox.example.com`;
    }
    return `qa.tester_${timestamp}@invalid..domain`;
  }
}
