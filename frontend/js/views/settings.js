// ==========================================================================
// Settings View - TestGenAI (MVP Real)
// Configuración básica, estado del motor PostgreSQL, proveedores de IA
// y administración de usuarios exclusiva para rol ADMIN
// ==========================================================================

import { store } from '../state.js';
import { api } from '../api.js';
import { toast } from '../toast.js';

export async function renderSettings(container) {
  const user = store.get('user');
  const isAdmin = user?.role === 'ADMIN';

  // Cargar estado de base de datos y proveedores de IA
  let dbInfo = { engine: 'PostgreSQL', counts: { users: 0, projects: 0, requirements: 0, testCases: 0 } };
  let aiConfig = { providers: {} };

  try {
    const [dbRes, aiRes] = await Promise.all([api.getDbHealth(), api.getAiConfig()]);
    if (dbRes) dbInfo = dbRes;
    if (aiRes?.data) aiConfig = aiRes.data;
  } catch (e) {
    console.warn('Error obteniendo estado de configuración:', e);
  }

  const geminiAvailable = aiConfig.providers?.gemini?.available;
  const openaiAvailable = aiConfig.providers?.openai?.available;

  container.innerHTML = `
    <div style="margin-bottom:24px;">
      <h2 style="font-size:1.35rem; font-weight:700;">Ajustes del Sistema</h2>
      <p style="font-size:0.84rem; color:var(--text-secondary);">
        Parámetros operativos, estado del backend PostgreSQL y proveedores de IA configurados.
      </p>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap:24px; margin-bottom:24px;">
      <!-- Estado de la Base de Datos -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
            Motor de Base de Datos
          </div>
          <span class="badge badge-approved">${escapeHtml(dbInfo.engine || 'PostgreSQL')}</span>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:14px;">
          <div style="background:rgba(0,0,0,0.25); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Usuarios</div>
            <div style="font-size:1.2rem; font-weight:700; color:#fff;">${dbInfo.counts?.users ?? 0}</div>
          </div>
          <div style="background:rgba(0,0,0,0.25); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Proyectos</div>
            <div style="font-size:1.2rem; font-weight:700; color:#fff;">${dbInfo.counts?.projects ?? 0}</div>
          </div>
          <div style="background:rgba(0,0,0,0.25); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Requisitos</div>
            <div style="font-size:1.2rem; font-weight:700; color:#fff;">${dbInfo.counts?.requirements ?? 0}</div>
          </div>
          <div style="background:rgba(0,0,0,0.25); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Casos de Prueba</div>
            <div style="font-size:1.2rem; font-weight:700; color:var(--cyan);">${dbInfo.counts?.testCases ?? 0}</div>
          </div>
        </div>

        <div style="font-size:0.78rem; color:var(--text-muted);">
          URL de conexión: <code>${escapeHtml(dbInfo.databaseUrl || 'postgresql://...')}</code>
        </div>
      </div>

      <!-- Estado de Proveedores de IA -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            Proveedores de IA en Servidor
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px;">
          <!-- Gemini -->
          <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:rgba(0,0,0,0.2); border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
            <div>
              <div style="font-weight:700; font-size:0.9rem;">Google Gemini</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Variable: <code>GEMINI_API_KEY</code></div>
            </div>
            <span class="badge ${geminiAvailable ? 'badge-approved' : 'badge-danger'}">
              ${geminiAvailable ? '✓ Disponible' : '✕ No configurado'}
            </span>
          </div>

          <!-- OpenAI -->
          <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:rgba(0,0,0,0.2); border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
            <div>
              <div style="font-weight:700; font-size:0.9rem;">OpenAI</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Variable: <code>OPENAI_API_KEY</code></div>
            </div>
            <span class="badge ${openaiAvailable ? 'badge-approved' : 'badge-danger'}">
              ${openaiAvailable ? '✓ Disponible' : '✕ No configurado'}
            </span>
          </div>
        </div>

        <div style="margin-top:14px; font-size:0.78rem; color:var(--text-muted); line-height:1.5;">
          ℹ️ Las API keys se leen exclusivamente desde las variables de entorno del servidor y nunca se exponen al cliente.
        </div>
      </div>
    </div>

    <!-- Panel de Administración de Usuarios (Exclusivo para ADMIN) -->
    ${
      isAdmin
        ? `
      <div class="card" id="admin-users-panel">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Gestión de Usuarios (Panel de Administrador)
          </div>
          <button class="btn btn-sm btn-secondary" id="btn-refresh-users">Actualizar Lista</button>
        </div>

        <div id="users-table-container">
          <span class="spinner-inline"></span> Cargando usuarios...
        </div>
      </div>
    `
        : ''
    }
  `;

  if (isAdmin) {
    loadUsersTable(container);
    container.querySelector('#btn-refresh-users')?.addEventListener('click', () => {
      loadUsersTable(container);
    });
  }
}

async function loadUsersTable(container) {
  const tableContainer = container.querySelector('#users-table-container');
  if (!tableContainer) return;

  try {
    const res = await api.getUsers();
    const users = res.data || [];

    if (users.length === 0) {
      tableContainer.innerHTML = '<p style="color:var(--text-muted);">Sin usuarios encontrados.</p>';
      return;
    }

    tableContainer.innerHTML = `
      <div class="table-responsive" style="margin-top:12px;">
        <table class="table">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Correo Electrónico</th>
              <th>Rol Actual</th>
              <th>Estado</th>
              <th>Fecha de Registro</th>
              <th style="text-align:right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${users
              .map(
                (u) => `
              <tr>
                <td style="font-weight:600;">${escapeHtml(u.fullName || 'Sin nombre')}</td>
                <td>${escapeHtml(u.email)}</td>
                <td>
                  <select class="form-select user-role-select" data-user-id="${u.id}" style="padding:4px 8px; font-size:0.8rem; width:130px;">
                    <option value="QA_TESTER" ${u.role === 'QA_TESTER' ? 'selected' : ''}>QA_TESTER</option>
                    <option value="QA_LEAD" ${u.role === 'QA_LEAD' ? 'selected' : ''}>QA_LEAD</option>
                    <option value="DEVELOPER" ${u.role === 'DEVELOPER' ? 'selected' : ''}>DEVELOPER</option>
                    <option value="ADMIN" ${u.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
                  </select>
                </td>
                <td>
                  <span class="badge ${u.status === 'ACTIVE' ? 'badge-approved' : 'badge-danger'}">
                    ${u.status}
                  </span>
                </td>
                <td style="font-size:0.8rem; color:var(--text-muted);">
                  ${new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td style="text-align:right;">
                  <button class="btn btn-sm ${u.status === 'ACTIVE' ? 'btn-outline' : 'btn-success'} btn-toggle-user-status" data-user-id="${u.id}" data-current-status="${u.status}" style="font-size:0.75rem;">
                    ${u.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    // Role change listener
    tableContainer.querySelectorAll('.user-role-select').forEach((select) => {
      select.addEventListener('change', async () => {
        const userId = select.getAttribute('data-user-id');
        const newRole = select.value;
        try {
          await api.updateUserRoleOrStatus(userId, { role: newRole });
          toast.success(`Rol actualizado a ${newRole}`);
        } catch (err) {
          toast.error(err.message || 'Error al cambiar rol');
          loadUsersTable(container);
        }
      });
    });

    // Toggle status listener
    tableContainer.querySelectorAll('.btn-toggle-user-status').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const userId = btn.getAttribute('data-user-id');
        const currentStatus = btn.getAttribute('data-current-status');
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

        if (newStatus === 'INACTIVE' && !confirm('¿Está seguro de desactivar esta cuenta?')) {
          return;
        }

        try {
          await api.updateUserRoleOrStatus(userId, { status: newStatus });
          toast.success(`Estado de usuario cambiado a ${newStatus}`);
          loadUsersTable(container);
        } catch (err) {
          toast.error(err.message || 'Error al cambiar estado');
        }
      });
    });
  } catch (err) {
    tableContainer.innerHTML = `<div style="color:var(--error);">Error al cargar usuarios: ${escapeHtml(err.message)}</div>`;
  }
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
