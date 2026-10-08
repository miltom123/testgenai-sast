// ==============================================================================
// Servicio de Importación Robusta de Requisitos (CSV / JSON)
// Soporta RFC 4180 (comillas dobles, comas internas, saltos de línea, cabeceras)
// Valida fila por fila e informa errores detallados antes de guardar.
// ==============================================================================

import { z } from 'zod';

export const requirementImportRowSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'El código debe tener al menos 2 caracteres (ej: REQ-001)')
    .max(50, 'El código no debe exceder 50 caracteres'),
  title: z
    .string()
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(250, 'El título no debe exceder 250 caracteres'),
  description: z
    .string()
    .trim()
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(5000, 'La descripción no debe exceder 5000 caracteres'),
  acceptanceCriteria: z
    .string()
    .trim()
    .min(5, 'Los criterios de aceptación deben tener al menos 5 caracteres')
    .max(5000, 'Los criterios no deben exceder 5000 caracteres'),
});

export type RequirementImportRow = z.infer<typeof requirementImportRowSchema>;

export interface RowValidationError {
  rowNumber: number;
  code?: string;
  field?: string;
  message: string;
}

export interface ImportPreviewResult {
  totalRows: number;
  validRows: RequirementImportRow[];
  errors: RowValidationError[];
  isValid: boolean;
}

export class RequirementImportService {
  /**
   * Parser CSV compatible con RFC 4180 (manejo exacto de comillas, comas y multilíneas).
   */
  public static parseCsv(csvText: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Comilla escapada ("")
          currentField += '"';
          i++; // saltar siguiente comilla
        } else {
          // Cambiar estado dentro/fuera de comillas
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // Fin de campo
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' && !insideQuotes) {
        // Fin de línea
        currentRow.push(currentField);
        // Descartar filas completamente vacías
        if (currentRow.some((f) => f.trim().length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField);
      if (currentRow.some((f) => f.trim().length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  /**
   * Previsualiza y valida filas CSV o JSON antes de persistir en base de datos.
   */
  public static previewCsv(csvContent: string): ImportPreviewResult {
    const rawMatrix = this.parseCsv(csvContent);
    if (rawMatrix.length === 0) {
      return {
        totalRows: 0,
        validRows: [],
        errors: [{ rowNumber: 0, message: 'El archivo CSV está vacío.' }],
        isValid: false,
      };
    }

    // Identificar cabeceras (primera fila)
    const headerRow = rawMatrix[0].map((h) => h.trim().toLowerCase());
    let codeIdx = headerRow.findIndex((h) => h.includes('cod') || h === 'id' || h === 'code');
    let titleIdx = headerRow.findIndex((h) => h.includes('tit') || h === 'title' || h === 'nombre');
    let descIdx = headerRow.findIndex((h) => h.includes('desc') || h === 'description');
    let critIdx = headerRow.findIndex(
      (h) => h.includes('crit') || h.includes('aceptac') || h === 'criteria'
    );

    let startDataRow = 1;
    // Si no se reconocieron cabeceras, asumir orden por defecto: code, title, description, criteria
    if (codeIdx === -1 && titleIdx === -1 && descIdx === -1) {
      codeIdx = 0;
      titleIdx = 1;
      descIdx = 2;
      critIdx = 3;
      startDataRow = 0;
    } else {
      // Si faltan cabeceras clave
      if (titleIdx === -1 || descIdx === -1) {
        return {
          totalRows: rawMatrix.length - 1,
          validRows: [],
          errors: [
            {
              rowNumber: 1,
              message:
                'Cabeceras requeridas no encontradas. El CSV debe incluir: código, título, descripción y criterios de aceptación.',
            },
          ],
          isValid: false,
        };
      }
      if (codeIdx === -1) codeIdx = 0;
      if (critIdx === -1) critIdx = 3;
    }

    const validRows: RequirementImportRow[] = [];
    const errors: RowValidationError[] = [];
    const seenCodesInBatch = new Set<string>();

    for (let r = startDataRow; r < rawMatrix.length; r++) {
      const row = rawMatrix[r];
      const rowNumber = r + 1;

      const rawCode = (row[codeIdx] || '').trim();
      const rawTitle = (row[titleIdx] || '').trim();
      const rawDesc = (row[descIdx] || '').trim();
      const rawCrit = (row[critIdx] || '').trim();

      const parseResult = requirementImportRowSchema.safeParse({
        code: rawCode,
        title: rawTitle,
        description: rawDesc,
        acceptanceCriteria: rawCrit,
      });

      if (!parseResult.success) {
        parseResult.error.errors.forEach((err) => {
          errors.push({
            rowNumber,
            code: rawCode,
            field: err.path.join('.'),
            message: err.message,
          });
        });
      } else {
        const validated = parseResult.data;
        if (seenCodesInBatch.has(validated.code.toUpperCase())) {
          errors.push({
            rowNumber,
            code: validated.code,
            field: 'code',
            message: `Código duplicado '${validated.code}' en la misma lista de importación.`,
          });
        } else {
          seenCodesInBatch.add(validated.code.toUpperCase());
          validRows.push(validated);
        }
      }
    }

    return {
      totalRows: rawMatrix.length - startDataRow,
      validRows,
      errors,
      isValid: errors.length === 0 && validRows.length > 0,
    };
  }

  /**
   * Previsualiza y valida un array de objetos JSON para importación.
   */
  public static previewJson(data: unknown[]): ImportPreviewResult {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        totalRows: 0,
        validRows: [],
        errors: [{ rowNumber: 0, message: 'El payload JSON debe ser un array con al menos 1 requisito.' }],
        isValid: false,
      };
    }

    const validRows: RequirementImportRow[] = [];
    const errors: RowValidationError[] = [];
    const seenCodesInBatch = new Set<string>();

    for (let i = 0; i < data.length; i++) {
      const rowNumber = i + 1;
      const item = data[i] as Record<string, unknown>;

      const rawCode = String(item.code || item.codigo || '').trim();
      const rawTitle = String(item.title || item.titulo || '').trim();
      const rawDesc = String(item.description || item.descripcion || '').trim();
      const rawCrit = String(item.acceptanceCriteria || item.criterios || '').trim();

      const parseResult = requirementImportRowSchema.safeParse({
        code: rawCode,
        title: rawTitle,
        description: rawDesc,
        acceptanceCriteria: rawCrit,
      });

      if (!parseResult.success) {
        parseResult.error.errors.forEach((err) => {
          errors.push({
            rowNumber,
            code: rawCode,
            field: err.path.join('.'),
            message: err.message,
          });
        });
      } else {
        const validated = parseResult.data;
        if (seenCodesInBatch.has(validated.code.toUpperCase())) {
          errors.push({
            rowNumber,
            code: validated.code,
            field: 'code',
            message: `Código duplicado '${validated.code}' en la misma lista de importación.`,
          });
        } else {
          seenCodesInBatch.add(validated.code.toUpperCase());
          validRows.push(validated);
        }
      }
    }

    return {
      totalRows: data.length,
      validRows,
      errors,
      isValid: errors.length === 0 && validRows.length > 0,
    };
  }
}
