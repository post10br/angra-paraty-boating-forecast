import { formatClock, formatDir, weatherLabel } from '../lib/format.js';
import { scoreHour } from '../lib/crossing.js';

export function renderHourly(root, crossingHours, label = 'Detailed 1-day (mid-crossing)') {
  // Prefer 3-hourly for readability on phone, but show 24–30h span
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
      <h2>${label}</h2>
      <p class="muted">Mid-crossing / exposed point · wind kn · swell m / period s · every ${step} h</p>
      ${windows.length ? `<p class="callout ok">Crossing-friendly hours highlighted. Prefer daylight legs.</p>` : `<p class="callout warn">Few calm hours — consider waiting or hugging the sheltered island lee.</p>`}
      <div class="table-wrap">
        <table class="forecast-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Wx</th>
              <th>Wind</th>
              <th>Gust</th>
              <th>Dir</th>
              <th>Swell</th>
              <th>Per</th>
              <th>Swell dir</th>
              <th>Rain%</th>
              <th>Vis</th>
              <th>Cross</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((h) => {
                const s = scoreHour(h);
                const good = s.score <= 1 ? 'row-good' : s.score >= 3 ? 'row-bad' : s.score === 2 ? 'row-warn' : '';
                const vis =
                  h.visibility != null ? (h.visibility >= 10000 ? '>10 km' : `${Math.round(h.visibility / 1000)} km`) : '—';
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
                  <td><span class="mini-pill ${s.label.replace(/\s/g, '-')}">${s.label}</span></td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}
