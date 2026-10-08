// ==========================================================================
// Requirement Modals Controller - TestGenAI (MVP Real)
// Creación, edición versionada e importación CSV/JSON validada
// ==========================================================================

import { api } from '../api.js';
import { store } from '../state.js';
import { toast } from '../toast.js';
import { app } from '../app.js';

export class RequirementModalHandler {
  constructor(modalManager) {
    this.modalManager = modalManager;
  }

  setup() {
    this._setupRequirementForm();
    this._setupEditRequirementForm();
    this._setupImportForm();
  }

  _setupRequirementForm() {
    const form = document.getElementById('form-new-requirement');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const projectId = store.get('activeProjectId');
      if (!projectId) {
        toast.warning('Seleccione un proyecto activo primero');
        return;
      }

      const title = document.getElementById('req-title-input')?.value.trim();
      const description = document.getElementById('req-desc-input')?.value.trim();
      const acceptanceCriteria = document.getElementById('req-criteria-input')?.value.trim();

      if (!title || !description || !acceptanceCriteria) {
        toast.warning('Título, descripción y criterios de aceptación son obligatorios');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-inline"></span> Guardando...';

      try {
        const res = await api.createRequirement({
          projectId,
          title,
          description,
          acceptanceCriteria,
        });

        toast.success(`Requisito ${res.data?.code || ''} creado correctamente`);
        form.reset();
        this.modalManager.close('modal-new-requirement');

        const reqRes = await api.getRequirements(projectId);
        if (reqRes.data) {
          store.set('requirements', reqRes.data);
          const created = reqRes.data.find((r) => r.id === res.data?.id) || reqRes.data[0];
          store.set('activeRequirement', created);
          store.set('activeRequirementId', created.id);
        }
        app.refresh();
      } catch (err) {
        toast.error(`Error: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Guardar Requisito';
      }
    });
  }

  _setupEditRequirementForm() {
    const form = document.getElementById('form-edit-requirement');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-req-id').value;
      const expectedVersion = parseInt(document.getElementById('edit-req-expected-version').value, 10) || 1;
      const title = document.getElementById('edit-req-title').value.trim();
      const description = document.getElementById('edit-req-desc').value.trim();
      const acceptanceCriteria = document.getElementById('edit-req-criteria').value.trim();

      if (!title || !description || !acceptanceCriteria) {
        toast.warning('Título, descripción y criterios de aceptación son obligatorios');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-inline"></span> Actualizando...';

      try {
        await api.updateRequirement(id, {
          title,
          description,
          acceptanceCriteria,
          expectedVersion,
        });

        toast.success('Requisito actualizado (nueva versión registrada en historial)');
        this.modalManager.close('modal-edit-requirement');

        const projectId = store.get('activeProjectId');
        if (projectId) {
          const reqRes = await api.getRequirements(projectId);
          if (reqRes.data) {
            store.set('requirements', reqRes.data);
            const updated = reqRes.data.find((r) => r.id === id);
            if (updated) store.set('activeRequirement', updated);
          }
          // Recargar casos por si alguno cambió a obsolescente
          const tcRes = await api.getProjectTestCases(projectId);
          if (tcRes.data) store.set('testCases', tcRes.data);
        }
        app.refresh();
      } catch (err) {
        toast.error(`Error al actualizar requisito: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Actualizar Requisito';
      }
    });
  }

  _setupImportForm() {
    const form = document.getElementById('form-import-requirements');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const projectId = store.get('activeProjectId');
      if (!projectId) {
        toast.warning('Seleccione un proyecto activo');
        return;
      }

      const rawText = document.getElementById('import-text-input').value.trim();
      if (!rawText) {
        toast.warning('Ingrese el texto o contenido JSON/CSV a importar');
        return;
      }

      let parsedRequirements = [];
      try {
        if (rawText.startsWith('[') || rawText.startsWith('{')) {
          const json = JSON.parse(rawText);
          const rawItems = Array.isArray(json) ? json : [json];
          for (let i = 0; i < rawItems.length; i++) {
            const item = rawItems[i];
            const title = (item.title || item.titulo || '').trim();
            const description = (item.description || item.descripcion || '').trim();
            const criteria = (item.acceptanceCriteria || item.criterios || item.criteria || '').trim();

            if (!title || !description || !criteria) {
              throw new Error(
                `Elemento JSON en índice ${i} incompleto: debe incluir 'title', 'description' y 'acceptanceCriteria' no vacíos.`
              );
            }
            parsedRequirements.push({
              code: item.code ? item.code.trim() : undefined,
              title,
              description,
              acceptanceCriteria: criteria,
            });
          }
        } else {
          // Parsing CSV robusto
          const rows = parseCSVText(rawText);
          if (rows.length === 0) {
            throw new Error('El archivo CSV está vacío.');
          }

          const firstRow = rows[0].map((c) => c.toLowerCase());
          const hasHeader =
            firstRow.includes('title') ||
            firstRow.includes('titulo') ||
            firstRow.includes('description') ||
            firstRow.includes('código') ||
            firstRow.includes('code');

          const startIndex = hasHeader ? 1 : 0;

          let titleCol = 0;
          let descCol = 1;
          let critCol = 2;
          let codeCol = -1;

          if (hasHeader) {
            firstRow.forEach((col, idx) => {
              if (col.includes('code') || col.includes('código')) codeCol = idx;
              else if (col.includes('title') || col.includes('título')) titleCol = idx;
              else if (col.includes('desc')) descCol = idx;
              else if (col.includes('crit') || col.includes('aceptacion') || col.includes('aceptación')) critCol = idx;
            });
          }

          for (let i = startIndex; i < rows.length; i++) {
            const row = rows[i];
            if (row.length === 0 || (row.length === 1 && !row[0])) continue;

            const title = (row[titleCol] || '').trim();
            const description = (row[descCol] || '').trim();
            const criteria = (row[critCol] || '').trim();
            const code = codeCol >= 0 && row[codeCol] ? row[codeCol].trim() : undefined;

            if (!title || !description || !criteria) {
              throw new Error(
                `Fila ${i + 1} inválida: se requieren título, descripción y criterios de aceptación válidos (sin inventar datos).`
              );
            }

            parsedRequirements.push({
              code,
              title,
              description,
              acceptanceCriteria: criteria,
            });
          }
        }
      } catch (err) {
        toast.error(`Error de formato en la importación: ${err.message}`);
        return;
      }

      if (parsedRequirements.length === 0) {
        toast.warning('No se identificaron requisitos válidos en el contenido ingresado.');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-inline"></span> Importando...';

      try {
        const res = await api.importRequirements(projectId, parsedRequirements);
        toast.success(`Se importaron ${res.data?.count || parsedRequirements.length} requisitos con éxito.`);
        form.reset();
        this.modalManager.close('modal-import-requirements');

        const reqRes = await api.getRequirements(projectId);
        if (reqRes.data) {
          store.set('requirements', reqRes.data);
          if (reqRes.data.length > 0) {
            store.set('activeRequirement', reqRes.data[0]);
            store.set('activeRequirementId', reqRes.data[0].id);
          }
        }
        app.refresh();
      } catch (err) {
        toast.error(`Error de importación: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Validar e Importar';
      }
    });
  }

  populateEditRequirement(req) {
    const idInput = document.getElementById('edit-req-id');
    const versionInput = document.getElementById('edit-req-expected-version');
    const codeDisplay = document.getElementById('edit-req-code-display');
    const titleInput = document.getElementById('edit-req-title');
    const descInput = document.getElementById('edit-req-desc');
    const criteriaInput = document.getElementById('edit-req-criteria');

    if (idInput) idInput.value = req.id;
    if (versionInput) versionInput.value = req.version || 1;
    if (codeDisplay) codeDisplay.value = req.code;
    if (titleInput) titleInput.value = req.title || '';
    if (descInput) descInput.value = req.description || '';
    if (criteriaInput) criteriaInput.value = req.acceptanceCriteria || '';

    this.modalManager.open('modal-edit-requirement');
  }
}

// Helper para parsear CSV respetando comillas, comas y saltos de línea
function parseCSVText(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' || char === "'") {
      if (inQuotes && nextChar === char) {
        currentVal += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal);
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (currentVal || currentRow.length > 0) {
        currentRow.push(currentVal);
        rows.push(currentRow);
        currentRow = [];
        currentVal = '';
      }
      if (char === '\r' && nextChar === '\n') i++;
    } else {
      currentVal += char;
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal);
    rows.push(currentRow);
  }
  return rows;
}
