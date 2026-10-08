import { prisma } from '../../config/prisma';
import { ApiError } from '../errors/api-error';

/**
 * Guards de autorización a nivel de recurso (previene IDOR / Broken Access Control).
 *
 * Cada función verifica que el recurso solicitado pertenezca (directa o
 * transitivamente) al usuario autenticado. Si no existe o no le pertenece,
 * se lanza un 404 (no un 403) para no revelar la existencia de recursos ajenos.
 *
 * Nota: los usuarios ADMIN pueden acceder a cualquier recurso.
 */

function isAdmin(role?: string): boolean {
  return role === 'ADMIN';
}

/** Verifica que el proyecto pertenezca al usuario. Devuelve el proyecto. */
export async function assertProjectAccess(projectId: string, userId: string, role?: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw ApiError.notFound('Proyecto no encontrado');
  if (!isAdmin(role) && project.ownerId !== userId) {
    throw ApiError.notFound('Proyecto no encontrado');
  }
  return project;
}

/** Verifica el acceso a un requisito a través del proyecto que lo contiene. */
export async function assertRequirementAccess(requirementId: string, userId: string, role?: string) {
  const requirement = await prisma.requirement.findUnique({
    where: { id: requirementId },
    include: { project: { select: { ownerId: true } } },
  });
  if (!requirement) throw ApiError.notFound('Requisito no encontrado');
  if (!isAdmin(role) && requirement.project.ownerId !== userId) {
    throw ApiError.notFound('Requisito no encontrado');
  }
  return requirement;
}

/** Verifica el acceso a un caso de prueba a través de requisito -> proyecto. */
export async function assertTestCaseAccess(testCaseId: string, userId: string, role?: string) {
  const testCase = await prisma.testCase.findUnique({
    where: { id: testCaseId },
    include: { requirement: { select: { project: { select: { ownerId: true } } } } },
  });
  if (!testCase) throw ApiError.notFound('Caso de prueba no encontrado');
  if (!isAdmin(role) && testCase.requirement.project.ownerId !== userId) {
    throw ApiError.notFound('Caso de prueba no encontrado');
  }
  return testCase;
}
