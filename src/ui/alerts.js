import { formatTime } from '../lib/format.js';

const SEV_CLASS = {
  extreme: 'sev-extreme',
  severe: 'sev-severe',
  moderate: 'sev-moderate',
  info: 'sev-info',
};

export function renderAlertsBanner(root, data) {
  const checked = formatTime(data.checkedAt);
  if (data.status === 'ok' && data.alerts.length) {
    root.innerHTML = `
      <div class="alerts-banner active" role="status">
        <div class="alerts-banner__head">
          <strong>Marinha do Brasil — Avisos de Mau Tempo</strong>
          <span class="muted">Checked ${checked}</span>
        </div>
        <ul class="alerts-list">
          ${data.alerts
            .map(
              (a) => `
            <li class="${SEV_CLASS[a.severity] || 'sev-info'}">
              <span class="sev-pill">${a.severity}</span>
              <div>
                <div class="alert-title">${escapeHtml(a.title)}</div>
                <p>${escapeHtml(a.summary)}</p>
                <a href="${a.link}" target="_blank" rel="noopener">Official aviso ↗</a>
              </div>
            </li>`
            )
            .join('')}
        </ul>
      </div>`;
    return;
  }

  root.innerHTML = `
    <div class="alerts-banner quiet" role="status">
      <div class="alerts-banner__head">
        <strong>Marinha do Brasil alerts</strong>
        <span class="muted">Last check ${checked}</span>
      </div>
      <p class="quiet-msg">No active Marinha alerts for this area
        <a href="${data.sourceUrl}" target="_blank" rel="noopener">Verify on CHM ↗</a>
      </p>
      ${data.detail ? `<p class="muted tiny">Fetch note: ${escapeHtml(data.detail)} — banner degrades gracefully when CHM blocks automated access.</p>` : ''}
    </div>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
