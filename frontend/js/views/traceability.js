// ==========================================================================
// Traceability Matrix View - TestGenAI (MVP Real)
// Matriz de cobertura bidireccional requisito <-> casos aprobados vigentes
// ==========================================================================

import { store } from '../state.js';
import { api } from '../api.js';
import { toast } from '../toast.js';

export async function renderTraceability(container) {
  const project = store.get('activeProject');
  const projectId = store.get('activeProjectId');

  if (!projectId) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:50px 20px;">
        <p style="color:var(--text-muted);">Seleccione un proyecto activo para visualizar la matriz de trazabilidad.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:16px;">
      <div>
        <h2 style="font-size:1.35rem; font-weight:700;">Matriz de Trazabilidad y Cobertura</h2>
        <p style="font-size:0.84rem; color:var(--text-secondary);">
          Asociación verificable entre requisitos y sus casos de prueba aprobados vigentes.
        </p>
      </div>

      <!-- Barra de Exportación Oficial -->
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" id="btn-export-csv">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Exportar CSV
        </button>
        <button class="btn btn-secondary btn-sm" id="btn-export-md">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          Exportar Markdown
        </button>
        <button class="btn btn-secondary btn-sm" id="btn-export-json">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6"></path><path d="M8 6l-6 6 6 6"></path></svg>
          Exportar JSON
        </button>
      </div>
    </div>

    <!-- Contenedor de la Matriz -->
    <div id="trace-table-container">
      <div class="card" style="text-align:center; padding:40px;">
        <span class="spinner-inline"></span>
        <p style="color:var(--text-muted); margin-top:10px; font-size:0.85rem;">Calculando matriz de cobertura...</p>
      </div>
    </div>
  `;

  // Configurar botones de exportación
  setupExportButtons(projectId, container);

  // Cargar matriz
  loadTraceabilityData(projectId, container);
}

async function loadTraceabilityData(projectId, container) {
  const tableContainer = container.querySelector('#trace-table-container');
  try {
    const res = await api.getTraceability(projectId);
    const traceData = res.data || {};
    renderTraceabilityTable(traceData, tableContainer);
  } catch (err) {
    if (tableContainer) {
      tableContainer.innerHTML = `
        <div class="card" style="text-align:center; padding:40px; color:var(--error);">
          Error al cargar la matriz de trazabilidad: ${escapeHtml(err.message)}
        </div>
      `;
    }
  }
}

function renderTraceabilityTable(data, tableContainer) {
  if (!tableContainer) return;

  const matrix = data.matrix || [];
  const summary = data.summary || {};
  const coveragePct = summary.coveragePercentage ?? 0;

  if (matrix.length === 0) {
    tableContainer.innerHTML = `
      <div class="card" style="text-align:center; padding:40px;">
        <p style="color:var(--text-muted);">No hay requisitos registrados en este proyecto para calcular cobertura.</p>
      </div>
    `;
    return;
  }

  tableContainer.innerHTML = `
    <!-- Tarjeta de Resumen de Cobertura -->
    <div class="card" style="margin-bottom:20px; padding:16px 20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
        <div>
          <span style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Cobertura de Requisitos (RF-07)</span>
          <div style="font-size:1.6rem; font-weight:800; color:${coveragePct > 0 ? 'var(--success)' : 'var(--text-muted)'}; margin-top:2px;">
            ${coveragePct}%
          </div>
        </div>
        <div style="display:flex; gap:20px; font-size:0.85rem;">
          <div><strong style="color:#fff;">${summary.coveredRequirements ?? 0}</strong> <span style="color:var(--text-muted);">cubiertos</span></div>
          <div><strong style="color:#fff;">${summary.uncoveredRequirements ?? 0}</strong> <span style="color:var(--text-muted);">sin cubrir</span></div>
          <div><strong style="color:#fff;">${summary.totalTestCases ?? 0}</strong> <span style="color:var(--text-muted);">casos totales</span></div>
          <div><strong style="color:var(--success);">${summary.approvedTestCases ?? 0}</strong> <span style="color:var(--text-muted);">aprobados</span></div>
        </div>
      </div>
    </div>

    <!-- Tabla de Trazabilidad -->
    <div class="table-responsive card" style="padding:0; overflow:hidden;">
      <table class="table">
        <thead>
          <tr>
            <th style="width:110px;">Cód. Requisito</th>
            <th>Título del Requisito</th>
            <th style="width:70px; text-align:center;">Versión</th>
            <th>Casos Asociados</th>
            <th style="width:140px; text-align:center;">Estado de Casos</th>
            <th style="width:120px; text-align:center;">Cobertura</th>
          </tr>
        </thead>
        <tbody>
          ${matrix
            .map((row) => {
              const cases = row.testCases || [];
              const approvedCount = cases.filter((c) => c.status === 'APPROVED').length;
              const pendingCount = cases.filter((c) => c.status === 'PENDING').length;
              const isCovered = approvedCount > 0;

              return `
              <tr>
                <td>
                  <span class="test-case-code req-jump-link" data-req-id="${row.id}" style="cursor:pointer;" title="Ir a detalle del requisito">
                    ${escapeHtml(row.code)}
                  </span>
                </td>
                <td style="font-weight:600; font-size:0.88rem;">
                  ${escapeHtml(row.title)}
                </td>
                <td style="text-align:center;">
                  <span class="badge badge-outline">v${row.version || 1}</span>
                </td>
                <td>
                  ${
                    cases.length > 0
                      ? `<div style="display:flex; flex-wrap:wrap; gap:4px;">
                          ${cases
                            .map(
                              (c) => `
                            <span class="badge badge-type-${c.type} tc-jump-link" data-req-id="${row.id}" data-tc-code="${c.code}" style="cursor:pointer; font-size:0.7rem;" title="${escapeHtml(c.title)}">
                              ${escapeHtml(c.code)} (${c.status})
                            </span>
                          `
                            )
                            .join('')}
                        </div>`
                      : `<span style="color:var(--text-muted); font-size:0.8rem;">Sin casos generados</span>`
                  }
                </td>
                <td style="text-align:center;">
                  <div style="font-size:0.78rem; display:flex; justify-content:center; gap:6px;">
                    <span style="color:var(--success);">${approvedCount} apr.</span>
                    <span style="color:#fbbf24;">${pendingCount} pend.</span>
                  </div>
                </td>
                <td style="text-align:center;">
                  <span class="badge ${isCovered ? 'badge-approved' : 'badge-pending'}">
                    ${isCovered ? '✓ CUBIERTO' : 'SIN COBERTURA'}
                  </span>
                </td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  // Click-to-jump to requirements or test cases
  tableContainer.querySelectorAll('.req-jump-link').forEach((link) => {
    link.addEventListener('click', () => {
      const reqId = link.getAttribute('data-req-id');
      if (reqId) store.set('activeRequirementId', reqId);
      document.querySelector('[data-view="requirements"]')?.click();
    });
  });

  tableContainer.querySelectorAll('.tc-jump-link').forEach((link) => {
    link.addEventListener('click', () => {
      const reqId = link.getAttribute('data-req-id');
      if (reqId) store.set('activeRequirementId', reqId);
      document.querySelector('[data-view="test-cases"]')?.click();
    });
  });
}

function setupExportButtons(projectId, container) {
  const handleExport = async (format) => {
    try {
      toast.info(`Generando exportación de casos aprobados en ${format.toUpperCase()}...`);
      await api.downloadExport(projectId, format);
      toast.success(`Archivo descargado correctamente`);
    } catch (err) {
      toast.error(err.message || 'Error al exportar');
    }
  };

  container.querySelector('#btn-export-csv')?.addEventListener('click', () => handleExport('csv'));
  container.querySelector('#btn-export-md')?.addEventListener('click', () => handleExport('markdown'));
  container.querySelector('#btn-export-json')?.addEventListener('click', () => handleExport('json'));
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
