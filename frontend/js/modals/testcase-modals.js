// ==========================================================================
// TestCase Modals Controller - TestGenAI (MVP Real)
// Revisión humana individual (Human-in-the-Loop) con control de concurrencia
// ==========================================================================

import { api } from '../api.js';
import { store } from '../state.js';
import { toast } from '../toast.js';

export class TestCaseModalHandler {
  constructor(modalManager) {
    this.modalManager = modalManager;
  }

  setup() {
    this._setupTestCaseEditForm();
    this._setupRejectForm();
  }

  populateEditTestCase(tc) {
    const idInput = document.getElementById('edit-tc-id');
    const versionInput = document.getElementById('edit-tc-expected-version');
    const titleInput = document.getElementById('edit-tc-title');
    const prioritySelect = document.getElementById('edit-tc-priority');
    const evidenceSelect = document.getElementById('edit-tc-evidence-status');
    const precondInput = document.getElementById('edit-tc-preconditions');
    const stepsInput = document.getElementById('edit-tc-steps');
    const testDataInput = document.getElementById('edit-tc-testdata');
    const expectedInput = document.getElementById('edit-tc-expected');
    const commentsInput = document.getElementById('edit-tc-comments');

    if (idInput) idInput.value = tc.id;
    if (versionInput) versionInput.value = tc.version || 1;
    if (titleInput) titleInput.value = tc.title || '';
    if (prioritySelect) prioritySelect.value = tc.priority || 'medium';
    if (evidenceSelect) evidenceSelect.value = tc.evidenceStatus || 'derived';

    const preconds = Array.isArray(tc.preconditions) ? tc.preconditions.join('\n') : tc.preconditions || '';
    if (precondInput) precondInput.value = preconds;

    const steps = Array.isArray(tc.steps) ? tc.steps.join('\n') : tc.steps || '';
    if (stepsInput) stepsInput.value = steps;

    if (testDataInput) testDataInput.value = tc.testData || '';
    if (expectedInput) expectedInput.value = tc.expectedResult || '';
    if (commentsInput) commentsInput.value = '';

    this.modalManager.open('modal-edit-testcase');
  }

  populateRejectTestCase(tc) {
    const idInput = document.getElementById('reject-tc-id');
    const versionInput = document.getElementById('reject-tc-expected-version');
    const codeLabel = document.getElementById('reject-tc-code-label');
    const notesInput = document.getElementById('reject-notes-input');

    if (idInput) idInput.value = tc.id;
    if (versionInput) versionInput.value = tc.version || 1;
    if (codeLabel) codeLabel.textContent = `Caso: ${tc.code} — "${tc.title}"`;
    if (notesInput) notesInput.value = '';

    this.modalManager.open('modal-reject-testcase');
  }

  _setupTestCaseEditForm() {
    const form = document.getElementById('form-edit-testcase');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-tc-id').value;
      const expectedVersion = parseInt(document.getElementById('edit-tc-expected-version').value, 10) || 1;
      const title = document.getElementById('edit-tc-title').value.trim();
      const priority = document.getElementById('edit-tc-priority').value;
      const evidenceStatus = document.getElementById('edit-tc-evidence-status').value;
      const testData = document.getElementById('edit-tc-testdata').value.trim() || null;
      const expectedResult = document.getElementById('edit-tc-expected').value.trim();
      const comments = document.getElementById('edit-tc-comments').value.trim();

      const rawPre = document.getElementById('edit-tc-preconditions').value.trim();
      const preconditions = rawPre ? rawPre.split('\n').map((s) => s.trim()).filter(Boolean) : [];

      const rawSteps = document.getElementById('edit-tc-steps').value.trim();
      const steps = rawSteps.split('\n').map((s) => s.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);

      if (!title || steps.length === 0 || !expectedResult) {
        toast.warning('Título, pasos y resultado esperado son obligatorios');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-inline"></span> Guardando...';

      try {
        await api.reviewTestCase(id, {
          decision: 'MODIFIED',
          expectedVersion,
          comments: comments || 'Modificado por analista QA',
          updates: {
            title,
            priority,
            evidenceStatus,
            preconditions,
            steps,
            testData,
            expectedResult,
          },
        });

        toast.success('Caso de prueba modificado y registrado en historial de auditoría');
        this.modalManager.close('modal-edit-testcase');

        // Recargar casos del proyecto
        const projectId = store.get('activeProjectId');
        if (projectId) {
          const tcRes = await api.getProjectTestCases(projectId);
          if (tcRes.data) store.set('testCases', tcRes.data);
          const metRes = await api.getMetrics(projectId);
          if (metRes.data) store.set('metrics', metRes.data);
        }

        // Refrescar vista actual
        const currentView = store.get('currentView');
        if (currentView) {
          document.querySelector(`.nav-item[data-view="${currentView}"]`)?.click();
        }
      } catch (err) {
        console.error('Error al modificar caso:', err);
        toast.error(err.message || 'Error al guardar la revisión');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Guardar y Marcar Modificado';
      }
    });
  }

  _setupRejectForm() {
    const form = document.getElementById('form-reject-testcase');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('reject-tc-id').value;
      const expectedVersion = parseInt(document.getElementById('reject-tc-expected-version').value, 10) || 1;
      const reason = document.getElementById('reject-reason-select').value;
      const notes = document.getElementById('reject-notes-input').value.trim();

      if (!notes) {
        toast.warning('Por favor ingrese las observaciones de auditoría');
        return;
      }

      const comments = `${reason}: ${notes}`;

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-inline"></span> Rechazando...';

      try {
        await api.reviewTestCase(id, {
          decision: 'REJECTED',
          expectedVersion,
          comments,
        });

        toast.warning('Caso rechazado y registrado en el historial');
        this.modalManager.close('modal-reject-testcase');
        form.reset();

        const projectId = store.get('activeProjectId');
        if (projectId) {
          const tcRes = await api.getProjectTestCases(projectId);
          if (tcRes.data) store.set('testCases', tcRes.data);
          const metRes = await api.getMetrics(projectId);
          if (metRes.data) store.set('metrics', metRes.data);
        }

        const currentView = store.get('currentView');
        if (currentView) {
          document.querySelector(`.nav-item[data-view="${currentView}"]`)?.click();
        }
      } catch (err) {
        console.error('Error al rechazar caso:', err);
        toast.error(err.message || 'Error al rechazar el caso');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Confirmar Rechazo';
      }
    });
  }
}
