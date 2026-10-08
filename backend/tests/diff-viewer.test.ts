import { describe, it, expect } from 'vitest';
// @ts-expect-error Módulo JavaScript del frontend sin archivo de declaraciones.
import { DiffViewer } from '../../frontend/js/views/diff-viewer.js';

describe('Visor de diferencias', () => {
  it('representa palabras agregadas y eliminadas con longitudes distintas', () => {
    expect(DiffViewer.computeWordDiff('hola','hola mundo')).toContain('<ins class="diff-add">mundo</ins>');
    expect(DiffViewer.computeWordDiff('hola mundo','hola')).toContain('<del class="diff-del">mundo</del>');
  });
  it('escapa contenido HTML antes de mostrar diferencias', () => {
    expect(DiffViewer.computeWordDiff('<script>','<script>')).toBe('&lt;script&gt;');
  });
});
