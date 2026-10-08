import { logger } from './logger';

/**
 * Parseo defensivo de un array serializado como JSON (p. ej. steps/preconditions
 * almacenados como texto en SQLite). Ante contenido corrupto no lanza: registra
 * la anomalía y devuelve un arreglo vacío para no romper la respuesta.
 */
export function safeJsonArray(raw: unknown): unknown[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      logger.warn({ raw: raw.slice(0, 120) }, 'JSON malformado al deserializar array; se devuelve []');
      return [];
    }
  }
  return [];
}

/** Parseo defensivo de un objeto JSON opcional. Devuelve null ante error. */
export function safeJsonObject(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      logger.warn({ raw: raw.slice(0, 120) }, 'JSON malformado al deserializar objeto; se devuelve null');
      return null;
    }
  }
  return null;
}
