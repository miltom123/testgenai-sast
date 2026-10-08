// ==========================================================================
// API REST Client - TestGenAI (MVP Real)
// Cookies HttpOnly + Prefijo canónico /api/v1 + Manejo seguro de sesión
// ==========================================================================

const API_BASE = '/api/v1';

class ApiClient {
  constructor() {
    this.currentUser = null;
    this._isRefreshing = false;
  }

  setCurrentUser(user) {
    this.currentUser = user;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async request(endpoint, options = {}, isRetry = false) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Enviar y recibir cookies HttpOnly
      });

      // Manejo de expiración de sesión (401) con un único reintento de refresh
      if (response.status === 401 && !isRetry && !endpoint.startsWith('/auth/')) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.request(endpoint, options, true);
        } else {
          this.currentUser = null;
          window.dispatchEvent(new CustomEvent('auth:expired'));
          const err = new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
          err.status = 401;
          throw err;
        }
      }

      const contentType = response.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await response.json().catch(() => null);
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMsg =
          (typeof data === 'object' && (data?.error || data?.message)) ||
          data ||
          `Error HTTP ${response.status}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (!isRetry && !endpoint.includes('/health')) {
        console.warn(`[API] ${options.method || 'GET'} ${endpoint} falló:`, err.message);
      }
      throw err;
    }
  }

  async refreshToken() {
    if (this._isRefreshing) return false;
    this._isRefreshing = true;
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (response.ok) {
        const resData = await response.json();
        if (resData?.data?.user) {
          this.currentUser = resData.data.user;
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      this._isRefreshing = false;
    }
  }

  // --- Health Checks ---
  async getHealth() {
    return this.request('/health');
  }

  async getDbHealth() {
    return this.request('/health/db');
  }

  // --- Autenticación & Sesión ---
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.currentUser = res.data?.user || null;
    return res.data;
  }

  async register(email, password, fullName) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
    this.currentUser = res.data?.user || null;
    return res.data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignorar fallo en logout para garantizar limpieza local
    } finally {
      this.currentUser = null;
    }
  }

  async getMe() {
    const res = await this.request('/auth/me');
    this.currentUser = res.data?.user || null;
    return res.data?.user || null;
  }

  // --- Proyectos ---
  async getProjects(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/projects?${query}` : '/projects';
    return this.request(endpoint);
  }

  async getProject(id) {
    return this.request(`/projects/${id}`);
  }

  async createProject(payload) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateProject(id, payload) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async archiveProject(id) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Requisitos ---
  async getRequirements(projectId, params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query
      ? `/requirements/project/${projectId}?${query}`
      : `/requirements/project/${projectId}`;
    return this.request(endpoint);
  }

  async getRequirement(id) {
    return this.request(`/requirements/${id}`);
  }

  async getRequirementVersions(id) {
    return this.request(`/requirements/${id}/versions`);
  }

  async createRequirement(payload) {
    return this.request('/requirements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateRequirement(id, payload) {
    return this.request(`/requirements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async archiveRequirement(id) {
    return this.request(`/requirements/${id}`, {
      method: 'DELETE',
    });
  }

  async importRequirements(projectId, requirements) {
    return this.request('/requirements/import', {
      method: 'POST',
      body: JSON.stringify({ projectId, requirements }),
    });
  }

  async getRequirementQualityGate(id) {
    return this.request(`/requirements/${id}/quality-gate`);
  }

  // --- Configuración e IA Real ---
  async getAiConfig() {
    return this.request('/config/ai-providers');
  }

  async generateAiTests(payload) {
    return this.request('/ai/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAiHistory(requirementId) {
    return this.request(`/ai/history/${requirementId}`);
  }

  async getProjectAiHistory(projectId) {
    return this.request(`/ai/history/project/${projectId}`);
  }

  // --- Casos de Prueba & Revisión Humana (Human-in-the-Loop) ---
  async getTestCases(requirementId) {
    return this.request(`/test-cases/requirement/${requirementId}`);
  }

  async getProjectTestCases(projectId, params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query
      ? `/test-cases/project/${projectId}?${query}`
      : `/test-cases/project/${projectId}`;
    return this.request(endpoint);
  }

  async getTestCase(id) {
    return this.request(`/test-cases/${id}`);
  }

  async getTestCaseHistory(id) {
    return this.request(`/test-cases/${id}/history`);
  }

  async reviewTestCase(id, reviewData) {
    return this.request(`/test-cases/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(reviewData),
    });
  }

  // --- RF-15: Creación de casos SIN IA ---
  async createManualTestCase(payload) {
    return this.request('/test-cases/manual', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async generateFromTemplate(requirementId, templateCategory) {
    return this.request('/test-cases/from-template', {
      method: 'POST',
      body: JSON.stringify({ requirementId, templateCategory }),
    });
  }

  async getTemplates() {
    return this.request('/test-cases/templates');
  }

  // --- Técnicas Formales ISTQB: Análisis de Valores Límite (BVA) & Datos Sintéticos ---
  async generateFromBva(requirementId, variable) {
    return this.request('/test-cases/from-bva', {
      method: 'POST',
      body: JSON.stringify({ requirementId, variable }),
    });
  }

  async getSyntheticData() {
    return this.request('/test-cases/synthetic-data');
  }

  async validateSyntheticData(type, value) {
    return this.request('/test-cases/synthetic-data/validate', {
      method: 'POST',
      body: JSON.stringify({ type, value }),
    });
  }

  // --- Trazabilidad & Métricas ---
  async getTraceability(projectId) {
    return this.request(`/traceability/${projectId}`);
  }

  async getMetrics(projectId) {
    return this.request(`/metrics/project/${projectId}`);
  }

  // --- Exportación de Casos Aprobados Vigentes ---
  getExportUrl(projectId, format = 'csv') {
    return `${API_BASE}/export/${projectId}?format=${format}`;
  }

  async downloadExport(projectId, format = 'csv') {
    const res = await fetch(this.getExportUrl(projectId, format), {
      credentials: 'include',
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || errJson.message || `Error al exportar (${res.status})`);
    }
    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition') || '';
    let filename = `testgenai-export-${projectId}.${format === 'markdown' ? 'md' : format}`;
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  // --- Administración de Usuarios (ADMIN) ---
  async getUsers() {
    return this.request('/users');
  }

  async updateUserRoleOrStatus(id, payload) {
    return this.request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiClient();
