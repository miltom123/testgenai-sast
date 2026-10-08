// ==============================================================================
// Core Domain: SharedStepsEngine (Propuesta 37 - Pasos Modulares Reutilizables)
// Expande macros y bloques de pasos estándar de la organización en casos de prueba.
// ==============================================================================

export class SharedStepsEngine {
  private static readonly SHARED_BLOCKS: Record<string, string[]> = {
    '{{SHARED_LOGIN_ADMIN}}': [
      'Navegar al formulario de autenticación (/login).',
      'Ingresar credenciales de Administrador del Sistema.',
      'Completar el desafío 2FA e ingresar al panel de control.',
    ],
    '{{SHARED_LOGIN_USER}}': [
      'Navegar a la pantalla de inicio de sesión.',
      'Ingresar correo y contraseña de usuario regular.',
      'Verificar token de sesión en cabecera Authorization.',
    ],
    '{{SHARED_CLEANUP_SESSION}}': [
      'Cerrar sesión activa.',
      'Eliminar cookies de sesión y tokens JWT en localStorage.',
    ],
    '{{SHARED_NAVIGATE_CHECKOUT}}': [
      'Agregar producto al carrito de compras.',
      'Navegar a la pasarela de pago (/checkout).',
      'Seleccionar método de pago con tarjeta.',
    ],
  };

  /**
   * Expande los macros de pasos modulares en un array de pasos.
   */
  public static expandSteps(steps: string[]): string[] {
    const result: string[] = [];

    for (const step of steps) {
      const trimmed = step.trim();
      if (this.SHARED_BLOCKS[trimmed]) {
        result.push(...this.SHARED_BLOCKS[trimmed]);
      } else {
        result.push(step);
      }
    }

    return result;
  }

  public static listAvailableSharedSteps(): Array<{ macro: string; steps: string[] }> {
    return Object.entries(this.SHARED_BLOCKS).map(([macro, steps]) => ({
      macro,
      steps,
    }));
  }
}
