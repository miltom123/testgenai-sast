// ==========================================================================
// Projects View - TestGenAI
// ==========================================================================

import { store } from '../state.js';
import { modals } from '../modals.js';
import { api } from '../api.js';
import { toast } from '../toast.js';

export function renderProjects(container) {
  const projects = store.get('projects') || [];
  const activeProjectId = store.get('activeProjectId');

  container.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
      <div>
        <h2 style="font-size:1.35rem; font-weight:700;">Gestión de Proyectos QA</h2>
        <p style="font-size:0.85rem; color:var(--text-secondary);">
          Organiza suites de pruebas, requisitos del software y métricas de derivación automática de IA.
        </p>
      </div>
      <button class="btn btn-primary" id="btn-open-new-project">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Nuevo Proyecto
      </button>
    </div>

    <!-- Projects Grid -->
    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap:22px;">
      ${
        projects.length > 0
          ? projects
              .map((p) => {
                const isActive = p.id === activeProjectId;
                const reqCount = p.stats?.requirementsCount ?? p._count?.requirements ?? 0;
                const caseCount = p.stats?.testCasesCount ?? 0;
                const coverage = p.stats?.coveragePercentage ?? 0;

                return `
              <div class="card" style="border-color:${isActive ? 'var(--primary)' : 'var(--border-subtle)'}; background:${isActive ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)'};">
                <div class="card-header">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:36px; height:36px; border-radius:var(--radius-md); background:linear-gradient(135deg, var(--primary), var(--secondary)); display:flex; align-items:center; justify-content:center; color:#fff;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                    </div>
                    <div>
                      <h3 style="font-size:1.05rem; font-weight:700;">${p.name}</h3>
                      <span style="font-size:0.72rem; color:var(--text-muted);">Creado el ${new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  ${isActive ? '<span class="badge badge-approved">Activo</span>' : ''}
                </div>

                <p style="font-size:0.84rem; color:var(--text-secondary); margin-bottom:18px; min-height:42px;">
                  ${p.description || 'Sin descripción disponible para este proyecto.'}
                </p>

                <!-- Mini Stats -->
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; margin-bottom:18px; text-align:center;">
                  <div style="background:rgba(0,0,0,0.25); padding:8px 6px; border-radius:var(--radius-sm);">
                    <div style="font-size:1.1rem; font-weight:700; color:var(--cyan);">${reqCount}</div>
                    <div style="font-size:0.68rem; color:var(--text-muted); text-transform:uppercase;">Requisitos</div>
                  </div>
                  <div style="background:rgba(0,0,0,0.25); padding:8px 6px; border-radius:var(--radius-sm);">
                    <div style="font-size:1.1rem; font-weight:700; color:var(--primary);">${caseCount}</div>
                    <div style="font-size:0.68rem; color:var(--text-muted); text-transform:uppercase;">Casos</div>
                  </div>
                  <div style="background:rgba(0,0,0,0.25); padding:8px 6px; border-radius:var(--radius-sm);">
                    <div style="font-size:1.1rem; font-weight:700; color:var(--success);">${coverage}%</div>
                    <div style="font-size:0.68rem; color:var(--text-muted); text-transform:uppercase;">Cobertura</div>
                  </div>
                </div>

                ${
                  reqCount === 0
                    ? `
                  <div style="margin-top:10px; margin-bottom:12px; padding:10px 12px; background:rgba(99,102,241,0.08); border-left:3px solid var(--primary); border-radius:var(--radius-sm); font-size:0.8rem; color:var(--text-secondary); display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <div><strong>Siguiente paso:</strong> Registra requisitos funcionales para generar casos de prueba con IA.</div>
                    <button class="btn btn-xs btn-primary btn-quick-new-req" data-id="${p.id}" style="white-space:nowrap;">+ Crear Requisito</button>
                  </div>
                `
                    : ''
                }

                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                  <div style="display:flex; gap:6px;">
                    <button class="btn btn-sm ${isActive ? 'btn-secondary' : 'btn-primary'} btn-select-project" data-id="${p.id}">
                      ${isActive ? '✓ Activo' : 'Seleccionar'}
                    </button>
                    <button class="btn btn-sm btn-outline btn-open-reqs" data-id="${p.id}" title="Ver Requisitos">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                      Requisitos
                    </button>
                    <button class="btn btn-sm btn-outline btn-open-trace" data-id="${p.id}" title="Ver Matriz de Trazabilidad">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                      Trazabilidad
                    </button>
                  </div>
                  <div style="display:flex; gap:6px;">
                    <button class="btn btn-sm btn-outline btn-edit-proj" data-id="${p.id}" title="Editar Proyecto">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                    <button class="btn btn-sm btn-outline btn-delete-proj" data-id="${p.id}" style="color:var(--error); border-color:rgba(239, 68, 68, 0.35);" title="Eliminar Proyecto">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            `;
              })
              .join('')
          : `
          <div class="card" style="grid-column: 1 / -1; text-align:center; padding:50px 20px;">
            <p style="color:var(--text-muted); margin-bottom:16px;">No hay proyectos creados aún en el sistema.</p>
            <button class="btn btn-primary" id="btn-empty-new-proj">+ Crear Primer Proyecto</button>
          </div>
        `
      }
    </div>
  `;

  // Listeners
  document.getElementById('btn-open-new-project')?.addEventListener('click', () => {
    modals.open('modal-new-project');
  });

  document.getElementById('btn-empty-new-proj')?.addEventListener('click', () => {
    modals.open('modal-new-project');
  });

  container.querySelectorAll('.btn-select-project').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const selected = projects.find((p) => p.id === id);
      if (selected) {
        store.set('activeProjectId', id);
        store.set('activeProject', selected);
        toast.info(`Proyecto activo cambiado a: ${selected.name}`);

        // Update selector in topbar
        const select = document.getElementById('project-select');
        if (select) select.value = id;

        // Fetch requirements for this project
        try {
          const reqRes = await api.getRequirements(id);
          if (reqRes.data) {
            store.set('requirements', reqRes.data);
            if (reqRes.data.length > 0) {
              store.set('activeRequirementId', reqRes.data[0].id);
              store.set('activeRequirement', reqRes.data[0]);
            }
          }
          const allTcRes = await api.getProjectTestCases(id);
          if (allTcRes.data) store.set('testCases', allTcRes.data);
        } catch (e) {
          console.error(e);
        }

        renderProjects(container);
      }
    });
  });

  container.querySelectorAll('.btn-open-reqs').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const selected = projects.find((p) => p.id === id);
      if (selected) {
        store.set('activeProjectId', id);
        store.set('activeProject', selected);
      }
      document.querySelector('[data-view="requirements"]')?.click();
    });
  });

  container.querySelectorAll('.btn-quick-new-req').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const selected = projects.find((p) => p.id === id);
      if (selected) {
        store.set('activeProjectId', id);
        store.set('activeProject', selected);
      }
      document.querySelector('[data-view="requirements"]')?.click();
      setTimeout(() => {
        modals.open('modal-new-requirement');
      }, 100);
    });
  });

  container.querySelectorAll('.btn-open-trace').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const selected = projects.find((p) => p.id === id);
      if (selected) {
        store.set('activeProjectId', id);
        store.set('activeProject', selected);
      }
      document.querySelector('[data-view="traceability"]')?.click();
    });
  });

  // Edit project
  container.querySelectorAll('.btn-edit-proj').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const selected = projects.find((p) => p.id === id);
      if (selected) {
        modals.populateEditProject(selected);
      }
    });
  });

  // Delete project
  container.querySelectorAll('.btn-delete-proj').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const selected = projects.find((p) => p.id === id);
      if (!confirm(`¿Está seguro de eliminar el proyecto "${selected?.name}"? Se eliminarán todos sus requisitos y casos en cascada.`)) {
        return;
      }

      btn.disabled = true;
      try {
        await api.deleteProject(id);
        toast.success(`Proyecto "${selected?.name}" eliminado`);
        const projRes = await api.getProjects();
        const updatedProjects = projRes.data || [];
        store.set('projects', updatedProjects);
        if (updatedProjects.length > 0) {
          store.set('activeProjectId', updatedProjects[0].id);
          store.set('activeProject', updatedProjects[0]);
        } else {
          store.set('activeProjectId', null);
          store.set('activeProject', null);
        }
        renderProjects(container);
      } catch (err) {
        toast.error(`Error al eliminar proyecto: ${err.message}`);
        btn.disabled = false;
      }
    });
  });
}
