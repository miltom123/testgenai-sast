import type { Request } from 'express';
import { logger } from './logger';

// Logger hijo dedicado a auditoría: separa el rastro de acciones sensibles del log operativo.
const auditLogger = logger.child({ channel: 'audit' });

type AuditAction =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_ARCHIVED'
  | 'PROJECT_DELETED'
  | 'REQUIREMENT_CREATED'
  | 'REQUIREMENT_UPDATED'
  | 'REQUIREMENTS_BATCH_IMPORTED'
  | 'REQUIREMENT_ARCHIVED'
  | 'REQUIREMENT_DELETED'
  | 'TESTCASE_REVIEWED'
  | 'TESTCASE_DELETED'
  | 'AUTH_LOGIN'
  | 'AUTH_REGISTER'
  | 'AUTH_LOGOUT'
  | 'AUTH_REFRESH'
  | 'AI_GENERATION'
  | 'SPEC_GENERATED'
  | 'OPENAPI_SPEC_IMPORTED'
  | 'USER_ADMIN_UPDATED';

/**
 * Registra una acción auditable con el actor, el recurso afectado y el requestId.
 * Constituye un rastro de auditoría verificable en el stream de logs (apto para
 * enviarse a un agregador/SIEM). No expone datos sensibles.
 */
export function audit(req: Request, action: AuditAction, details: Record<string, unknown> = {}): void {
  auditLogger.info(
    {
      action,
      actorId: req.user?.userId ?? 'anonymous',
      actorRole: req.user?.role,
      requestId: req.id,
      ip: req.ip,
      ...details,
    },
    `AUDIT ${action}`
  );
}
