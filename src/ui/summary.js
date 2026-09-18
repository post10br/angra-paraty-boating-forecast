import { formatWind, formatWave, formatClock, formatTime } from '../lib/format.js';

export function renderSummary(root, { crossing, crossingPoint, hours48, fetchedAt }) {
  const label = crossing.label;
  const labelClass = {
    pleasant: 'ok',
    lumpy: 'warn',
    uncomfortable: 'bad',
    'not recommended': 'danger',
    unknown: 'muted',
  }[label] || 'muted';

  const sample = hours48.slice(0, 24);
  const maxWind = Math.max(...sample.map((h) => h.gustKn ?? h.windKn ?? 0));
  const maxSwell = Math.max(...sample.map((h) => h.swellM ?? h.waveM ?? 0));
  const avgPeriod =
    sample.reduce((a, h) => a + (h.swellPeriod ?? h.wavePeriod ?? 0), 0) /
    Math.max(1, sample.filter((h) => (h.swellPeriod ?? h.wavePeriod) != null).length);

  const windows = crossing.bestWindows.slice(0, 3);
  const windowText = windows.length
    ? windows
        .map((w) => `${formatClock(w.start)}–${formatClock(w.end)}`)
        .join(', ')
    : 'no calm window stands out';

  const sentences = [
    `Next 24–48 h on the Angra dos Reis ↔ Paraty corridor: open-water crossing looks <strong class="${labelClass}">${label}</strong> based on mid-bay wind and swell.`,
    `Exposed point (${crossingPoint.name}): peaks near ${Math.round(maxWind)} kn gusts and ${maxSwell.toFixed(1)} m seas (period ~${Math.round(avgPeriod) || '—'} s).`,
    `Better crossing windows (local time): ${windowText}. Always cross with daylight and a margin for afternoon sea breeze.`,
  ];

  root.innerHTML = `
    <section class="card summary-card">
      <h2>Crossing briefing</h2>
      <p class="lede">${sentences.join(' ')}</p>
      <div class="summary-chips">
        <span class="chip ${labelClass}">Crossing: ${label}</span>
        <span class="chip">Wind ${formatWind(sample[0]?.windKn, sample[0]?.gustKn)}</span>
        <span class="chip">Swell ${formatWave(sample[0]?.swellM ?? sample[0]?.waveM, sample[0]?.swellPeriod ?? sample[0]?.wavePeriod, sample[0]?.swellDir ?? sample[0]?.waveDir)}</span>
      </div>
      <p class="muted tiny">Updated ${formatTime(fetchedAt)} · timezone America/Sao_Paulo (BRT)</p>
    </section>`;
}
