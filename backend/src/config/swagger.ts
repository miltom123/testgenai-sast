import type { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'TestGenAI API',
    version: '1.0.0',
    description:
      'API REST para generación de casos de prueba funcionales mediante IA generativa real (Gemini / OpenAI), revisión humana, trazabilidad de requisitos y exportación. Rutas oficiales versionadas bajo /api/v1.',
  },
  servers: [{ url: '/api/v1', description: 'API v1' }],
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'testgenai_session' },
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          message: { type: 'string' },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: { tags: ['Auth'], summary: 'Registrar cuenta de usuario (rol fijo QA_TESTER)', security: [], responses: { '201': { description: 'Creado' } } },
    },
    '/auth/login': {
      post: { tags: ['Auth'], summary: 'Iniciar sesión con cookies HttpOnly', security: [], responses: { '200': { description: 'OK' } } },
    },
    '/auth/refresh': {
      post: { tags: ['Auth'], summary: 'Rotar par de tokens JWT persistidos', responses: { '200': { description: 'OK' } } },
    },
    '/auth/logout': {
      post: { tags: ['Auth'], summary: 'Cerrar sesión y revocar refresh token', responses: { '200': { description: 'OK' } } },
    },
    '/auth/me': {
      get: { tags: ['Auth'], summary: 'Obtener perfil del usuario autenticado', responses: { '200': { description: 'OK' } } },
    },
    '/config/ai-providers': {
      get: { tags: ['Config'], summary: 'Consultar estado seguro de proveedores y modelos de IA', responses: { '200': { description: 'OK' } } },
    },
    '/users': {
      get: { tags: ['Usuarios'], summary: 'Listar usuarios (solo ADMIN)', responses: { '200': { description: 'OK' } } },
    },
    '/projects': {
      get: {
        tags: ['Projects'],
        summary: 'Listar proyectos del usuario (paginado)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'OK' } },
      },
      post: { tags: ['Projects'], summary: 'Crear proyecto', responses: { '201': { description: 'Creado' } } },
    },
    '/projects/{id}': {
      get: { tags: ['Projects'], summary: 'Detalle de proyecto', responses: { '200': { description: 'OK' } } },
      put: { tags: ['Projects'], summary: 'Actualizar proyecto', responses: { '200': { description: 'OK' } } },
    },
    '/projects/{id}/archive': {
      patch: { tags: ['Projects'], summary: 'Archivar proyecto', responses: { '200': { description: 'OK' } } },
    },
    '/requirements': {
      post: { tags: ['Requirements'], summary: 'Crear requisito funcional', responses: { '201': { description: 'Creado' } } },
    },
    '/requirements/project/{projectId}': {
      get: { tags: ['Requirements'], summary: 'Requisitos de un proyecto (paginado)', responses: { '200': { description: 'OK' } } },
    },
    '/requirements/{id}': {
      get: { tags: ['Requirements'], summary: 'Detalle de requisito con análisis de ambigüedad', responses: { '200': { description: 'OK' } } },
      put: { tags: ['Requirements'], summary: 'Actualizar requisito con versión concurrente', responses: { '200': { description: 'OK' } } },
    },
    '/requirements/import/preview': {
      post: { tags: ['Requirements'], summary: 'Previsualizar y validar importación CSV o JSON', responses: { '200': { description: 'OK' } } },
    },
    '/requirements/import': {
      post: { tags: ['Requirements'], summary: 'Importar lote validado de requisitos', responses: { '201': { description: 'Importado' } } },
    },
    '/ai/generate': {
      post: {
        tags: ['IA'],
        summary: 'Generar casos de prueba con IA real (Gemini u OpenAI)',
        responses: { '201': { description: 'Generado' }, '502': { description: 'Error en proveedor de IA' } },
      },
    },
    '/test-cases/project/{projectId}': {
      get: { tags: ['TestCases'], summary: 'Listar casos de un proyecto (paginado)', responses: { '200': { description: 'OK' } } },
    },
    '/test-cases/{id}': {
      get: { tags: ['TestCases'], summary: 'Detalle de caso de prueba con revisiones', responses: { '200': { description: 'OK' } } },
    },
    '/test-cases/{id}/review': {
      patch: { tags: ['TestCases'], summary: 'Revisión humana individual (aprobar, editar o rechazar con snapshot)', responses: { '200': { description: 'OK' } } },
    },
    '/test-cases/{id}/history': {
      get: { tags: ['TestCases'], summary: 'Historial de revisiones antes/después del caso', responses: { '200': { description: 'OK' } } },
    },
    '/traceability/{projectId}': {
      get: { tags: ['Trazabilidad'], summary: 'Matriz de trazabilidad y cobertura vigente', responses: { '200': { description: 'OK' } } },
    },
    '/metrics/project/{projectId}': {
      get: { tags: ['Métricas'], summary: 'Métricas de calidad ISTQB y economía de IA del proyecto', responses: { '200': { description: 'OK' } } },
    },
    '/export/{projectId}': {
      get: {
        tags: ['Export'],
        summary: 'Descargar especificación oficial de casos aprobados (csv, json, markdown)',
        parameters: [
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['csv', 'json', 'markdown'], default: 'json' } },
        ],
        responses: { '200': { description: 'Archivo descargado' } },
      },
    },
  },
} as const;

export function mountSwagger(app: Express) {
  app.get('/api/docs.json', (_req: Request, res: Response) => res.json(openApiSpec));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: 'TestGenAI API Docs' }));
}
