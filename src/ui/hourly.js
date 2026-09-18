import { formatClock, formatDir, weatherLabel } from '../lib/format.js';
import { scoreHour } from '../lib/crossing.js';
import { crossingLabel, t } from '../lib/i18n.js';

export function renderHourly(root, crossingHours) {
  const next30 = crossingHours.slice(0, 30);
  const step = next30.length > 18 ? 3 : 1;
  const rows = next30.filter((_, i) => i % step === 0);

  const windows = [];
  for (const h of next30) {
    const s = scoreHour(h);
    if (s.score <= 1) windows.push(h.time);
  }

  root.innerHTML = `
    <section class="card">
      <h2>${t('hourly.title')}</h2>
      <p class="muted">${t('hourly.subtitle', { step })}</p>
      ${
        windows.length
          ? `<p class="callout ok">${t('hourly.goodWindows')}</p>`
          : `<p class="callout warn">${t('hourly.fewCalm')}</p>`
      }
      <div class="table-wrap">
        <table class="forecast-table">
          <thead>
            <tr>
              <th>${t('hourly.th.time')}</th>
              <th>${t('hourly.th.wx')}</th>
              <th>${t('hourly.th.wind')}</th>
              <th>${t('hourly.th.gust')}</th>
              <th>${t('hourly.th.dir')}</th>
              <th>${t('hourly.th.swell')}</th>
              <th>${t('hourly.th.per')}</th>
              <th>${t('hourly.th.swellDir')}</th>
              <th>${t('hourly.th.rain')}</th>
              <th>${t('hourly.th.vis')}</th>
              <th>${t('hourly.th.cross')}</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((h) => {
                const s = scoreHour(h);
                const good =
                  s.score <= 1 ? 'row-good' : s.score >= 3 ? 'row-bad' : s.score === 2 ? 'row-warn' : '';
                const vis =
                  h.visibility != null
                    ? h.visibility >= 10000
                      ? '>10 km'
                      : `${Math.round(h.visibility / 1000)} km`
                    : '—';
                return `<tr class="${good}">
                  <td>${formatClock(h.time)}</td>
                  <td>${weatherLabel(h.weatherCode)}</td>
                  <td>${h.windKn != null ? Math.round(h.windKn) : '—'}</td>
                  <td>${h.gustKn != null ? Math.round(h.gustKn) : '—'}</td>
                  <td>${formatDir(h.windDir)}</td>
                  <td>${(h.swellM ?? h.waveM) != null ? Number(h.swellM ?? h.waveM).toFixed(1) : '—'}</td>
                  <td>${(h.swellPeriod ?? h.wavePeriod) != null ? Math.round(h.swellPeriod ?? h.wavePeriod) : '—'}</td>
                  <td>${formatDir(h.swellDir ?? h.waveDir)}</td>
                  <td>${h.precipProb != null ? h.precipProb : '—'}</td>
                  <td>${vis}</td>
                  <td><span class="mini-pill ${s.label.replace(/\s/g, '-')}">${crossingLabel(s.label)}</span></td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}
