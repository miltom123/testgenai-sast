// ==========================================================================
// Skeleton Loaders - Modern Shimmer States
// ==========================================================================

export class SkeletonManager {
  static cards(count = 3) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-card">
          <div class="skeleton skeleton-title" style="width: 45%;"></div>
          <div class="skeleton skeleton-text" style="width: 90%;"></div>
          <div class="skeleton skeleton-text" style="width: 75%;"></div>
          <div style="display:flex; gap:10px; margin-top:12px;">
            <div class="skeleton" style="width:60px; height:22px; border-radius:12px;"></div>
            <div class="skeleton" style="width:80px; height:22px; border-radius:12px;"></div>
          </div>
        </div>
      `;
    }
    return html;
  }

  static rows(count = 5) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <tr class="skeleton-row">
          <td style="padding:14px;"><div class="skeleton" style="width:60px; height:18px;"></div></td>
          <td style="padding:14px;"><div class="skeleton" style="width:140px; height:18px;"></div></td>
          <td style="padding:14px;"><div class="skeleton" style="width:80px; height:18px; border-radius:10px;"></div></td>
          <td style="padding:14px;"><div class="skeleton" style="width:90px; height:18px; border-radius:10px;"></div></td>
          <td style="padding:14px;"><div class="skeleton" style="width:180px; height:18px;"></div></td>
          <td style="padding:14px;"><div class="skeleton" style="width:70px; height:24px; border-radius:6px;"></div></td>
        </tr>
      `;
    }
    return html;
  }

  static detail() {
    return `
      <div class="card" style="padding:24px;">
        <div class="skeleton skeleton-title" style="width:50%; height:28px;"></div>
        <div class="skeleton skeleton-text" style="width:95%; height:16px;"></div>
        <div class="skeleton skeleton-text" style="width:85%; height:16px;"></div>
        <div class="skeleton skeleton-text" style="width:60%; height:16px; margin-bottom:24px;"></div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div class="skeleton" style="height:120px; border-radius:var(--radius-md);"></div>
          <div class="skeleton" style="height:120px; border-radius:var(--radius-md);"></div>
        </div>
      </div>
    `;
  }
}
