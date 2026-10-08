// ==========================================================================
// EventBus - Sistema Desacoplado de Eventos Reactivos (Mejora #21)
// ==========================================================================

class EventBus {
  constructor() {
    this.events = new Map();
  }

  /**
   * Suscribe una función callback a un evento específico.
   * @param {string} event - Nombre del evento
   * @param {Function} handler - Función a ejecutar
   * @returns {Function} Función para cancelar la suscripción
   */
  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(handler);

    return () => this.off(event, handler);
  }

  /**
   * Cancela la suscripción a un evento.
   * @param {string} event 
   * @param {Function} handler 
   */
  off(event, handler) {
    if (this.events.has(event)) {
      this.events.get(event).delete(handler);
    }
  }

  /**
   * Emite un evento a todos los suscriptores registrados.
   * @param {string} event - Nombre del evento
   * @param {*} data - Payload enviado a los suscriptores
   */
  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach((handler) => {
        try {
          handler(data);
        } catch (err) {
          console.error(`[EventBus] Error en el suscriptor del evento "${event}":`, err);
        }
      });
    }
  }

  /**
   * Escucha un evento una única vez y se desuscribe automáticamente.
   */
  once(event, handler) {
    const unbind = this.on(event, (data) => {
      unbind();
      handler(data);
    });
    return unbind;
  }
}

export const eventBus = new EventBus();
