// ==============================================================================
// Infrastructure: OpenApiImporterService (Mejora 63)
// Importador de especificaciones OpenAPI 3.0 / Swagger JSON para deducir
// requisitos y casos de prueba de contratos de API REST de forma determinista.
// ==============================================================================

import { prisma } from '../../config/prisma';
import { logger } from '../../common/utils/logger';
import { ApiError } from '../../common/errors/api-error';

export interface OpenApiEndpointCase {
  endpoint: string;
  method: string;
  summary: string;
  expectedStatus: string;
  title: string;
  type: 'positive' | 'negative' | 'boundary';
}

export class OpenApiImporterService {
  /**
   * Procesa un JSON de OpenAPI y crea requisitos y casos de prueba asociados en el proyecto.
   */
  public static async importOpenApiSpec(projectId: string, openApiJson: Record<string, unknown>) {
    const paths = (openApiJson.paths as Record<string, Record<string, unknown>>) || {};
    const pathKeys = Object.keys(paths);

    if (pathKeys.length === 0) {
      throw ApiError.badRequest('El archivo OpenAPI no contiene rutas (paths) válidas.');
    }

    const createdRequirements = [];

    for (const pathKey of pathKeys) {
      const pathMethods = paths[pathKey];
      for (const [method, operationRaw] of Object.entries(pathMethods)) {
        if (!['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) continue;

        const operation = (operationRaw as Record<string, unknown>) || {};
        const summary = (operation.summary as string) || `${method.toUpperCase()} ${pathKey}`;
        const description = (operation.description as string) || `Contrato OpenAPI para el endpoint ${method.toUpperCase()} ${pathKey}`;

        // Obtener siguiente número de requisito atómico
        const project = await prisma.project.findUniqueOrThrow({
          where: { id: projectId },
          select: { nextRequirementNumber: true },
        });

        const reqCode = `REQ-${String(project.nextRequirementNumber).padStart(3, '0')}`;
        await prisma.project.update({
          where: { id: projectId },
          data: { nextRequirementNumber: project.nextRequirementNumber + 1 },
        });

        // Crear Requisito
        const requirement = await prisma.requirement.create({
          data: {
            projectId,
            code: reqCode,
            title: `[API] ${summary}`,
            description,
            acceptanceCriteria: `1. El endpoint ${method.toUpperCase()} ${pathKey} debe responder con códigos de estado HTTP estándar según especificación OpenAPI.\n2. Cabecera Content-Type debe ser application/json.\n3. Rechazar peticiones no autorizadas o con payload malformado.`,
            status: 'GENERATED',
            nextCaseNumber: 4, // 3 casos generados inicialmente
            testCases: {
              create: [
                {
                  code: 'CP-001',
                  type: 'positive',
                  title: `[API 200/201] Petición exitosa a ${method.toUpperCase()} ${pathKey}`,
                  preconditions: ['El servicio API REST está activo.', 'Credenciales y token válidos.'],
                  steps: [`1. Enviar petición HTTP ${method.toUpperCase()} a la ruta "${pathKey}".`, '2. Verificar código HTTP.'],
                  testData: `Método: ${method.toUpperCase()} | Ruta: ${pathKey}`,
                  expectedResult: 'El servidor retorna status 200 OK o 201 Created con esquema JSON válido.',
                  priority: 'high',
                  evidenceStatus: 'pending',
                  source: 'MANUAL',
                  status: 'PENDING',
                },
                {
                  code: 'CP-002',
                  type: 'negative',
                  title: `[API 401] Petición no autenticada a ${method.toUpperCase()} ${pathKey}`,
                  preconditions: ['La petición no incluye cabecera Authorization.'],
                  steps: [`1. Enviar petición HTTP ${method.toUpperCase()} sin token JWT.`],
                  testData: 'Cabecera Authorization ausente',
                  expectedResult: 'El servidor responde 401 Unauthorized y bloquea la ejecución.',
                  priority: 'high',
                  evidenceStatus: 'pending',
                  source: 'MANUAL',
                  status: 'PENDING',
                },
                {
                  code: 'CP-003',
                  type: 'validation',
                  title: `[API 400/422] Validación de payload malformado en ${method.toUpperCase()} ${pathKey}`,
                  preconditions: ['El endpoint requiere cuerpo o parámetros estructurados.'],
                  steps: ['1. Enviar cuerpo de petición con tipos de datos inválidos.'],
                  testData: 'Body: {"invalido": true}',
                  expectedResult: 'El servidor retorna 400 Bad Request o 422 Unprocessable Entity indicando los campos erróneos.',
                  priority: 'medium',
                  evidenceStatus: 'pending',
                  source: 'MANUAL',
                  status: 'PENDING',
                },
              ],
            },
          },
        });

        createdRequirements.push(requirement);
      }
    }

    logger.info({ projectId, importedRequirements: createdRequirements.length }, 'Especificación OpenAPI importada');

    return {
      projectId,
      totalEndpointsImported: createdRequirements.length,
      requirements: createdRequirements,
    };
  }
}
