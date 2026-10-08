// ==========================================================================
// Módulo de Accesibilidad WCAG 2.1 AA y Navegación Universal (Mejora #25)
// ==========================================================================

export class AccessibilityManager {
  static init() {
    this._injectSkipLink();
    this._setupAriaLiveRegion();
    this._setupGlobalKeyboardShortcuts();
    this._setupFocusTrap();
    console.log('[Accessibility] Estándares WCAG 2.1 AA inicializados');
  }

  /**
   * Inserta un enlace de salto directo al contenido principal accesible para lectores de pantalla.
   */
  static _injectSkipLink() {
    if (document.getElementById('skip-to-content')) return;

    const skipLink = document.createElement('a');
    skipLink.id = 'skip-to-content';
    skipLink.href = '#main-content';
    skipLink.className = 'skip-to-content';
    skipLink.textContent = 'Saltar al contenido principal (Skip to content)';
    document.body.prepend(skipLink);

    const main = document.querySelector('main');
    if (main && !main.id) {
      main.id = 'main-content';
      main.tabIndex = -1;
    }
  }

  /**
   * Crea una región aria-live para notificar cambios de estado a lectores de pantalla.
   */
  static _setupAriaLiveRegion() {
    if (document.getElementById('a11y-announcer')) return;

    const announcer = document.createElement('div');
    announcer.id = 'a11y-announcer';
    announcer.className = 'sr-only';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);
  }

  /**
   * Anuncia un mensaje a los lectores de pantalla mediante aria-live.
   */
  static announce(message) {
    const announcer = document.getElementById('a11y-announcer');
    if (announcer) {
      announcer.textContent = '';
      setTimeout(() => {
        announcer.textContent = message;
      }, 50);
    }
  }

  /**
   * Atajos globales de navegación por teclado (? para ayuda, Esc para cerrar).
   */
  static _setupGlobalKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Si presiona '?' (Shift + /) y no está escribiendo en un input
      if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        this._showShortcutsDialog();
      }

      // Cerrar modales activos con Escape
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.open, .modal-backdrop.active');
        if (activeModal) {
          activeModal.classList.remove('open', 'active');
          if (activeModal.style) activeModal.style.display = 'none';
          document.body.style.overflow = '';
          this.announce('Ventana modal cerrada.');
        }
      }
    });
  }

  /**
   * Control de Focus Trap para asegurar que la navegación permanezca dentro de los modales abiertos.
   */
  static _setupFocusTrap() {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      const activeModal = document.querySelector('.modal-overlay.open, .modal-backdrop.active');
      if (!activeModal) return;

      const focusableElements = activeModal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  }

  static _showShortcutsDialog() {
    let dialog = document.getElementById('modal-shortcuts-help');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'modal-shortcuts-help';
      dialog.className = 'modal-backdrop';
      document.body.appendChild(dialog);
    }

    dialog.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">⌨️ Atajos de Teclado</h3>
          <button type="button" class="btn-modal-close" id="btn-shortcuts-close">&times;</button>
        </div>
        <div class="modal-body">
          <table class="shortcuts-table">
            <tr><td><kbd>?</kbd></td><td>Mostrar esta ayuda de atajos de teclado</td></tr>
            <tr><td><kbd>Esc</kbd></td><td>Cerrar cualquier diálogo modal abierto</td></tr>
            <tr><td><kbd>Tab</kbd> / <kbd>Shift + Tab</kbd></td><td>Navegación secuencial por teclado</td></tr>
          </table>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" id="btn-shortcuts-ok">Entendido</button>
        </div>
      </div>
    `;

    dialog.style.display = 'flex';
    dialog.classList.add('active');
    const close = () => {
      dialog.style.display = 'none';
      dialog.classList.remove('active');
    };
    dialog.querySelector('#btn-shortcuts-close')?.addEventListener('click', close);
    dialog.querySelector('#btn-shortcuts-ok')?.addEventListener('click', close);
  }
}
