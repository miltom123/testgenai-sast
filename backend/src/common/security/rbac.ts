import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/api-response';

export type UserRole = 'ADMIN' | 'QA_LEAD' | 'QA_TESTER' | 'DEVELOPER' | 'VIEWER';

export type Permission =
  | 'project:create'
  | 'project:read'
  | 'project:update'
  | 'project:delete'
  | 'requirement:create'
  | 'requirement:read'
  | 'requirement:update'
  | 'requirement:delete'
  | 'testcase:generate'
  | 'testcase:approve'
  | 'testcase:reject'
  | 'testcase:edit'
  | 'testcase:delete'
  | 'export:download'
  | 'export:sync_jira'
  | 'audit:read'
  | 'settings:manage';

export class RBACManager {
  private static readonly ROLE_PERMISSIONS: Record<UserRole, Set<Permission>> = {
    ADMIN: new Set([
      'project:create',
      'project:read',
      'project:update',
      'project:delete',
      'requirement:create',
      'requirement:read',
      'requirement:update',
      'requirement:delete',
      'testcase:generate',
      'testcase:approve',
      'testcase:reject',
      'testcase:edit',
      'testcase:delete',
      'export:download',
      'export:sync_jira',
      'audit:read',
      'settings:manage',
    ]),
    QA_LEAD: new Set([
      'project:create',
      'project:read',
      'project:update',
      'requirement:create',
      'requirement:read',
      'requirement:update',
      'requirement:delete',
      'testcase:generate',
      'testcase:approve',
      'testcase:reject',
      'testcase:edit',
      'testcase:delete',
      'export:download',
      'export:sync_jira',
      'audit:read',
    ]),
    QA_TESTER: new Set([
      'project:read',
      'requirement:read',
      'testcase:generate',
      'testcase:reject',
      'testcase:edit',
      'export:download',
    ]),
    DEVELOPER: new Set([
      'project:read',
      'requirement:read',
      'export:download',
    ]),
    VIEWER: new Set([
      'project:read',
      'requirement:read',
      'export:download',
    ]),
  };

  /**
   * Verifica si un rol cuenta con un permiso específico (Mejora #32).
   */
  static can(role: string, permission: Permission): boolean {
    const normalizedRole = role.toUpperCase() as UserRole;
    const permissions = this.ROLE_PERMISSIONS[normalizedRole];
    if (!permissions) return false;
    return permissions.has(permission);
  }

  /**
   * Middleware de Express para requerir permisos granulares.
   */
  static requirePermission(permission: Permission) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Usuario no autenticado', 401);
      }

      if (!this.can(user.role, permission)) {
        return sendError(
          res,
          `Permiso denegado: el rol '${user.role}' no cuenta con el permiso requerido '${permission}'`,
          403
        );
      }

      return next();
    };
  }
}
