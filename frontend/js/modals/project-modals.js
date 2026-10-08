// ==========================================================================
// Project Modals Controller - Modularized Modal Handler
// ==========================================================================

import { api } from '../api.js';
import { store } from '../state.js';
import { toast } from '../toast.js';
import { app } from '../app.js';

export class ProjectModalHandler {
  constructor(modalManager) {
    this.modalManager = modalManager;
  }

  setup() {
    this._setupProjectForm();
    this._setupEditProjectForm();
  }

  _setupProjectForm() {
    const form = document.getElementById('form-new-project');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('project-name-input').value.trim();
      const description = document.getElementById('project-desc-input').value.trim();

      if (!name) {
        toast.warning('El nombre del proyecto es obligatorio');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Creando...';

      try {
        const res = await api.createProject({ name, description });
        toast.success(`Proyecto "${name}" creado exitosamente`);
        form.reset();
        this.modalManager.close('modal-new-project');

        // Refresh projects
        const projRes = await api.getProjects();
        if (projRes.data) {
          store.set('projects', projRes.data);
          store.set('activeProjectId', res.data.id);
          store.set('activeProject', res.data);
          store.set('requirements', []);
          store.set('activeRequirement', null);
          store.set('testCases', []);
        }
        app.refresh();
      } catch (err) {
        toast.error(`Error al crear proyecto: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Crear Proyecto';
      }
    });
  }

  _setupEditProjectForm() {
    const form = document.getElementById('form-edit-project');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-project-id').value;
      const name = document.getElementById('edit-project-name').value.trim();
      const description = document.getElementById('edit-project-desc').value.trim();
      const status = document.getElementById('edit-project-status').value;

      if (!name) {
        toast.warning('El nombre del proyecto es obligatorio');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Guardando...';

      try {
        await api.updateProject(id, { name, description, status });
        toast.success(`Proyecto "${name}" actualizado`);
        this.modalManager.close('modal-edit-project');

        const projRes = await api.getProjects();
        if (projRes.data) {
          store.set('projects', projRes.data);
          const activeProj = projRes.data.find((p) => p.id === id);
          if (activeProj) store.set('activeProject', activeProj);
        }
      } catch (err) {
        toast.error(`Error al actualizar proyecto: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Guardar Cambios';
      }
    });
  }

  populateEditProject(p) {
    document.getElementById('edit-project-id').value = p.id;
    document.getElementById('edit-project-name').value = p.name || '';
    document.getElementById('edit-project-desc').value = p.description || '';
    document.getElementById('edit-project-status').value = p.status || 'ACTIVE';
    this.modalManager.open('modal-edit-project');
  }
}
