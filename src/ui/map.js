import L from 'leaflet';
import { MAP_CENTER, MAP_ZOOM, ANCHORAGES, FORECAST_POINTS } from '../data/locations.js';
import { scoreAnchorage } from '../lib/crossing.js';
import { formatWind, formatWave, formatDir } from '../lib/format.js';

let map;
let layerGroup;

export function initMap(container) {
  if (map) {
    map.remove();
    map = null;
  }
  map = L.map(container, {
    scrollWheelZoom: false,
    zoomControl: true,
  }).setView(MAP_CENTER, MAP_ZOOM);

  // Esri World Topo — no API key (light use). Avoids CARTO apikey watermark.
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    {
      attribution:
        'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
      maxZoom: 19,
    },
  ).addTo(map);

  layerGroup = L.layerGroup().addTo(map);
  setTimeout(() => map.invalidateSize(), 100);
  return map;
}

function windColor(kn) {
  if (kn == null) return '#888';
  if (kn < 8) return '#2d6a5a';
  if (kn < 14) return '#3d7ea6';
  if (kn < 20) return '#c4a035';
  return '#a94442';
}

function statusColor(status) {
  return { favorable: '#2d6a5a', marginal: '#c4a035', exposed: '#a94442' }[status] || '#666';
}

function arrowIcon(dir, color, label) {
  const rot = (dir ?? 0) + 180; // meteorologic: from direction → point where wind goes
  return L.divIcon({
    className: 'wx-marker',
    html: `<div class="wind-barb" style="--rot:${rot}deg;--c:${color}" title="${label}">
      <span class="barb-arrow">⬆</span>
      <span class="barb-label">${label}</span>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20], // center of barb on the lat/lon
    popupAnchor: [0, -16],
  });
}

function pinIcon(status, name) {
  const c = statusColor(status);
  // iconSize matches the teardrop only; label overflows so the tip stays on lat/lon
  return L.divIcon({
    className: 'anch-marker',
    html: `<div class="anch-pin" style="--c:${c}"><span></span><em>${escape(name)}</em></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 14], // tip of rotated teardrop
    popupAnchor: [0, -14],
  });
}

function escape(s) {
  return String(s).replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/**
 * Overlay forecast point wind/waves + favorable anchorages for next 1–2 days.
 */
export function updateMap(forecastData, showAllAnchorages = true) {
  if (!map || !layerGroup) return;
  layerGroup.clearLayers();

  const crossing = forecastData.points.crossing;
  const hours = crossing?.hourly?.slice(0, 36) || [];
  const avg = averageConditions(hours);

  // Forecast point markers
  for (const pt of FORECAST_POINTS) {
    const data = forecastData.points[pt.id];
    const h = data?.hourly?.[0];
    if (!h) continue;
    const label = `${Math.round(h.windKn ?? 0)}kn`;
    const marker = L.marker([pt.lat, pt.lon], {
      icon: arrowIcon(h.windDir, windColor(h.windKn), label),
    }).bindPopup(
      `<strong>${pt.name}</strong><br/>
       Wind ${formatWind(h.windKn, h.gustKn)} ${formatDir(h.windDir)}<br/>
       Waves ${formatWave(h.swellM ?? h.waveM, h.swellPeriod ?? h.wavePeriod, h.swellDir ?? h.waveDir)}`
    );
    layerGroup.addLayer(marker);
  }

  // Corridor: Angra -> crossing -> Paraty
  const corridor = [
    [forecastData.points.angra.lat, forecastData.points.angra.lon],
    [forecastData.points.crossing.lat, forecastData.points.crossing.lon],
    [forecastData.points.paraty.lat, forecastData.points.paraty.lon],
  ];
  layerGroup.addLayer(
    L.polyline(corridor, { color: '#1e4d6b', weight: 2, dashArray: '6 8', opacity: 0.7 })
  );

  // Anchorages
  const scored = ANCHORAGES.map((a) => {
    const nearest = nearestPoint(a, forecastData);
    const cond = averageConditions(nearest?.hourly?.slice(0, 36) || hours);
    const s = scoreAnchorage(a, cond);
    return { anchorage: a, ...s, cond };
  });

  const toShow = showAllAnchorages ? scored : scored.filter((s) => s.status === 'favorable');

  for (const s of toShow) {
    const a = s.anchorage;
    const marker = L.marker([a.lat, a.lon], {
      icon: pinIcon(s.status, a.name),
    }).bindPopup(anchoragePopupHtml(a, s), { maxWidth: 280, className: 'anch-popup-wrap' });
    layerGroup.addLayer(marker);
  }

  return scored;
}

function averageConditions(hours) {
  if (!hours.length) {
    return {
      windKn: null,
      gustKn: null,
      gustMaxKn: null,
      windDir: null,
      swellM: null,
      periodS: null,
      swellDir: null,
    };
  }
  const windSamples = hours.map((h) => h.windKn).filter((v) => v != null);
  const gustSamples = hours.map((h) => h.gustKn).filter((v) => v != null);
  const dirSamples = hours.map((h) => h.windDir).filter((v) => v != null);
  const swellSamples = hours.map((h) => h.swellM ?? h.waveM).filter((v) => v != null);
  const periodSamples = hours.map((h) => h.swellPeriod ?? h.wavePeriod).filter((v) => v != null);
  const swellDirSamples = hours.map((h) => h.swellDir ?? h.waveDir).filter((v) => v != null);
  const gustMax = gustSamples.length ? Math.max(...gustSamples) : null;
  const windAvg = windSamples.length ? windSamples.reduce((a, b) => a + b, 0) / windSamples.length : null;
  return {
    windKn: windAvg,
    // Prefer peak gust over the window for boaters; fall back to avg gust
    gustKn: gustMax ?? (gustSamples.length ? gustSamples.reduce((a, b) => a + b, 0) / gustSamples.length : null),
    gustMaxKn: gustMax,
    windDir: dirSamples.length ? circularMean(dirSamples) : null,
    swellM: swellSamples.length ? swellSamples.reduce((a, b) => a + b, 0) / swellSamples.length : null,
    periodS: periodSamples.length
      ? periodSamples.reduce((a, b) => a + b, 0) / periodSamples.length
      : null,
    swellDir: swellDirSamples.length ? circularMean(swellDirSamples) : null,
  };
}

function windyUrl(lat, lon) {
  const la = Number(lat).toFixed(3);
  const lo = Number(lon).toFixed(3);
  // Wind + waves layers, zoomed to the anchorage
  return `https://www.windy.com/${la}/${lo}?wind,waves,${la},${lo},12`;
}

function windyLink(lat, lon) {
  const href = windyUrl(lat, lon);
  return `<a class="windy-link" href="${href}" target="_blank" rel="noopener noreferrer" title="Open this spot in Windy">
    <img class="windy-icon" src="https://www.windy.com/favicon.ico" width="18" height="18" alt="" />
    <span>Windy</span>
  </a>`;
}

function anchoragePopupHtml(a, s) {
  const c = s.cond || {};
  const gustVal = c.gustMaxKn ?? c.gustKn;
  const windLine =
    c.windKn != null || c.windDir != null || gustVal != null
      ? `<div class="popup-row"><span class="popup-k">Wind</span> ${formatWind(c.windKn, gustVal)} ${formatDir(c.windDir)}</div>`
      : `<div class="popup-row"><span class="popup-k">Wind</span> —</div>`;
  const gustLine =
    gustVal != null
      ? `<div class="popup-row"><span class="popup-k">Gusts</span> ${Math.round(gustVal)} kn (${Math.round(gustVal * 1.852)} km/h)</div>`
      : `<div class="popup-row"><span class="popup-k">Gusts</span> —</div>`;
  const swellLine = `<div class="popup-row"><span class="popup-k">Swell</span> ${formatWave(c.swellM, c.periodS, c.swellDir)}</div>`;
  return `<div class="anch-popup">
    <div class="anch-popup-top">
      <strong>${escape(a.name)}</strong>
      ${windyLink(a.lat, a.lon)}
    </div>
    <div class="popup-status" style="color:${statusColor(s.status)}">${s.status} · ${s.score}/100</div>
    ${windLine}
    ${gustLine}
    ${swellLine}
    <div class="popup-reason">${s.reason}</div>
    <em class="popup-note">${escape(a.note)}</em>
  </div>`;
}

function circularMean(degs) {
  if (!degs.length) return 0;
  let x = 0;
  let y = 0;
  for (const d of degs) {
    x += Math.cos((d * Math.PI) / 180);
    y += Math.sin((d * Math.PI) / 180);
  }
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function nearestPoint(anchorage, forecastData) {
  let best = null;
  let bestD = Infinity;
  for (const pt of Object.values(forecastData.points)) {
    const d =
      (pt.lat - anchorage.lat) ** 2 + (pt.lon - anchorage.lon) ** 2;
    if (d < bestD) {
      bestD = d;
      best = pt;
    }
  }
  return best;
}

export function renderAnchorageList(root, scored) {
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  root.innerHTML = `
    <div class="anch-legend">
      <span><i class="dot ok"></i> Favorable</span>
      <span><i class="dot warn"></i> Marginal</span>
      <span><i class="dot bad"></i> Exposed</span>
      <span class="muted">Scored for next ~36 h wind/swell vs shelter sector</span>
    </div>
    <ul class="anch-list">
      ${sorted
        .map(
          (s) => `
        <li class="anch-item ${s.status}">
          <strong>${s.anchorage.name}</strong>
          <span class="status">${s.status}</span>
          <span class="muted">${s.reason}</span>
          <span class="anch-swell">Swell ${formatWave(s.cond?.swellM, s.cond?.periodS, s.cond?.swellDir)}</span>
        </li>`
        )
        .join('')}
    </ul>`;
}
