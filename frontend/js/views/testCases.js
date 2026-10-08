// ==========================================================================
// TestGenAI — Centro de Casos de Prueba & Revisión Humana (MVP Real)
// Revisión individual obligatoria con control de versiones y auditoría
// ==========================================================================

import { store } from '../state.js';
import { modals } from '../modals.js';
import { api } from '../api.js';
import { toast } from '../toast.js';
import { DiffViewer } from './diff-viewer.js';

let activeCategoryFilter = 'ALL'; // 'ALL' | 'positive' | 'negative' | 'boundary' | 'validation' | 'alternative' | 'PENDING'
let filterSearch = '';
let filterRequirementId = 'ALL';

export async function renderTestCases(container) {
  const projectId = store.get('activeProjectId');
  const project = store.get('activeProject');
  const requirements = store.get('requirements') || [];
  let testCases = store.get('testCases') || [];

  if (!projectId) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:50px 20px;">
        <p style="color:var(--text-muted);">Seleccione o cree un proyecto activo para revisar sus casos de prueba.</p>
      </div>
    `;
    return;
  }

  // Recargar casos del proyecto si está vacío
  if (testCases.length === 0) {
    try {
      const allTcRes = await api.getProjectTestCases(projectId);
      if (allTcRes.data) {
        testCases = allTcRes.data;
        store.set('testCases', testCases);
      }
    } catch (e) {
      console.warn('Error cargando casos de prueba:', e);
    }
  }

  // Filtrado
  const filteredCases = testCases.filter((tc) => {
    if (activeCategoryFilter === 'PENDING' && tc.status !== 'PENDING') return false;
    if (activeCategoryFilter === 'APPROVED' && tc.status !== 'APPROVED') return false;
    if (activeCategoryFilter === 'positive' && tc.type !== 'positive') return false;
    if (activeCategoryFilter === 'negative' && tc.type !== 'negative') return false;
    if (activeCategoryFilter === 'boundary' && tc.type !== 'boundary') return false;
    if (activeCategoryFilter === 'validation' && tc.type !== 'validation') return false;
    if (activeCategoryFilter === 'alternative' && tc.type !== 'alternative') return false;

    if (filterRequirementId !== 'ALL' && tc.requirementId !== filterRequirementId) return false;

    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const mCode = tc.code?.toLowerCase().includes(q);
      const mTitle = tc.title?.toLowerCase().includes(q);
      const mData = tc.testData?.toLowerCase().includes(q);
      const mResult = tc.expectedResult?.toLowerCase().includes(q);
      if (!mCode && !mTitle && !mData && !mResult) return false;
    }

    return true;
  });

  const total = testCases.length;
  const pending = testCases.filter((c) => c.status === 'PENDING').length;
  const approved = testCases.filter((c) => c.status === 'APPROVED').length;
  const happyCount = testCases.filter((c) => c.type === 'positive').length;
  const errorCount = testCases.filter((c) => c.type === 'negative').length;
  const limitCount = testCases.filter((c) => c.type === 'boundary').length;
  const valCount = testCases.filter((c) => c.type === 'validation').length;

  container.innerHTML = `
    <!-- Header Principal -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:14px;">
      <div>
        <h2 style="font-size:1.35rem; font-weight:800; margin-bottom:4px;">
          📋 Casos de Prueba & Revisión
        </h2>
        <p style="font-size:0.85rem; color:var(--text-secondary);">
          Revisión individual humana (Human-in-the-Loop) con trazabilidad inmutable y control de versiones.
        </p>
      </div>

      <!-- Barra de Exportación Oficial -->
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <button class="btn btn-outline" id="btn-export-csv-testcases" title="Descargar casos aprobados en CSV">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Exportar Casos Aprobados (CSV)
        </button>
      </div>
    </div>

    <!-- Pestañas de Filtros -->
    <div class="quick-filter-tabs">
      <button type="button" class="quick-filter-tab ${activeCategoryFilter === 'ALL' ? 'active' : ''}" data-cat="ALL">
        <span>🔘 Todos</span>
        <span class="badge-count">${total}</span>
      </button>
      <button type="button" class="quick-filter-tab ${activeCategoryFilter === 'PENDING' ? 'active' : ''}" data-cat="PENDING">
        <span>⏳ Pendientes</span>
        <span class="badge-count">${pending}</span>
      </button>
      <button type="button" class="quick-filter-tab ${activeCategoryFilter === 'APPROVED' ? 'active' : ''}" data-cat="APPROVED">
        <span>✓ Aprobados</span>
        <span class="badge-count">${approved}</span>
      </button>
      <button type="button" class="quick-filter-tab ${activeCategoryFilter === 'positive' ? 'active' : ''}" data-cat="positive">
        <span>🟢 Camino Feliz</span>
        <span class="badge-count">${happyCount}</span>
      </button>
      <button type="button" class="quick-filter-tab ${activeCategoryFilter === 'negative' ? 'active' : ''}" data-cat="negative">
        <span>🔴 Negativo / Error</span>
        <span class="badge-count">${errorCount}</span>
      </button>
      <button type="button" class="quick-filter-tab ${activeCategoryFilter === 'boundary' ? 'active' : ''}" data-cat="boundary">
        <span>🟡 Valores Límite</span>
        <span class="badge-count">${limitCount}</span>
      </button>
      <button type="button" class="quick-filter-tab ${activeCategoryFilter === 'validation' ? 'active' : ''}" data-cat="validation">
        <span>🟣 Validación</span>
        <span class="badge-count">${valCount}</span>
      </button>
    </div>

    <!-- Barra de Búsqueda y Requisito -->
    <div class="card" style="padding:14px 18px; margin-bottom:20px; display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
      <div style="flex:1; min-width:240px;">
        <input
          type="text"
          id="tc-search-input"
          class="form-input"
          placeholder="🔍 Buscar por código, título, resultado esperado o datos..."
          value="${filterSearch}"
        />
      </div>

      ${
        requirements.length > 1
          ? `
        <div style="min-width:220px;">
          <select id="tc-select-req" class="form-select" style="font-size:0.84rem;">
            <option value="ALL">📁 Todos los requisitos (${requirements.length})</option>
            ${requirements.map((r) => `<option value="${r.id}" ${r.id === filterRequirementId ? 'selected' : ''}>${r.code} — ${r.title}</option>`).join('')}
          </select>
        </div>
      `
          : ''
      }

      ${
        filterSearch || filterRequirementId !== 'ALL' || activeCategoryFilter !== 'ALL'
          ? `
        <button type="button" class="btn btn-secondary btn-sm" id="btn-clear-all-filters">
          ✕ Limpiar Filtros
        </button>
      `
          : ''
      }
    </div>

    <!-- Lista de Tarjetas de Casos -->
    <div id="test-cases-list" style="display:flex; flex-direction:column; gap:16px;">
      ${
        filteredCases.length > 0
          ? filteredCases.map((tc) => renderTestCaseCard(tc)).join('')
          : `
          <div class="card" style="text-align:center; padding:50px 20px;">
            <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:6px;">No se encontraron casos de prueba</h3>
            <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:14px;">
              ${total === 0 ? 'Genera casos desde la vista de Requisitos usando un proveedor de IA.' : 'Intenta cambiar los filtros de búsqueda.'}
            </p>
          </div>
        `
      }
    </div>
  `;

  // Attach Event Handlers
  container.querySelectorAll('.quick-filter-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      activeCategoryFilter = tab.getAttribute('data-cat');
      renderTestCases(container);
    });
  });

  const searchInput = container.querySelector('#tc-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterSearch = e.target.value.trim();
      renderTestCases(container);
    });
  }

  const selectReq = container.querySelector('#tc-select-req');
  if (selectReq) {
    selectReq.addEventListener('change', (e) => {
      filterRequirementId = e.target.value;
      renderTestCases(container);
    });
  }

  container.querySelector('#btn-clear-all-filters')?.addEventListener('click', () => {
    activeCategoryFilter = 'ALL';
    filterSearch = '';
    filterRequirementId = 'ALL';
    renderTestCases(container);
  });

  // Exportar casos aprobados
  container.querySelector('#btn-export-csv-testcases')?.addEventListener('click', async () => {
    try {
      toast.info('Preparando descarga de casos aprobados...');
      await api.downloadExport(projectId, 'csv');
      toast.success('Descarga iniciada');
    } catch (err) {
      toast.error(err.message || 'Error al exportar casos');
    }
  });

  // Acciones individuales sobre casos: Aprobar, Modificar, Rechazar, Historial
  container.querySelectorAll('.btn-tc-approve').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const tc = testCases.find((c) => c.id === id);
      if (!tc) return;

      let justification = null;
      if (tc.evidenceStatus === 'conflict') {
        const inputJust = prompt(
          `[EVIDENCIA EN CONFLICTO] El caso ${tc.code} contradice o tiene conflicto con los requisitos.\nPara aprobarlo, es obligatorio ingresar una justificación técnica:`
        );
        if (!inputJust || inputJust.trim().length === 0) {
          toast.warning('Aprobación cancelada: se requiere justificación para casos con evidencia conflictiva.');
          return;
        }
        justification = inputJust.trim();
      }

      btn.disabled = true;
      try {
        await api.reviewTestCase(id, {
          decision: 'APPROVED',
          expectedVersion: tc.version || 1,
          justification,
          comments: justification ? `Aprobado con justificación: ${justification}` : 'Aprobado por revisor QA',
        });
        toast.success(`Caso ${tc.code} aprobado`);
        // Recargar datos
        const allTcRes = await api.getProjectTestCases(projectId);
        if (allTcRes.data) store.set('testCases', allTcRes.data);
        const metRes = await api.getMetrics(projectId);
        if (metRes.data) store.set('metrics', metRes.data);
        renderTestCases(container);
      } catch (err) {
        toast.error(`Error al aprobar: ${err.message}`);
        btn.disabled = false;
      }
    });
  });

  container.querySelectorAll('.btn-tc-edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const tc = testCases.find((c) => c.id === id);
      if (tc) modals.populateEditTestCase(tc);
    });
  });

  container.querySelectorAll('.btn-tc-reject').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const tc = testCases.find((c) => c.id === id);
      if (tc) modals.populateRejectTestCase(tc);
    });
  });

  container.querySelectorAll('.btn-tc-history').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const tc = testCases.find((c) => c.id === id);
      if (!tc) return;

      try {
        const histRes = await api.getTestCaseHistory(id);
        const historyData = histRes.data || {};
        const reviews = historyData.reviews || [];

        if (reviews.length === 0) {
          toast.info(`El caso ${tc.code} aún no tiene revisiones registradas.`);
          return;
        }

        const latestReview = reviews[0];
        const prevText = latestReview.previousContent
          ? JSON.stringify(latestReview.previousContent, null, 2)
          : 'Sin contenido previo';
        const newText = latestReview.newContent
          ? JSON.stringify(latestReview.newContent, null, 2)
          : JSON.stringify(tc, null, 2);

        DiffViewer.showModal({
          title: `Historial de Auditoría — ${tc.code} (v${tc.version})`,
          originalLabel: `Versión Anterior (${latestReview.decision})`,
          modifiedLabel: `Versión Actual (Revisado por ${latestReview.reviewer?.fullName || 'QA'})`,
          originalText: prevText,
          modifiedText: newText,
        });
      } catch (err) {
        toast.error(`Error al cargar historial: ${err.message}`);
      }
    });
  });
}

function renderTestCaseCard(tc) {
  const steps = Array.isArray(tc.steps) ? tc.steps : [tc.steps];
  const preconditions = Array.isArray(tc.preconditions) ? tc.preconditions : (tc.preconditions ? [tc.preconditions] : []);

  let statusBadge = `<span class="badge badge-pending">⏳ PENDIENTE</span>`;
  if (tc.status === 'APPROVED') statusBadge = `<span class="badge badge-approved">✓ APROBADO</span>`;
  if (tc.status === 'MODIFIED') statusBadge = `<span class="badge badge-source-rule">✏️ MODIFICADO</span>`;
  if (tc.status === 'REJECTED') statusBadge = `<span class="badge badge-danger">✕ RECHAZADO</span>`;

  let sourceBadge = `<span class="badge" style="background:rgba(99,102,241,0.15); color:#818cf8; border:1px solid rgba(99,102,241,0.3);" title="Generado mediante Modelo de Lenguaje">🤖 IA</span>`;
  if (tc.source === 'ISTQB_BVA') {
    sourceBadge = `<span class="badge" style="background:rgba(59,130,246,0.15); color:#60a5fa; border:1px solid rgba(59,130,246,0.3);" title="Técnica Formal ISTQB: Valores Límite de 3 Puntos">📐 BVA</span>`;
  } else if (tc.source === 'TEMPLATE') {
    sourceBadge = `<span class="badge" style="background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.3);" title="Generado desde Patrón / Plantilla ISTQB">📋 Plantilla</span>`;
  } else if (tc.source === 'MANUAL') {
    sourceBadge = `<span class="badge" style="background:rgba(245,158,11,0.15); color:#fbbf24; border:1px solid rgba(245,158,11,0.3);" title="Diseñado manualmente por analista QA">✍️ Manual</span>`;
  }

  const evidenceBadge = `<span class="badge badge-${tc.evidenceStatus || 'derived'}">Evidencia: ${tc.evidenceStatus || 'derived'}</span>`;

  const obsoleteWarning = tc.isObsolete
    ? `<div style="background:rgba(239, 68, 68, 0.12); border:1px solid rgba(239, 68, 68, 0.35); border-radius:var(--radius-sm); padding:6px 12px; margin-bottom:10px; font-size:0.78rem; color:#fca5a5;">
        ⚠️ <strong>Caso Obsolescente:</strong> El requisito de origen cambió de versión tras la generación de este caso. Requiere revisión.
       </div>`
    : '';

  return `
    <div class="card test-case-item" data-id="${tc.id}" style="border-left:4px solid ${tc.status === 'APPROVED' ? 'var(--success)' : tc.status === 'REJECTED' ? 'var(--error)' : 'var(--primary)'};">
      ${obsoleteWarning}
      <!-- Cabecera de la Tarjeta -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span class="test-case-code">${tc.code}</span>
          <span class="badge badge-outline">v${tc.version || 1}</span>
          <span class="badge badge-type-${tc.type}">${tc.type}</span>
          <span class="badge badge-outline">Prioridad: ${tc.priority}</span>
          ${sourceBadge}
          ${evidenceBadge}
        </div>
        <div>
          ${statusBadge}
        </div>
      </div>

      <!-- Título -->
      <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:12px; line-height:1.4;">
        ${escapeHtml(tc.title)}
      </h3>

      <!-- Precondiciones si existen -->
      ${
        preconditions.length > 0
          ? `
        <div style="margin-bottom:10px;">
          <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px;">Precondiciones:</div>
          <ul style="margin:0 0 0 16px; padding:0; font-size:0.84rem; color:var(--text-secondary);">
            ${preconditions.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
          </ul>
        </div>
      `
          : ''
      }

      <!-- Pasos a Seguir -->
      <div style="margin-bottom:12px;">
        <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px;">Pasos de Ejecución:</div>
        <ol style="margin:0 0 0 16px; padding:0; font-size:0.84rem; color:var(--text-secondary); line-height:1.5;">
          ${steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}
        </ol>
      </div>

      <!-- Datos de Prueba si existen -->
      ${
        tc.testData
          ? `
        <div style="margin-bottom:10px; font-size:0.82rem;">
          <strong style="color:var(--text-muted);">Datos de Prueba:</strong>
          <code style="background:rgba(0,0,0,0.25); padding:2px 6px; border-radius:4px; font-size:0.8rem;">${escapeHtml(tc.testData)}</code>
        </div>
      `
          : ''
      }

      <!-- Resultado Esperado -->
      <div style="background:rgba(0,0,0,0.2); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); margin-bottom:14px;">
        <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:2px;">Resultado Esperado:</div>
        <div style="font-size:0.86rem; color:var(--text-primary);">${escapeHtml(tc.expectedResult)}</div>
      </div>

      <!-- Barra de Acciones Individuales del Revisor -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding-top:10px; border-top:1px solid var(--border-subtle);">
        <button class="btn btn-sm btn-outline btn-tc-history" data-id="${tc.id}" title="Ver historial de auditoría y versiones">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          Historial (${(tc.reviews || []).length})
        </button>

        <div style="display:flex; gap:8px;">
          <button class="btn btn-sm btn-outline btn-tc-edit" data-id="${tc.id}">
            ✏️ Modificar
          </button>
          <button class="btn btn-sm btn-outline btn-tc-reject" data-id="${tc.id}" style="color:var(--error); border-color:rgba(239,68,68,0.35);">
            ✕ Rechazar
          </button>
          ${
            tc.status !== 'APPROVED'
              ? `
            <button class="btn btn-sm btn-success btn-tc-approve" data-id="${tc.id}">
              ✓ Aprobar
            </button>
          `
              : ''
          }
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
