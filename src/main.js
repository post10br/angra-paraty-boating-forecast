import './style.css';
import { REFRESH_MS } from './data/locations.js';
import { fetchAllForecasts, sliceNextHours } from './lib/openmeteo.js';
import { fetchMarinhaAlerts } from './lib/marinha.js';
import { summarizeCrossing } from './lib/crossing.js';
import { nowIsoBRT } from './lib/format.js';
import {
  applyDocumentLang,
  initI18n,
  langButtonAria,
  langButtonLabel,
  onLangChange,
  t,
  toggleLang,
} from './lib/i18n.js';
import { renderAlertsBanner } from './ui/alerts.js';
import { renderSummary } from './ui/summary.js';
import { initMap, updateMap, renderAnchorageList } from './ui/map.js';
import { renderHourly } from './ui/hourly.js';
import { renderWeekly, renderOutlook } from './ui/weekly.js';

initI18n();

const app = document.querySelector('#app');

function renderShell() {
  app.innerHTML = `
  <button type="button" id="btn-lang" class="btn-lang" aria-label="${langButtonAria()}">${langButtonLabel()}</button>

  <header class="site-header">
    <div class="brand">
      <p class="eyebrow" data-i18n="header.eyebrow">${t('header.eyebrow')}</p>
      <h1 data-i18n="header.title">${t('header.title')}</h1>
      <p class="tagline" data-i18n="header.tagline">${t('header.tagline')}</p>
    </div>
    <div class="header-meta">
      <span id="last-updated">${t('header.loading')}</span>
      <button type="button" id="btn-refresh" class="btn">${t('header.refresh')}</button>
    </div>
  </header>

  <div id="alerts-root"></div>

  <main class="layout">
    <div id="summary-root"></div>

    <section class="card map-card">
      <div class="map-head">
        <h2 data-i18n="map.title">${t('map.title')}</h2>
        <p class="muted" data-i18n="map.subtitle">${t('map.subtitle')}</p>
      </div>
      <div id="map" class="map" role="img" aria-label="${t('map.aria')}"></div>
      <div id="anchorage-root"></div>
    </section>

    <div id="hourly-root"></div>
    <div id="weekly-root"></div>
    <div id="outlook-root"></div>
  </main>

  <footer class="site-footer">
    <p data-i18n-html="footer.sources">${t('footer.sources')}</p>
    <p class="muted tiny" data-i18n="footer.meta">${t('footer.meta')}</p>
  </footer>
`;
}

renderShell();

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
  lang: document.getElementById('btn-lang'),
};

initMap(els.map);

/** Last successful payload so language switches re-render without refetch. */
let lastAlerts = null;
let lastForecast = null;
let lastCrossing = null;
let lastHours48 = null;
let lastScored = null;
let lastUpdatedKind = 'loading'; // loading | ok | error | updating

function applyStaticChrome() {
  applyDocumentLang();
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
  const mapEl = document.getElementById('map');
  if (mapEl) mapEl.setAttribute('aria-label', t('map.aria'));
  if (els.refresh) els.refresh.textContent = t('header.refresh');
  if (els.lang) {
    els.lang.textContent = langButtonLabel();
    els.lang.setAttribute('aria-label', langButtonAria());
  }
  if (lastUpdatedKind === 'ok') {
    els.updated.textContent = t('header.lastUpdated', { time: nowIsoBRT() });
  } else if (lastUpdatedKind === 'updating') {
    els.updated.textContent = t('header.updating');
  } else if (lastUpdatedKind === 'error') {
    els.updated.textContent = t('header.forecastUnavailable', { time: nowIsoBRT() });
  } else {
    els.updated.textContent = t('header.loading');
  }
}

function renderFromCache() {
  applyStaticChrome();
  if (lastAlerts) renderAlertsBanner(els.alerts, lastAlerts);

  if (lastForecast?.error) {
    els.summary.innerHTML = `
      <section class="card error-card">
        <h2>${t('summary.errorTitle')}</h2>
        <p>${t('summary.errorBody', { err: String(lastForecast.error.message || lastForecast.error) })}</p>
        <p class="muted">${t('summary.errorHint')}</p>
      </section>`;
    return;
  }

  if (!lastForecast) return;

  if (lastHours48?.length && lastCrossing) {
    renderSummary(els.summary, {
      crossing: lastCrossing,
      crossingPoint: lastForecast.points.crossing,
      hours48: lastHours48,
      fetchedAt: lastForecast.fetchedAt,
    });
  } else {
    els.summary.innerHTML = `
      <section class="card error-card">
        <h2>${t('summary.unavailableTitle')}</h2>
        <p>${t('summary.unavailableBody')}</p>
      </section>`;
  }

  if (lastScored) {
    // Rebuild map popups/list with current language
    lastScored = updateMap(lastForecast, true);
    renderAnchorageList(els.anchorage, lastScored);
  }
  if (lastHours48) renderHourly(els.hourly, lastHours48);
  const daily = lastForecast.points?.crossing?.daily || [];
  renderWeekly(els.weekly, daily);
  renderOutlook(els.outlook, daily);

  if (lastForecast.errors?.length) {
    els.summary.insertAdjacentHTML(
      'afterbegin',
      `<p class="card callout warn">${t('summary.partial')}</p>`,
    );
  }
}

async function load() {
  lastUpdatedKind = 'updating';
  els.updated.textContent = t('header.updating');
  els.refresh.disabled = true;

  const alertsPromise = fetchMarinhaAlerts().catch((err) => ({
    status: 'error',
    checkedAt: new Date().toISOString(),
    alerts: [],
    sourceUrl: 'https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo',
    message: 'No active Marinha alerts for this area',
    detail: err.message,
  }));

  const [forecastResult, alerts] = await Promise.all([
    fetchAllForecasts().catch((error) => ({ error })),
    alertsPromise,
  ]);
  lastAlerts = alerts;
  renderAlertsBanner(els.alerts, alerts);

  try {
    if (forecastResult?.error) throw forecastResult.error;
    const forecast = forecastResult;
    lastForecast = forecast;
    const crossingPt = forecast.points.crossing;
    const hours48 = sliceNextHours(crossingPt.hourly || [], 48);
    const crossing = summarizeCrossing(hours48);
    lastHours48 = hours48;
    lastCrossing = crossing;

    if (hours48.length) {
      renderSummary(els.summary, {
        crossing,
        crossingPoint: crossingPt,
        hours48,
        fetchedAt: forecast.fetchedAt,
      });
    } else {
      els.summary.innerHTML = `
        <section class="card error-card">
          <h2>${t('summary.unavailableTitle')}</h2>
          <p>${t('summary.unavailableBody')}</p>
        </section>`;
    }

    lastScored = updateMap(forecast, true);
    renderAnchorageList(els.anchorage, lastScored);
    renderHourly(els.hourly, hours48);
    renderWeekly(els.weekly, crossingPt.daily || []);
    renderOutlook(els.outlook, crossingPt.daily || []);

    if (forecast.errors?.length) {
      els.summary.insertAdjacentHTML(
        'afterbegin',
        `<p class="card callout warn">${t('summary.partial')}</p>`,
      );
    }
    lastUpdatedKind = 'ok';
    els.updated.textContent = t('header.lastUpdated', { time: nowIsoBRT() });
  } catch (err) {
    console.error(err);
    lastForecast = { error: err };
    lastHours48 = null;
    lastCrossing = null;
    lastScored = null;
    els.summary.innerHTML = `
      <section class="card error-card">
        <h2>${t('summary.errorTitle')}</h2>
        <p>${t('summary.errorBody', { err: String(err.message || err) })}</p>
        <p class="muted">${t('summary.errorHint')}</p>
      </section>`;
    lastUpdatedKind = 'error';
    els.updated.textContent = t('header.forecastUnavailable', { time: nowIsoBRT() });
  } finally {
    els.refresh.disabled = false;
  }
}

els.refresh.addEventListener('click', () => load());
els.lang.addEventListener('click', () => toggleLang());

onLangChange(() => {
  // Re-score reasons in current language (scoreAnchorage calls t())
  renderFromCache();
});

load();
setInterval(load, REFRESH_MS);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') load();
});
