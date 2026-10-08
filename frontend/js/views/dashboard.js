// ==========================================================================
// Dashboard View - TestGenAI (MVP Real)
// Resumen operativo del proyecto seleccionado, sin datos inventados ni mocks
// ==========================================================================

import { store } from '../state.js';
import { modals } from '../modals.js';
import { api } from '../api.js';
import { toast } from '../toast.js';

function go(view) {
  document.querySelector(`.nav-item[data-view="${view}"]`)?.click();
}

export function renderDashboard(container) {
  const user = store.get('user');
  const project = store.get('activeProject');
  const requirements = store.get('requirements') || [];
  const testCases = store.get('testCases') || [];
  const metrics = store.get('metrics');

  const totalReqs = requirements.length;
  const totalCases = testCases.length;
  const pendingCases = testCases.filter((tc) => tc.status === 'PENDING').length;
  const approvedCases = testCases.filter((tc) => tc.status === 'APPROVED').length;
  const modifiedCases = testCases.filter((tc) => tc.status === 'MODIFIED').length;
  const rejectedCases = testCases.filter((tc) => tc.status === 'REJECTED').length;

  const coveragePct = metrics?.coverage?.percentage ?? (totalReqs > 0 ? Math.round((approvedCases > 0 ? 1 : 0) / totalReqs * 100) : 0);

  const displayName = user?.fullName || user?.email ? (user.fullName || user.email).split(' ')[0] : 'Usuario';

  // Si no hay proyecto seleccionado
  if (!project) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:60px 24px; max-width:680px; margin:40px auto;">
        <div style="width:56px; height:56px; border-radius:var(--radius-lg); background:rgba(99,102,241,0.15); display:inline-flex; align-items:center; justify-content:center; color:var(--primary); margin-bottom:16px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
        </div>
        <h2 style="font-size:1.4rem; font-weight:700; margin-bottom:8px;">Crea un proyecto para comenzar</h2>
        <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:24px; line-height:1.6;">
          Una instalación limpia comienza vacía. Registra tu primer proyecto de software para organizar requisitos y generar casos de prueba con IA.
        </p>
        <button class="btn btn-primary" id="btn-dash-create-proj">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          + Crear Primer Proyecto
        </button>
      </div>
    `;

    container.querySelector('#btn-dash-create-proj')?.addEventListener('click', () => {
      modals.open('modal-new-project');
    });
    return;
  }

  // Si el proyecto no tiene requisitos
  if (totalReqs === 0) {
    container.innerHTML = `
      <div class="card" style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 style="font-size:1.3rem; font-weight:700;">Proyecto: ${project.name}</h2>
            <p style="color:var(--text-secondary); font-size:0.85rem;">${project.description || 'Sin descripción'}</p>
          </div>
          <button class="btn btn-outline btn-sm" id="btn-dash-new-proj">+ Nuevo Proyecto</button>
        </div>
      </div>

      <div class="card" style="text-align:center; padding:60px 24px; max-width:680px; margin:20px auto;">
        <div style="width:56px; height:56px; border-radius:var(--radius-lg); background:rgba(6,182,212,0.15); display:inline-flex; align-items:center; justify-content:center; color:var(--cyan); margin-bottom:16px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
        </div>
        <h2 style="font-size:1.35rem; font-weight:700; margin-bottom:8px;">Registra un requisito funcional</h2>
        <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:24px; line-height:1.6;">
          Este proyecto aún no tiene requisitos definidos. Registra un requisito con sus criterios de aceptación o impórtalo desde CSV/JSON.
        </p>
        <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
          <button class="btn btn-primary" id="btn-dash-create-req">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            + Registrar Requisito
          </button>
          <button class="btn btn-secondary" id="btn-dash-import-req">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Importar CSV / JSON
          </button>
        </div>
      </div>
    `;

    container.querySelector('#btn-dash-new-proj')?.addEventListener('click', () => modals.open('modal-new-project'));
    container.querySelector('#btn-dash-create-req')?.addEventListener('click', () => modals.open('modal-new-requirement'));
    container.querySelector('#btn-dash-import-req')?.addEventListener('click', () => modals.open('modal-import-requirements'));
    return;
  }

  // Dashboard con datos reales
  container.innerHTML = `
    <!-- Banner de Resumen -->
    <div class="card" style="margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; border:1px solid rgba(255,255,255,0.08); background:rgba(15,23,42,0.65);">
      <div>
        <h2 style="font-size:1.35rem; font-weight:800; margin-bottom:4px;">
          <span>¡Hola, ${displayName}! 👋</span>
        </h2>
        <p style="color:var(--text-secondary); font-size:0.88rem;">
          Proyecto activo: <strong style="color:var(--text-primary);">${project.name}</strong>
        </p>
      </div>
      <div style="display:flex; gap:10px; align-items:center;">
        <button class="btn btn-outline btn-sm" id="btn-dashboard-new-req">+ Nuevo Requisito</button>
        <button class="btn btn-primary btn-sm" id="btn-dashboard-view-all-cases">📋 Casos de Prueba (${totalCases})</button>
      </div>
    </div>

    <!-- Indicadores Clave Reales -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap:16px; margin-bottom:24px;">
      <div class="card" style="padding:16px; text-align:center;">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Requisitos Activos</div>
        <div style="font-size:1.8rem; font-weight:800; color:var(--cyan); margin:6px 0;">${totalReqs}</div>
        <div style="font-size:0.75rem; color:var(--text-secondary); cursor:pointer;" id="link-go-reqs">Ver requisitos &rarr;</div>
      </div>

      <div class="card" style="padding:16px; text-align:center;">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Casos Generados</div>
        <div style="font-size:1.8rem; font-weight:800; color:var(--primary); margin:6px 0;">${totalCases}</div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">Origen: IA Real</div>
      </div>

      <div class="card" style="padding:16px; text-align:center;">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Pendientes de Revisión</div>
        <div style="font-size:1.8rem; font-weight:800; color:#fbbf24; margin:6px 0;">${pendingCases}</div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">Requieren decisión humana</div>
      </div>

      <div class="card" style="padding:16px; text-align:center;">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Casos Aprobados</div>
        <div style="font-size:1.8rem; font-weight:800; color:var(--success); margin:6px 0;">${approvedCases}</div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">Listos para exportar</div>
      </div>

      <div class="card" style="padding:16px; text-align:center;">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Cobertura Vigente</div>
        <div style="font-size:1.8rem; font-weight:800; color:${coveragePct > 0 ? 'var(--success)' : 'var(--text-muted)'}; margin:6px 0;">${coveragePct}%</div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">Requisitos con casos aprobados</div>
      </div>
    </div>

    <!-- Sección de Requisitos del Proyecto -->
    <div class="card" style="margin-bottom:24px;">
      <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
        <div class="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          Requisitos del Proyecto
        </div>
        <button class="btn btn-sm btn-outline" id="btn-dash-add-req">+ Agregar Requisito</button>
      </div>

      <div style="display:flex; flex-direction:column; gap:10px;">
        ${requirements
          .map((r) => {
            const reqCases = testCases.filter((tc) => tc.requirementId === r.id);
            const reqApproved = reqCases.filter((tc) => tc.status === 'APPROVED').length;
            const reqPending = reqCases.filter((tc) => tc.status === 'PENDING').length;

            return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:rgba(0,0,0,0.2); border-radius:var(--radius-md); border:1px solid var(--border-subtle); flex-wrap:wrap; gap:10px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <span class="test-case-code">${r.code}</span>
                <div>
                  <div style="font-weight:600; font-size:0.9rem;">${r.title}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${reqCases.length} casos (${reqApproved} aprobados, ${reqPending} pendientes)</div>
                </div>
              </div>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-sm btn-primary btn-dash-gen-ai" data-req-id="${r.id}" data-req-code="${r.code}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  Generar con IA
                </button>
              </div>
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
  `;

  // Listeners
  container.querySelector('#btn-dashboard-new-req')?.addEventListener('click', () => modals.open('modal-new-requirement'));
  container.querySelector('#btn-dash-add-req')?.addEventListener('click', () => modals.open('modal-new-requirement'));
  container.querySelector('#btn-dashboard-view-all-cases')?.addEventListener('click', () => go('test-cases'));
  container.querySelector('#link-go-reqs')?.addEventListener('click', () => go('requirements'));

  container.querySelectorAll('.btn-dash-gen-ai').forEach((btn) => {
    btn.addEventListener('click', () => {
      const reqId = btn.getAttribute('data-req-id');
      const req = requirements.find((r) => r.id === reqId);
      if (req) {
        store.set('activeRequirementId', reqId);
        store.set('activeRequirement', req);
        modals.openAiGenModal(req);
      }
    });
  });
}
