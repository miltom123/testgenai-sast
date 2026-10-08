// ==========================================================================
// Theme Manager - Modern Dark / Light Mode with Persistence
// ==========================================================================

import { eventBus } from './event-bus.js';

export class ThemeManager {
  static STORAGE_KEY = 'testgenai_theme';

  static init() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.applyTheme('light');

    // Bind theme toggle buttons
    document.querySelectorAll('.btn-toggle-theme').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.toggle();
      });
    });
  }

  static getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  static applyTheme(theme) {
    const target = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem(this.STORAGE_KEY, target);

    // Update icon states across the app
    this.updateIcons(target);
    eventBus.emit('theme:changed', target);
  }

  static toggle() {
    const current = this.getTheme();
    const next = current === 'light' ? 'dark' : 'light';
    this.applyTheme(next);
    return next;
  }

  static updateIcons(theme) {
    const isLight = theme === 'light';
    document.querySelectorAll('.theme-icon-sun').forEach((el) => {
      el.style.display = isLight ? 'none' : 'inline-block';
    });
    document.querySelectorAll('.theme-icon-moon').forEach((el) => {
      el.style.display = isLight ? 'inline-block' : 'none';
    });
  }
}
