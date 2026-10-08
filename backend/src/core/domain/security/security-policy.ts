// ==========================================================================
// Domain Security Policy & Domain Exceptions
// Independent from HTTP / Express frameworks
// ==========================================================================

export class DomainSecurityException extends Error {
  constructor(message: string, public readonly code: string = 'FORBIDDEN') {
    super(message);
    this.name = 'DomainSecurityException';
  }
}

export class ResourceNotFoundDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceNotFoundDomainException';
  }
}

export interface SecurityUserContext {
  userId: string;
  role: string;
}

export class SecurityPolicy {
  public static isAdmin(role: string): boolean {
    return role.toUpperCase() === 'ADMIN';
  }

  public static canAccessProject(
    projectOwnerId: string,
    user: SecurityUserContext
  ): boolean {
    if (user.role === 'ADMIN') return true;
    return projectOwnerId === user.userId;
  }

  public static assertProjectAccess(
    projectOwnerId: string,
    user: SecurityUserContext,
    projectName: string = 'proyecto'
  ): void {
    if (!this.canAccessProject(projectOwnerId, user)) {
      throw new DomainSecurityException(
        `No tiene autorización para acceder al ${projectName}. Solo el propietario o administradores pueden gestionarlo.`
      );
    }
  }

  public static canExecuteTestCaseReview(user: SecurityUserContext): boolean {
    const role = user.role.toUpperCase();
    return role === 'ADMIN' || role === 'QA_LEAD' || role === 'QA_TESTER';
  }

  public static assertCanReview(user: SecurityUserContext): void {
    if (!this.canExecuteTestCaseReview(user)) {
      throw new DomainSecurityException(
        'Su rol no tiene permisos para auditar o modificar casos de prueba.'
      );
    }
  }
}
