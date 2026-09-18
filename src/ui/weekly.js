import { formatDay, formatDir, weatherLabel } from '../lib/format.js';
import { scoreHour } from '../lib/crossing.js';

export function renderWeekly(root, daily) {
  const week = (daily || []).slice(0, 7);
  root.innerHTML = `
    <section class="card">
      <h2>1-week marine summary</h2>
      <p class="muted">Day-by-day at the exposed mid-crossing point</p>
      <div class="week-grid">
        ${week
          .map((d) => {
            const midHours = d.hours?.slice(6, 18) || d.hours || [];
            const scores = midHours.map((h) => scoreHour(h).score);
            const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 1;
            const label = ['pleasant', 'lumpy', 'uncomfortable', 'not recommended'][Math.min(3, Math.round(avg))];
            return `
            <article class="day-card ${label.replace(/\s/g, '-')}">
              <h3>${formatDay(d.date)}</h3>
              <p class="wx">${weatherLabel(d.weatherCode)}</p>
              <dl>
                <div><dt>Wind max</dt><dd>${d.windMaxKn != null ? Math.round(d.windMaxKn) : '—'} kn
                  ${d.gustMaxKn != null ? `(g ${Math.round(d.gustMaxKn)})` : ''}</dd></div>
                <div><dt>Dir</dt><dd>${formatDir(d.windDir)}</dd></div>
                <div><dt>Swell</dt><dd>${d.swellMaxM != null ? d.swellMaxM.toFixed(1) : '—'} m
                  · ${d.swellPeriodAvg != null ? Math.round(d.swellPeriodAvg) + ' s' : '—'}</dd></div>
                <div><dt>Swell dir</dt><dd>${formatDir(d.swellDir)}</dd></div>
                <div><dt>Rain</dt><dd>${d.precipProbMax != null ? d.precipProbMax + '%' : '—'}
                  ${d.precipSum != null ? `· ${d.precipSum.toFixed(1)} mm` : ''}</dd></div>
              </dl>
              <p class="day-cross">Crossing: <strong>${label}</strong></p>
            </article>`;
          })
          .join('')}
      </div>
    </section>`;
}

export function renderOutlook(root, daily) {
  const days = (daily || []).slice(7, 16);
  if (!days.length) {
    root.innerHTML = `<section class="card"><h2>2-week outlook</h2><p class="muted">Extended days unavailable.</p></section>`;
    return;
  }
  root.innerHTML = `
    <section class="card">
      <h2>2-week outlook</h2>
      <p class="muted">Coarser marine trend (days 8–16) · confidence drops with range</p>
      <div class="table-wrap">
        <table class="forecast-table outlook-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Weather</th>
              <th>Wind max</th>
              <th>Dir</th>
              <th>Swell max</th>
              <th>Period</th>
              <th>Rain%</th>
              <th>Crossing lean</th>
            </tr>
          </thead>
          <tbody>
            ${days
              .map((d) => {
                const mid = d.hours?.slice(6, 18) || [];
                const avg = mid.length
                  ? mid.reduce((a, h) => a + scoreHour(h).score, 0) / mid.length
                  : 1;
                const label = ['pleasant', 'lumpy', 'uncomfortable', 'not recommended'][
                  Math.min(3, Math.round(avg))
                ];
                return `<tr>
                  <td>${formatDay(d.date)}</td>
                  <td>${weatherLabel(d.weatherCode)}</td>
                  <td>${d.windMaxKn != null ? Math.round(d.windMaxKn) + ' kn' : '—'}</td>
                  <td>${formatDir(d.windDir)}</td>
                  <td>${d.swellMaxM != null ? d.swellMaxM.toFixed(1) + ' m' : '—'}</td>
                  <td>${d.swellPeriodAvg != null ? Math.round(d.swellPeriodAvg) + ' s' : '—'}</td>
                  <td>${d.precipProbMax != null ? d.precipProbMax : '—'}</td>
                  <td>${label}</td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}
