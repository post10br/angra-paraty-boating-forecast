import './style.css';
import { REFRESH_MS } from './data/locations.js';
import { fetchAllForecasts, sliceNextHours } from './lib/openmeteo.js';
import { fetchMarinhaAlerts } from './lib/marinha.js';
import { summarizeCrossing } from './lib/crossing.js';
import { nowIsoBRT } from './lib/format.js';
import { renderAlertsBanner } from './ui/alerts.js';
import { renderSummary } from './ui/summary.js';
import { initMap, updateMap, renderAnchorageList } from './ui/map.js';
import { renderHourly } from './ui/hourly.js';
import { renderWeekly, renderOutlook } from './ui/weekly.js';

const app = document.querySelector('#app');

app.innerHTML = `
  <header class="site-header">
    <div class="brand">
      <p class="eyebrow">Costa Verde · Ilha Grande Bay · RJ</p>
      <h1>Angra dos Reis ↔ Paraty</h1>
      <p class="tagline">Recreational coastal boating forecast — wind, swell &amp; shelter</p>
    </div>
    <div class="header-meta">
      <span id="last-updated">Loading…</span>
      <button type="button" id="btn-refresh" class="btn">Refresh</button>
    </div>
  </header>

  <div id="alerts-root"></div>

  <main class="layout">
    <div id="summary-root"></div>

    <section class="card map-card">
      <div class="map-head">
        <h2>Interactive map</h2>
        <p class="muted">Wind barbs at sample points · anchorage pins scored for next 1–2 days</p>
      </div>
      <div id="map" class="map" role="img" aria-label="Map of Angra to Paraty corridor"></div>
      <div id="anchorage-root"></div>
    </section>

    <div id="hourly-root"></div>
    <div id="weekly-root"></div>
    <div id="outlook-root"></div>
  </main>

  <footer class="site-footer">
    <p>Weather &amp; marine: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>
      (no API key). Alerts: try <a href="https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo" target="_blank" rel="noopener">Marinha CHM Avisos de Mau Tempo</a> (METAREA V).
      Not official navigation advice — always check Marinha / Capitanias before casting off.</p>
    <p class="muted tiny">Auto-refresh ~1 h · Times in America/Sao_Paulo (BRT)</p>
  </footer>
`;

const els = {
  alerts: document.getElementById('alerts-root'),
  summary: document.getElementById('summary-root'),
  map: document.getElementById('map'),
  anchorage: document.getElementById('anchorage-root'),
  hourly: document.getElementById('hourly-root'),
  weekly: document.getElementById('weekly-root'),
  outlook: document.getElementById('outlook-root'),
  updated: document.getElementById('last-updated'),
  refresh: document.getElementById('btn-refresh'),
};

initMap(els.map);

let refreshTimer;

async function load() {
  els.updated.textContent = 'Updating…';
  els.refresh.disabled = true;

  const alertsPromise = fetchMarinhaAlerts().catch((err) => ({
    status: 'error',
    checkedAt: new Date().toISOString(),
    alerts: [],
    sourceUrl: 'https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo',
    message: 'No active Marinha alerts for this area',
    detail: err.message,
  }));

  try {
    const [forecast, alerts] = await Promise.all([fetchAllForecasts(), alertsPromise]);

    renderAlertsBanner(els.alerts, alerts);

    const crossingPt = forecast.points.crossing;
    const hours48 = sliceNextHours(crossingPt.hourly, 48);
    const crossing = summarizeCrossing(hours48);

    renderSummary(els.summary, {
      crossing,
      crossingPoint: crossingPt,
      hours48,
      fetchedAt: forecast.fetchedAt,
    });

    const scored = updateMap(forecast, true);
    renderAnchorageList(els.anchorage, scored);

    renderHourly(els.hourly, hours48);
    renderWeekly(els.weekly, crossingPt.daily);
    renderOutlook(els.outlook, crossingPt.daily);

    els.updated.textContent = `Last updated ${nowIsoBRT()}`;
  } catch (err) {
    console.error(err);
    els.summary.innerHTML = `
      <section class="card error-card">
        <h2>Could not load forecast</h2>
        <p>${String(err.message || err)}</p>
        <p class="muted">Open-Meteo may be rate-limiting this network. Try Refresh in a minute.</p>
      </section>`;
    els.updated.textContent = `Update failed · ${nowIsoBRT()}`;
  } finally {
    els.refresh.disabled = false;
  }
}

els.refresh.addEventListener('click', () => load());

load();
refreshTimer = setInterval(load, REFRESH_MS);

// Visibility-aware refresh
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') load();
});
