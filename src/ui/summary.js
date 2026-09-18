import { formatWind, formatWave, formatClock, formatTime } from '../lib/format.js';
import { crossingLabel, pointDisplayName, t } from '../lib/i18n.js';

export function renderSummary(root, { crossing, crossingPoint, hours48, fetchedAt }) {
  const labelKey = crossing.label;
  const label = crossingLabel(labelKey);
  const labelClass = {
    pleasant: 'ok',
    lumpy: 'warn',
    uncomfortable: 'bad',
    'not recommended': 'danger',
    unknown: 'muted',
  }[labelKey] || 'muted';

  const sample = hours48.slice(0, 24);
  const maxWind = Math.max(...sample.map((h) => h.gustKn ?? h.windKn ?? 0));
  const maxSwell = Math.max(...sample.map((h) => h.swellM ?? h.waveM ?? 0));
  const avgPeriod =
    sample.reduce((a, h) => a + (h.swellPeriod ?? h.wavePeriod ?? 0), 0) /
    Math.max(1, sample.filter((h) => (h.swellPeriod ?? h.wavePeriod) != null).length);

  const windows = crossing.bestWindows.slice(0, 3);
  const windowText = windows.length
    ? windows.map((w) => `${formatClock(w.start)}–${formatClock(w.end)}`).join(', ')
    : t('summary.noWindow');

  const sentences = [
    t('summary.sentence1', { cls: labelClass, label }),
    t('summary.sentence2', {
      name: pointDisplayName(crossingPoint),
      gust: Math.round(maxWind),
      swell: maxSwell.toFixed(1),
      period: Math.round(avgPeriod) || '—',
    }),
    t('summary.sentence3', { windows: windowText }),
  ];

  root.innerHTML = `
    <section class="card summary-card">
      <h2>${t('summary.title')}</h2>
      <p class="lede">${sentences.join(' ')}</p>
      <div class="summary-chips">
        <span class="chip ${labelClass}">${t('summary.chipCrossing', { label })}</span>
        <span class="chip">${t('summary.chipWind', {
          wind: formatWind(sample[0]?.windKn, sample[0]?.gustKn),
        })}</span>
        <span class="chip">${t('summary.chipSwell', {
          swell: formatWave(
            sample[0]?.swellM ?? sample[0]?.waveM,
            sample[0]?.swellPeriod ?? sample[0]?.wavePeriod,
            sample[0]?.swellDir ?? sample[0]?.waveDir,
          ),
        })}</span>
      </div>
      <p class="muted tiny">${t('summary.updated', { time: formatTime(fetchedAt) })}</p>
    </section>`;
}
