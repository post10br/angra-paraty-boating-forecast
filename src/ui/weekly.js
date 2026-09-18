import { formatDay, formatDir, weatherLabel } from '../lib/format.js';
import { scoreHour } from '../lib/crossing.js';
import { crossingLabel, t } from '../lib/i18n.js';

const LABEL_KEYS = ['pleasant', 'lumpy', 'uncomfortable', 'not recommended'];

export function renderWeekly(root, daily) {
  const week = (daily || []).slice(0, 7);
  root.innerHTML = `
    <section class="card">
      <h2>${t('weekly.title')}</h2>
      <p class="muted">${t('weekly.subtitle')}</p>
      <div class="week-grid">
        ${week
          .map((d) => {
            const midHours = d.hours?.slice(6, 18) || d.hours || [];
            const scores = midHours.map((h) => scoreHour(h).score);
            const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 1;
            const labelKey = LABEL_KEYS[Math.min(3, Math.round(avg))];
            return `
            <article class="day-card ${labelKey.replace(/\s/g, '-')}">
              <h3>${formatDay(d.date)}</h3>
              <p class="wx">${weatherLabel(d.weatherCode)}</p>
              <dl>
                <div><dt>${t('weekly.windMax')}</dt><dd>${d.windMaxKn != null ? Math.round(d.windMaxKn) : '—'} kn
                  ${d.gustMaxKn != null ? `(g ${Math.round(d.gustMaxKn)})` : ''}</dd></div>
                <div><dt>${t('weekly.dir')}</dt><dd>${formatDir(d.windDir)}</dd></div>
                <div><dt>${t('weekly.swell')}</dt><dd>${d.swellMaxM != null ? d.swellMaxM.toFixed(1) : '—'} m
                  · ${d.swellPeriodAvg != null ? Math.round(d.swellPeriodAvg) + ' s' : '—'}</dd></div>
                <div><dt>${t('weekly.swellDir')}</dt><dd>${formatDir(d.swellDir)}</dd></div>
                <div><dt>${t('weekly.rain')}</dt><dd>${d.precipProbMax != null ? d.precipProbMax + '%' : '—'}
                  ${d.precipSum != null ? `· ${d.precipSum.toFixed(1)} mm` : ''}</dd></div>
              </dl>
              <p class="day-cross">${t('weekly.crossing', { label: `<strong>${crossingLabel(labelKey)}</strong>` })}</p>
            </article>`;
          })
          .join('')}
      </div>
    </section>`;
}

export function renderOutlook(root, daily) {
  const days = (daily || []).slice(7, 16);
  if (!days.length) {
    root.innerHTML = `<section class="card"><h2>${t('outlook.title')}</h2><p class="muted">${t('outlook.empty')}</p></section>`;
    return;
  }
  root.innerHTML = `
    <section class="card">
      <h2>${t('outlook.title')}</h2>
      <p class="muted">${t('outlook.subtitle')}</p>
      <div class="table-wrap">
        <table class="forecast-table outlook-table">
          <thead>
            <tr>
              <th>${t('outlook.th.day')}</th>
              <th>${t('outlook.th.weather')}</th>
              <th>${t('outlook.th.windMax')}</th>
              <th>${t('outlook.th.dir')}</th>
              <th>${t('outlook.th.swellMax')}</th>
              <th>${t('outlook.th.period')}</th>
              <th>${t('outlook.th.rain')}</th>
              <th>${t('outlook.th.lean')}</th>
            </tr>
          </thead>
          <tbody>
            ${days
              .map((d) => {
                const mid = d.hours?.slice(6, 18) || [];
                const avg = mid.length
                  ? mid.reduce((a, h) => a + scoreHour(h).score, 0) / mid.length
                  : 1;
                const labelKey = LABEL_KEYS[Math.min(3, Math.round(avg))];
                return `<tr>
                  <td>${formatDay(d.date)}</td>
                  <td>${weatherLabel(d.weatherCode)}</td>
                  <td>${d.windMaxKn != null ? Math.round(d.windMaxKn) + ' kn' : '—'}</td>
                  <td>${formatDir(d.windDir)}</td>
                  <td>${d.swellMaxM != null ? d.swellMaxM.toFixed(1) + ' m' : '—'}</td>
                  <td>${d.swellPeriodAvg != null ? Math.round(d.swellPeriodAvg) + ' s' : '—'}</td>
                  <td>${d.precipProbMax != null ? d.precipProbMax : '—'}</td>
                  <td>${crossingLabel(labelKey)}</td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}
