// ==========================================================================
// Metrics View - TestGenAI (MVP Real)
// Indicadores calculados sobre registros reales persistidos (sin ROI ficticio)
// ==========================================================================

import { store } from '../state.js';
import { api } from '../api.js';

export async function renderMetrics(container) {
  const project = store.get('activeProject');
  const projectId = store.get('activeProjectId');

  if (!projectId) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:50px 20px;">
        <p style="color:var(--text-muted);">Seleccione un proyecto activo para consultar sus métricas.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
      <div>
        <h2 style="font-size:1.35rem; font-weight:700;">Métricas e Historial de IA</h2>
        <p style="font-size:0.84rem; color:var(--text-secondary);">
          Métricas calculadas a partir de casos, revisiones y ejecuciones reales persistidas en PostgreSQL.
        </p>
      </div>

      <button class="btn btn-secondary btn-sm" id="btn-refresh-metrics">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
        Actualizar Métricas
      </button>
    </div>

    <div id="metrics-content-area">
      <div class="card" style="text-align:center; padding:40px;">
        <span class="spinner-inline"></span>
        <p style="color:var(--text-muted); margin-top:10px; font-size:0.85rem;">Calculando indicadores sobre datos reales...</p>
      </div>
    </div>
  `;

  async function loadMetricsData() {
    const contentArea = container.querySelector('#metrics-content-area');
    try {
      const res = await api.getMetrics(projectId);
      const m = res.data || {};
      store.set('metrics', m);
      renderMetricsDashboard(m, contentArea);
    } catch (err) {
      if (contentArea) {
        contentArea.innerHTML = `
          <div class="card" style="text-align:center; padding:40px; color:var(--error);">
            Error al consultar métricas: ${escapeHtml(err.message)}
          </div>
        `;
      }
    }
  }

  loadMetricsData();

  container.querySelector('#btn-refresh-metrics')?.addEventListener('click', () => {
    loadMetricsData();
  });
}

function renderMetricsDashboard(m, container) {
  if (!container) return;

  const coverage = m.coverage || {};
  const testCases = m.testCases || {};
  const aiPerf = m.aiPerformance || {};
  const evidence = m.evidenceDistribution || {};
  const duplicateCandidates = m.duplicateCandidatesCount ?? 0;

  const totalCases = testCases.total ?? 0;
  const approved = testCases.approved ?? 0;
  const modified = testCases.modified ?? 0;
  const rejected = testCases.rejected ?? 0;
  const pending = testCases.pending ?? 0;

  const totalTokens = aiPerf.totalTokens ?? 0;
  const totalCostUSD = aiPerf.totalCostUSD !== null && aiPerf.totalCostUSD !== undefined ? `$${Number(aiPerf.totalCostUSD).toFixed(5)}` : 'No disponible';
  const avgLatencyMs = aiPerf.avgLatencyMs ? `${aiPerf.avgLatencyMs} ms` : 'No disponible';
  const totalGenerations = aiPerf.totalGenerations ?? 0;
  const failedGenerations = aiPerf.failedGenerations ?? 0;
  const cachedGenerations = aiPerf.cachedGenerations ?? 0;

  container.innerHTML = `
    <!-- Fila 1: KPIs Principales de Calidad -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap:16px; margin-bottom:24px;">
      <div class="card" style="padding:16px; text-align:center;">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Cobertura de Requisitos</div>
        <div style="font-size:2rem; font-weight:800; color:${(coverage.percentage ?? 0) > 0 ? 'var(--success)' : 'var(--text-muted)'}; margin:6px 0;">
          ${coverage.percentage !== undefined ? `${coverage.percentage}%` : 'Sin datos'}
        </div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">
          ${coverage.coveredRequirements ?? 0} de ${coverage.totalRequirements ?? 0} requisitos activos cubiertos
        </div>
      </div>

      <div class="card" style="padding:16px; text-align:center;">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Casos Aprobados</div>
        <div style="font-size:2rem; font-weight:800; color:var(--success); margin:6px 0;">
          ${approved}
        </div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">
          ${totalCases > 0 ? `${Math.round((approved / totalCases) * 100)}% del total generado` : '0 casos'}
        </div>
      </div>

      <div class="card" style="padding:16px; text-align:center;">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Pendientes de Revisión</div>
        <div style="font-size:2rem; font-weight:800; color:#fbbf24; margin:6px 0;">
          ${pending}
        </div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">
          Requieren validación humana QA
        </div>
      </div>

      <div class="card" style="padding:16px; text-align:center;">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Casos Modificados</div>
        <div style="font-size:2rem; font-weight:800; color:var(--cyan); margin:6px 0;">
          ${modified}
        </div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">
          Ajustados durante la revisión
        </div>
      </div>

      <div class="card" style="padding:16px; text-align:center;">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Casos Rechazados</div>
        <div style="font-size:2rem; font-weight:800; color:var(--error); margin:6px 0;">
          ${rejected}
        </div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">
          Descartados con motivo auditado
        </div>
      </div>
    </div>

    <!-- Fila 2: Métricas de IA Real & Consumo (FinOps) -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:20px; margin-bottom:24px;">
      <!-- Panel de Consumo de IA Real -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            Consumo Real de IA (FinOps)
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:16px;">
          <div style="background:rgba(0,0,0,0.25); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Tokens Reportados</div>
            <div style="font-size:1.3rem; font-weight:800; color:var(--cyan); margin-top:2px;">
              ${totalTokens.toLocaleString()}
            </div>
            <div style="font-size:0.7rem; color:var(--text-secondary);">Entrada + Salida (API)</div>
          </div>

          <div style="background:rgba(0,0,0,0.25); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Costo Estimado Acumulado</div>
            <div style="font-size:1.3rem; font-weight:800; color:var(--success); margin-top:2px;">
              ${totalCostUSD}
            </div>
            <div style="font-size:0.7rem; color:var(--text-secondary);">Tarifas vigentes proveedor</div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; font-size:0.83rem;">
          <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border-subtle);">
            <span style="color:var(--text-secondary);">Ejecuciones exitosas:</span>
            <span style="font-weight:700;">${totalGenerations - failedGenerations}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border-subtle);">
            <span style="color:var(--text-secondary);">Ejecuciones fallidas:</span>
            <span style="font-weight:700; color:${failedGenerations > 0 ? 'var(--error)' : 'inherit'};">${failedGenerations}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border-subtle);">
            <span style="color:var(--text-secondary);">Reutilizaciones desde caché:</span>
            <span style="font-weight:700; color:var(--cyan);">${cachedGenerations}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:6px 0;">
            <span style="color:var(--text-secondary);">Latencia promedio de inferencia:</span>
            <span style="font-weight:700;">${avgLatencyMs}</span>
          </div>
        </div>
      </div>

      <!-- Panel de Distribución de Evidencia y Duplicados -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
            Calidad de Evidencia & Duplicados (RF-14)
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <div style="font-size:0.76rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; font-weight:700;">
            Estados de Evidencia ISTQB
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
            <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); padding:8px 12px; border-radius:var(--radius-sm);">
              <div style="font-size:0.72rem; color:var(--success);">DERIVADO (Cita textual)</div>
              <div style="font-size:1.1rem; font-weight:700;">${evidence.derived ?? 0}</div>
            </div>
            <div style="background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.3); padding:8px 12px; border-radius:var(--radius-sm);">
              <div style="font-size:0.72rem; color:var(--cyan);">SUGERIDO (Inferencia)</div>
              <div style="font-size:1.1rem; font-weight:700;">${evidence.suggested ?? 0}</div>
            </div>
            <div style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); padding:8px 12px; border-radius:var(--radius-sm);">
              <div style="font-size:0.72rem; color:#fbbf24;">AMBIGUO (Regla vaga)</div>
              <div style="font-size:1.1rem; font-weight:700;">${evidence.ambiguous ?? 0}</div>
            </div>
            <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); padding:8px 12px; border-radius:var(--radius-sm);">
              <div style="font-size:0.72rem; color:var(--error);">CONFLICTO (Contradicción)</div>
              <div style="font-size:1.1rem; font-weight:700;">${evidence.conflict ?? 0}</div>
            </div>
          </div>
        </div>

        <div style="background:rgba(0,0,0,0.2); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:0.83rem; font-weight:700;">Candidatos a Duplicado Potencial:</div>
              <div style="font-size:0.75rem; color:var(--text-secondary);">Casos con pasos y resultados normalizados muy similares</div>
            </div>
            <div style="font-size:1.4rem; font-weight:800; color:${duplicateCandidates > 0 ? '#fbbf24' : 'var(--text-muted)'};">
              ${duplicateCandidates}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Nota Metodológica de Transparencia Científica -->
    <div class="card" style="background:rgba(99,102,241,0.05); border-color:rgba(99,102,241,0.25); font-size:0.82rem; color:var(--text-secondary); line-height:1.6;">
      <strong style="color:#fff;">Nota Metodológica:</strong> Los valores aquí reflejados provienen de auditorías y ejecuciones reales persistidas. 
      La evaluación experimental comparativa de ahorro de tiempo (30-50 requisitos evaluados frente a pruebas manuales y cuestionarios) 
      permanece como <em>pendiente de evaluación experimental formal</em>, sin cifras fabricadas en el MVP.
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
