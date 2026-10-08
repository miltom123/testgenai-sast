// ==========================================================================
// AI Generation Modal Controller - TestGenAI (MVP Real)
// Conexión exclusiva con proveedores reales configurados (Gemini / OpenAI)
// ==========================================================================

import { api } from '../api.js';
import { store } from '../state.js';
import { toast } from '../toast.js';

export class AiModalHandler {
  constructor(modalManager) {
    this.modalManager = modalManager;
    this.providersConfig = null;
  }

  setup() {
    this._setupAiGenerateForm();
  }

  async loadConfig() {
    try {
      const res = await api.getAiConfig();
      this.providersConfig = res.data || {};
      this._updateProviderOptions();
    } catch (e) {
      console.warn('No se pudo cargar configuración de IA:', e);
    }
  }

  _updateProviderOptions() {
    const providerSelect = document.getElementById('ai-gen-provider');
    const warningBox = document.getElementById('ai-provider-warning');
    const submitBtn = document.getElementById('btn-submit-ai-gen');
    if (!providerSelect || !this.providersConfig) return;

    const providers = this.providersConfig.providers || {};
    const geminiAvailable = providers.gemini?.available;
    const openaiAvailable = providers.openai?.available;

    providerSelect.innerHTML = '';

    if (geminiAvailable) {
      const opt = document.createElement('option');
      opt.value = 'gemini';
      opt.textContent = `Google Gemini (${providers.gemini.defaultModel})`;
      providerSelect.appendChild(opt);
    }

    if (openaiAvailable) {
      const opt = document.createElement('option');
      opt.value = 'openai';
      opt.textContent = `OpenAI (${providers.openai.defaultModel})`;
      providerSelect.appendChild(opt);
    }

    if (!geminiAvailable && !openaiAvailable) {
      if (warningBox) warningBox.style.display = 'block';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.title = 'Configure GEMINI_API_KEY u OPENAI_API_KEY en el servidor';
      }
      providerSelect.innerHTML = '<option value="">Sin proveedor configurado</option>';
    } else {
      if (warningBox) warningBox.style.display = 'none';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.title = '';
      }
      this._updateModelOptions(providerSelect.value);
    }
  }

  _updateModelOptions(provider) {
    const modelSelect = document.getElementById('ai-gen-model');
    if (!modelSelect || !this.providersConfig) return;

    const models = this.providersConfig.providers?.[provider]?.allowedModels || [];
    modelSelect.innerHTML = models
      .map((m) => `<option value="${m}">${m}</option>`)
      .join('');
  }

  openAiGenModal(requirement) {
    const reqIdInput = document.getElementById('ai-gen-req-id');
    const reqLabel = document.getElementById('ai-gen-req-label');

    if (reqIdInput && reqLabel) {
      reqIdInput.value = requirement.id;
      reqLabel.textContent = `${requirement.code} — ${requirement.title}`;
    }

    this.loadConfig();
    this.modalManager.open('modal-ai-generate');
  }

  _setupAiGenerateForm() {
    const form = document.getElementById('form-ai-generate');
    if (!form) return;

    const providerSelect = document.getElementById('ai-gen-provider');
    if (providerSelect) {
      providerSelect.addEventListener('change', () => {
        this._updateModelOptions(providerSelect.value);
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const requirementId = document.getElementById('ai-gen-req-id').value;
      const provider = document.getElementById('ai-gen-provider').value;
      const model = document.getElementById('ai-gen-model').value;
      const temperature = parseFloat(document.getElementById('ai-gen-temp').value) || 0.2;
      const useCache = document.getElementById('ai-gen-use-cache')?.checked ?? true;

      if (!requirementId) {
        toast.warning('Seleccione un requisito');
        return;
      }

      if (!provider || !model) {
        toast.error('No hay un proveedor o modelo válido seleccionado');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const progressBox = document.getElementById('ai-gen-progress');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-inline"></span> Generando casos...';
      }
      if (progressBox) progressBox.style.display = 'block';

      try {
        const result = await api.generateAiTests({
          requirementId,
          provider,
          model,
          temperature,
          useCache,
        });

        const count = result.data?.testCases?.length || 0;
        const isCached = result.data?.metadata?.isCached;
        toast.success(
          `¡Generados ${count} casos de prueba con ${provider.toUpperCase()}${isCached ? ' (desde caché)' : ''}!`
        );

        this.modalManager.close('modal-ai-generate');
        form.reset();

        // Recargar casos del proyecto y métricas
        const projectId = store.get('activeProjectId');
        if (projectId) {
          const tcRes = await api.getProjectTestCases(projectId);
          if (tcRes.data) store.set('testCases', tcRes.data);

          const reqRes = await api.getRequirements(projectId);
          if (reqRes.data) store.set('requirements', reqRes.data);

          const metRes = await api.getMetrics(projectId);
          if (metRes.data) store.set('metrics', metRes.data);
        }

        // Navegar a la vista de casos de prueba para revisión
        document.querySelector('.nav-item[data-view="test-cases"]')?.click();
      } catch (err) {
        console.error('Error al generar casos:', err);
        toast.error(err.message || 'Error en la llamada al proveedor de IA');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Iniciar Generación';
        }
        if (progressBox) progressBox.style.display = 'none';
      }
    });
  }
}
