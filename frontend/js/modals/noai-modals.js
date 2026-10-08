function secureRandomFraction() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] / 0x100000000;
}

// ==========================================================================
// RF-15 Modal Handlers - Manual Test Case & ISTQB Template Generation
// Creación de casos de prueba SIN dependencia de IA
// ==========================================================================

import { api } from '../api.js';
import { toast } from '../toast.js';
import { store } from '../state.js';

export class NoAiModalHandler {
  constructor(modalManager) {
    this.mm = modalManager;
    this.selectedTemplate = null;
  }

  setup() {
    this._setupManualForm();
    this._setupTemplateModal();
    this._setupBvaModal();
    this._setupSyntheticDataButtons();
  }

  // ─── Manual Test Case Modal ─────────────────────────────────────

  openManualModal(requirement) {
    document.getElementById('manual-tc-req-id').value = requirement.id;
    document.getElementById('manual-tc-req-label').textContent =
      `Requisito: ${requirement.code} — ${requirement.title}`;

    // Reset form
    const form = document.getElementById('form-manual-testcase');
    form.reset();
    document.getElementById('manual-tc-req-id').value = requirement.id;

    this.mm.open('modal-manual-testcase');
  }

  _setupManualForm() {
    const form = document.getElementById('form-manual-testcase');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const requirementId = document.getElementById('manual-tc-req-id').value;
      const type = document.getElementById('manual-tc-type').value;
      const title = document.getElementById('manual-tc-title').value.trim();
      const priority = document.getElementById('manual-tc-priority').value;
      const expectedResult = document.getElementById('manual-tc-expected').value.trim();
      const testData = document.getElementById('manual-tc-testdata').value.trim() || null;

      // Parse multiline inputs
      const preconditionsRaw = document.getElementById('manual-tc-preconditions').value.trim();
      const stepsRaw = document.getElementById('manual-tc-steps').value.trim();

      const preconditions = preconditionsRaw
        ? preconditionsRaw.split('\n').map((s) => s.trim()).filter(Boolean)
        : [];
      const steps = stepsRaw
        ? stepsRaw.split('\n').map((s) => s.trim()).filter(Boolean)
        : [];

      if (steps.length === 0) {
        toast.error('Se requiere al menos un paso.');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-inline"></span> Creando...';

      try {
        const res = await api.createManualTestCase({
          requirementId,
          type,
          title,
          preconditions,
          steps,
          testData,
          expectedResult,
          priority,
        });

        toast.success(`Caso ${res.data?.code || ''} creado manualmente ✍️`);
        this.mm.close('modal-manual-testcase');

        // Reload test cases
        await this._refreshTestCases(requirementId);
      } catch (err) {
        toast.error(err.message || 'Error al crear el caso manual');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          Crear Caso Manual
        `;
      }
    });
  }

  // ─── Template Generation Modal ──────────────────────────────────

  async openTemplateModal(requirement) {
    document.getElementById('template-req-id').value = requirement.id;
    document.getElementById('template-req-label').textContent =
      `Requisito: ${requirement.code} — ${requirement.title}`;

    this.selectedTemplate = null;
    const confirmBtn = document.getElementById('btn-confirm-template');
    confirmBtn.disabled = true;
    document.getElementById('template-selection-label').textContent = 'Selecciona una categoría';

    // Load templates from API
    const grid = document.getElementById('template-categories-grid');
    grid.innerHTML = '<span class="spinner-inline"></span> Cargando plantillas...';

    try {
      const res = await api.getTemplates();
      const templates = res.data || [];

      grid.innerHTML = templates
        .map(
          (t) => `
          <div class="template-card" data-template-key="${t.key}" style="
            padding:14px;
            border-radius:var(--radius-md);
            border:1px solid var(--border-subtle);
            background:rgba(255,255,255,0.02);
            cursor:pointer;
            transition:all var(--transition-fast);
          ">
            <div style="font-size:1.3rem; margin-bottom:6px;">${t.icon}</div>
            <div style="font-size:0.88rem; font-weight:700; color:var(--text-primary); margin-bottom:4px;">${t.name}</div>
            <div style="font-size:0.76rem; color:var(--text-muted); line-height:1.4; margin-bottom:8px;">${t.description}</div>
            <span class="badge badge-derived">${t.casesCount} casos</span>
          </div>
        `
        )
        .join('');

      // Selection handling
      grid.querySelectorAll('.template-card').forEach((card) => {
        card.addEventListener('click', () => {
          grid.querySelectorAll('.template-card').forEach((c) => {
            c.style.border = '1px solid var(--border-subtle)';
            c.style.background = 'rgba(255,255,255,0.02)';
          });
          card.style.border = '2px solid var(--primary)';
          card.style.background = 'rgba(99, 102, 241, 0.1)';

          this.selectedTemplate = card.getAttribute('data-template-key');
          const tmpl = templates.find((t) => t.key === this.selectedTemplate);
          confirmBtn.disabled = false;
          document.getElementById('template-selection-label').textContent =
            `${tmpl.icon} ${tmpl.name} — ${tmpl.casesCount} casos`;
        });
      });
    } catch (err) {
      grid.innerHTML = `<span style="color:var(--error);">Error al cargar plantillas: ${err.message}</span>`;
    }

    this.mm.open('modal-template-generate');
  }

  _setupTemplateModal() {
    const confirmBtn = document.getElementById('btn-confirm-template');
    if (!confirmBtn) return;

    confirmBtn.addEventListener('click', async () => {
      if (!this.selectedTemplate) return;

      const requirementId = document.getElementById('template-req-id').value;

      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span class="spinner-inline"></span> Generando...';

      try {
        const res = await api.generateFromTemplate(requirementId, this.selectedTemplate);
        const tmpl = res.data?.templateUsed;

        toast.success(
          `📋 ${tmpl?.casesGenerated || '?'} casos generados desde plantilla "${tmpl?.name || this.selectedTemplate}"`
        );
        this.mm.close('modal-template-generate');

        // Reload test cases
        await this._refreshTestCases(requirementId);
      } catch (err) {
        toast.error(err.message || 'Error al generar desde plantilla');
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          Generar Casos
        `;
      }
    });
  }

  // ─── BVA (Boundary Value Analysis) Modal ────────────────────────

  openBvaModal(requirement) {
    document.getElementById('bva-req-id').value = requirement.id;
    document.getElementById('bva-req-label').textContent =
      `Requisito: ${requirement.code} — ${requirement.title}`;

    // Actualizar previsualización en vivo inicial
    this._renderBvaPreview();

    this.mm.open('modal-bva-generate');
  }

  _setupBvaModal() {
    const form = document.getElementById('form-bva-generate');
    if (!form) return;

    // Escuchar cambios en los inputs para actualizar el cálculo en vivo
    const inputs = ['bva-var-name', 'bva-var-type', 'bva-var-min', 'bva-var-max', 'bva-var-unit'];
    inputs.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this._renderBvaPreview());
        el.addEventListener('change', () => this._renderBvaPreview());
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const requirementId = document.getElementById('bva-req-id').value;
      const name = document.getElementById('bva-var-name').value.trim();
      const type = document.getElementById('bva-var-type').value;
      const min = parseFloat(document.getElementById('bva-var-min').value);
      const max = parseFloat(document.getElementById('bva-var-max').value);
      const unit = document.getElementById('bva-var-unit').value.trim() || undefined;

      if (isNaN(min) || isNaN(max)) {
        toast.error('Los límites mínimo y máximo deben ser valores numéricos válidos.');
        return;
      }

      if (min >= max) {
        toast.error('El límite mínimo debe ser estrictamente menor que el límite máximo.');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-bva');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-inline"></span> Calculando...';

      try {
        const res = await api.generateFromBva(requirementId, {
          name,
          type,
          min,
          max,
          unit,
          decimals: type === 'decimal' ? 2 : undefined,
        });

        const summary = res.data?.bvaSummary;
        toast.success(
          `📐 ${summary?.casesInserted || 0} casos formales de BVA generados para "${name}"`
        );

        this.mm.close('modal-bva-generate');

        // Refrescar casos de prueba
        await this._refreshTestCases(requirementId);
      } catch (err) {
        toast.error(err.message || 'Error al generar casos por BVA');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          Generar Casos BVA
        `;
      }
    });
  }

  _renderBvaPreview() {
    const list = document.getElementById('bva-live-preview-list');
    const countBadge = document.getElementById('bva-preview-count');
    if (!list) return;

    const name = document.getElementById('bva-var-name')?.value.trim() || 'Variable';
    const type = document.getElementById('bva-var-type')?.value || 'decimal';
    const min = parseFloat(document.getElementById('bva-var-min')?.value || '1');
    const max = parseFloat(document.getElementById('bva-var-max')?.value || '100');
    const unit = document.getElementById('bva-var-unit')?.value.trim() || '';
    const unitSuffix = unit ? ` ${unit}` : '';

    if (isNaN(min) || isNaN(max) || min >= max) {
      list.innerHTML = `<div style="color:var(--text-muted); font-size:0.8rem; padding:8px;">Ingresa cotas válidas (Min < Max) para previsualizar los casos.</div>`;
      if (countBadge) countBadge.textContent = '0 casos';
      return;
    }

    const previewCases = [];
    const step = type === 'decimal' ? 0.01 : 1;
    const nominal = type === 'decimal' ? ((min + max) / 2).toFixed(2) : Math.floor((min + max) / 2);

    // 1. Nominal (EP)
    previewCases.push({
      type: 'positive',
      tag: 'EP_NOMINAL',
      badge: 'Positivo',
      badgeColor: '#10b981',
      title: `[EP] Valor nominal central: ${nominal}${unitSuffix}`,
      value: `${nominal}${unitSuffix}`,
    });

    // 2. Min exacto
    previewCases.push({
      type: 'boundary',
      tag: 'BVA_MIN',
      badge: 'Frontera',
      badgeColor: '#6366f1',
      title: `[BVA] Límite mínimo exacto: ${min}${unitSuffix}`,
      value: `${min}${unitSuffix}`,
    });

    // 3. Min + step
    const minPlus = type === 'decimal' ? (min + step).toFixed(2) : min + step;
    previewCases.push({
      type: 'boundary',
      tag: 'BVA_MIN_PLUS',
      badge: 'Frontera',
      badgeColor: '#6366f1',
      title: `[BVA] Valor adyacente válido (Min + step): ${minPlus}${unitSuffix}`,
      value: `${minPlus}${unitSuffix}`,
    });

    // 4. Max exacto
    previewCases.push({
      type: 'boundary',
      tag: 'BVA_MAX',
      badge: 'Frontera',
      badgeColor: '#6366f1',
      title: `[BVA] Límite máximo exacto: ${max}${unitSuffix}`,
      value: `${max}${unitSuffix}`,
    });

    // 5. Max - step
    const maxMinus = type === 'decimal' ? (max - step).toFixed(2) : max - step;
    previewCases.push({
      type: 'boundary',
      tag: 'BVA_MAX_MINUS',
      badge: 'Frontera',
      badgeColor: '#6366f1',
      title: `[BVA] Valor adyacente válido (Max - step): ${maxMinus}${unitSuffix}`,
      value: `${maxMinus}${unitSuffix}`,
    });

    // 6. Below Min (Negativo)
    const belowMin = type === 'decimal' ? (min - step).toFixed(2) : min - step;
    previewCases.push({
      type: 'negative',
      tag: 'BVA_BELOW_MIN',
      badge: 'Negativo',
      badgeColor: '#ef4444',
      title: `[BVA] Rechazo por cota inferior excedida: ${belowMin}${unitSuffix}`,
      value: `${belowMin}${unitSuffix}`,
    });

    // 7. Above Max (Negativo)
    const aboveMax = type === 'decimal' ? (max + step).toFixed(2) : max + step;
    previewCases.push({
      type: 'negative',
      tag: 'BVA_ABOVE_MAX',
      badge: 'Negativo',
      badgeColor: '#ef4444',
      title: `[BVA] Rechazo por cota superior excedida: ${aboveMax}${unitSuffix}`,
      value: `${aboveMax}${unitSuffix}`,
    });

    // 8. Validación neutra/negativa si min > 0
    if (min > 0) {
      previewCases.push({
        type: 'validation',
        tag: 'BVA_ZERO',
        badge: 'Validación',
        badgeColor: '#f59e0b',
        title: `[Validación] Rechazo de valor neutro cero (0)`,
        value: '0',
      });
    }

    if (countBadge) countBadge.textContent = `${previewCases.length} casos calculados`;

    list.innerHTML = previewCases
      .map(
        (c) => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.8rem;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:0.68rem; font-weight:700; text-transform:uppercase; padding:2px 6px; border-radius:3px; background:${c.badgeColor}22; color:${c.badgeColor}; border:1px solid ${c.badgeColor}44;">
              ${c.badge}
            </span>
            <span style="color:var(--text-secondary);">${c.title}</span>
          </div>
          <code style="font-size:0.75rem; color:var(--text-muted); background:rgba(0,0,0,0.3); padding:1px 5px; border-radius:3px;">
            ${c.value}
          </code>
        </div>
      `
      )
      .join('');
  }

  // ─── Asistente de Datos Sintéticos de Prueba ─────────────────────

  _setupSyntheticDataButtons() {
    const container = document.getElementById('synth-data-buttons');
    if (!container) return;

    container.querySelectorAll('.btn-synth-data').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        const input = document.getElementById('manual-tc-testdata');
        if (!input) return;

        let generatedValue = '';

        if (type === 'ruc_valid') {
          // Generar RUC válido con Módulo 11 oficial SUNAT
          generatedValue = this._generateClientRuc(true);
        } else if (type === 'ruc_invalid') {
          generatedValue = this._generateClientRuc(false);
        } else if (type === 'dni') {
          const randDni = Math.floor(40000000 + secureRandomFraction() * 40000000);
          generatedValue = `DNI: ${randDni}`;
        } else if (type === 'card_luhn') {
          generatedValue = this._generateClientLuhnCard();
        } else if (type === 'boundary_255') {
          generatedValue = 'X'.repeat(255);
        } else if (type === 'sqli') {
          generatedValue = `' OR '1'='1`;
        } else if (type === 'xss') {
          generatedValue = `<script>console.log("xss_safe_test")</script>`;
        }

        if (generatedValue) {
          input.value = generatedValue;
          toast.success(`🎲 Dato sintético insertado: ${btn.textContent}`);
        }
      });
    });
  }

  _generateClientRuc(isValid = true) {
    const prefix = '20';
    let base = prefix;
    for (let i = 0; i < 8; i++) {
      base += Math.floor(secureRandomFraction() * 10).toString();
    }
    const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(base.charAt(i), 10) * factors[i];
    }
    const mod = sum % 11;
    let check = 11 - mod;
    if (check === 10) check = 0;
    else if (check === 11) check = 1;

    if (!isValid) {
      check = (check + 1) % 10;
    }
    return `RUC: ${base}${check} (${isValid ? 'Válido SUNAT Mód 11' : 'Inválido'})`;
  }

  _generateClientLuhnCard() {
    let number = '4';
    while (number.length < 15) {
      number += Math.floor(secureRandomFraction() * 10).toString();
    }
    let sum = 0;
    let shouldDouble = true;
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    const check = (10 - (sum % 10)) % 10;
    return `Visa Sandbox: ${number}${check}, Exp: 12/28, CVV: 739 (Luhn OK)`;
  }

  // ─── Shared Helpers ─────────────────────────────────────────────

  async _refreshTestCases(requirementId) {
    try {
      // Refresh requirement to get updated case count
      const projectId = store.get('activeProjectId');
      if (projectId) {
        const reqsRes = await api.getRequirements(projectId);
        if (reqsRes.data) {
          store.set('requirements', reqsRes.data);
        }

        const casesRes = await api.getProjectTestCases(projectId);
        if (casesRes.data) {
          store.set('testCases', casesRes.data);
        }
      }

      // Re-render current view
      window.dispatchEvent(new CustomEvent('navigate:refresh'));
    } catch (err) {
      console.warn('[NoAiModalHandler] Error refreshing after creation:', err);
    }
  }
}

