// ==========================================================================
// Visor de Diferencias Visuales (Diff Viewer) (Mejora #23)
// ==========================================================================

export class DiffViewer {
  /**
   * Calcula diferencias a nivel de palabras entre dos textos.
   * @param {string} original - Texto original (base)
   * @param {string} modified - Texto modificado (nuevo)
   * @returns {string} HTML con etiquetas <ins> y <del>
   */
  static computeWordDiff(original = '', modified = '') {
    const origWords = (original || '').split(/(\s+)/);
    const modWords = (modified || '').split(/(\s+)/);

    let html = '';
    const maxLen = Math.max(origWords.length, modWords.length);

    for (let i = 0; i < maxLen; i++) {
      const wOrig = origWords[i];
      const wMod = modWords[i];

      if (i >= origWords.length) {
        // Palabra agregada
        html += `<ins class="diff-add">${this._escape(wMod)}</ins>`;
      } else if (i >= modWords.length) {
        // Palabra eliminada
        html += `<del class="diff-del">${this._escape(wOrig)}</del>`;
      } else if (wOrig === wMod) {
        // Palabra sin cambios
        html += this._escape(wOrig);
      } else {
        // Reemplazo
        html += `<del class="diff-del">${this._escape(wOrig)}</del><ins class="diff-add">${this._escape(wMod)}</ins>`;
      }
    }

    return html;
  }

  /**
   * Abre un modal visual de comparación lado a lado o unificado.
   */
  static showModal({ title = 'Comparador de Diferencias', originalLabel = 'Generado Original', modifiedLabel = 'Versión Editada', originalText, modifiedText }) {
    let modal = document.getElementById('modal-diff-viewer');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-diff-viewer';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    const diffHtml = this.computeWordDiff(originalText, modifiedText);

    modal.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <div class="modal-title-box">
            <span class="modal-badge-diff">DIFF 360°</span>
            <h3 class="modal-title">${this._escape(title)}</h3>
          </div>
          <button type="button" class="btn-modal-close" id="btn-diff-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="diff-legends">
            <span class="legend-del"><span class="legend-color-box del"></span> ${this._escape(originalLabel)} (Eliminado)</span>
            <span class="legend-add"><span class="legend-color-box add"></span> ${this._escape(modifiedLabel)} (Agregado)</span>
          </div>

          <div class="diff-split-container">
            <div class="diff-panel">
              <div class="diff-panel-title">${this._escape(originalLabel)}</div>
              <pre class="diff-content diff-content-original">${this._escape(originalText)}</pre>
            </div>
            <div class="diff-panel">
              <div class="diff-panel-title">${this._escape(modifiedLabel)}</div>
              <pre class="diff-content diff-content-modified">${this._escape(modifiedText)}</pre>
            </div>
          </div>

          <div class="diff-unified-box">
            <div class="diff-panel-title">Vista Unificada de Cambios:</div>
            <div class="diff-unified-content">${diffHtml}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="btn-diff-ok">Cerrar Visor</button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';

    const closeModal = () => {
      modal.style.display = 'none';
    };
    modal.querySelector('#btn-diff-close')?.addEventListener('click', closeModal);
    modal.querySelector('#btn-diff-ok')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  static _escape(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
