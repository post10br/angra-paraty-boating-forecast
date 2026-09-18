import { formatTime } from '../lib/format.js';
import { severityLabel, t } from '../lib/i18n.js';

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
          <strong>${t('alerts.activeTitle')}</strong>
          <span class="muted">${t('alerts.checked', { time: checked })}</span>
        </div>
        <ul class="alerts-list">
          ${data.alerts
            .map(
              (a) => `
            <li class="${SEV_CLASS[a.severity] || 'sev-info'}">
              <span class="sev-pill">${severityLabel(a.severity)}</span>
              <div>
                <div class="alert-title">${escapeHtml(a.title)}</div>
                <p>${escapeHtml(a.summary)}</p>
                <a href="${a.link}" target="_blank" rel="noopener">${t('alerts.official')}</a>
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
        <strong>${t('alerts.quietTitle')}</strong>
        <span class="muted">${t('alerts.lastCheck', { time: checked })}</span>
      </div>
      <p class="quiet-msg">${t('alerts.none')}
        <a href="${data.sourceUrl}" target="_blank" rel="noopener">${t('alerts.verify')}</a>
      </p>
      ${
        data.detail
          ? `<p class="muted tiny">${t('alerts.fetchNote', { detail: escapeHtml(data.detail) })}</p>`
          : ''
      }
    </div>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
