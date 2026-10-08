// ==========================================================================
// Authentication View Controller - TestGenAI (MVP Real)
// Autenticación real con cookies HttpOnly, sin cuentas demo ni selección de rol
// ==========================================================================

import { api } from '../api.js';
import { toast } from '../toast.js';

class AuthController {
  constructor() {
    this.container = null;
    this.onAuthSuccessCallback = null;
    this.activeTab = 'login';
  }

  init(onSuccess) {
    this.onAuthSuccessCallback = onSuccess;
    this.container = document.getElementById('auth-screen');
    if (!this.container) return;

    this._setupTabListeners();
    this._setupFormListeners();
  }

  show() {
    const appLayout = document.getElementById('app');
    if (appLayout) appLayout.style.display = 'none';
    if (this.container) {
      this.container.style.display = 'flex';
      this.container.classList.remove('hidden');
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
      this.container.classList.add('hidden');
    }
    const appLayout = document.getElementById('app');
    if (appLayout) appLayout.style.display = 'flex';
  }

  _setupTabListeners() {
    const tabBtns = this.container.querySelectorAll('.auth-tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    const tabBtns = this.container.querySelectorAll('.auth-tab-btn');
    tabBtns.forEach((b) => {
      if (b.getAttribute('data-tab') === tabName) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');

    if (tabName === 'login') {
      if (loginForm) loginForm.style.display = 'block';
      if (registerForm) registerForm.style.display = 'none';
    } else {
      if (loginForm) loginForm.style.display = 'none';
      if (registerForm) registerForm.style.display = 'block';
    }
  }

  _setupFormListeners() {
    // Formulario de Inicio de Sesión
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email')?.value.trim();
        const pass = document.getElementById('login-password')?.value;
        if (!email || !pass) {
          toast.error('Por favor ingresa correo y contraseña');
          return;
        }
        await this._handleLogin(email, pass);
      });
    }

    // Formulario de Registro (Sin selector de rol público: servidor asigna QA_TESTER)
    const registerForm = document.getElementById('form-register');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('reg-fullname')?.value.trim();
        const email = document.getElementById('reg-email')?.value.trim();
        const password = document.getElementById('reg-password')?.value;

        if (!fullName || !email || !password) {
          toast.error('Completa todos los campos obligatorios');
          return;
        }

        if (password.length < 6) {
          toast.error('La contraseña debe tener mínimo 6 caracteres');
          return;
        }

        const submitBtn = document.getElementById('btn-submit-register');
        const originalText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner-inline"></span> Creando cuenta...';
        }

        try {
          const res = await api.register(email, password, fullName);
          toast.success(`¡Cuenta creada con éxito! Bienvenido, ${fullName}`);
          this.hide();
          if (this.onAuthSuccessCallback) {
            this.onAuthSuccessCallback(res.user);
          }
        } catch (err) {
          console.error('Error en registro:', err);
          toast.error(err.message || 'No se pudo crear la cuenta');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }
        }
      });
    }
  }

  async _handleLogin(email, pass) {
    const submitBtn = document.getElementById('btn-submit-login');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-inline"></span> Autenticando...';
    }

    try {
      const res = await api.login(email, pass);
      toast.success(`Bienvenido al sistema, ${res.user.fullName || res.user.email}`);
      this.hide();
      if (this.onAuthSuccessCallback) {
        this.onAuthSuccessCallback(res.user);
      }
    } catch (err) {
      console.error('Error en login:', err);
      toast.error(err.message || 'Credenciales inválidas. Verifica tu correo o contraseña.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }
}

export const authView = new AuthController();
