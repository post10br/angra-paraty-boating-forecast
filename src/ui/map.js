import L from 'leaflet';
import { MAP_CENTER, MAP_ZOOM, ANCHORAGES, FORECAST_POINTS } from '../data/locations.js';
import { scoreAnchorage } from '../lib/crossing.js';
import { formatWind, formatWave, degToCompass } from '../lib/format.js';

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

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 18,
  }).addTo(map);

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
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
}

function pinIcon(status, name) {
  const c = statusColor(status);
  return L.divIcon({
    className: 'anch-marker',
    html: `<div class="anch-pin" style="--c:${c}"><span></span><em>${escape(name)}</em></div>`,
    iconSize: [120, 40],
    iconAnchor: [12, 36],
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
       Wind ${formatWind(h.windKn, h.gustKn)} ${degToCompass(h.windDir)}<br/>
       Waves ${formatWave(h.swellM ?? h.waveM, h.swellPeriod ?? h.wavePeriod, h.swellDir ?? h.waveDir)}`
    );
    layerGroup.addLayer(marker);
  }

  // Polyline corridor
  const latlngs = FORECAST_POINTS.filter((p) => p.id !== 'abraao').map((p) => [p.lat, p.lon]);
  // Better corridor: Angra -> crossing -> Paraty, plus Abraão spur
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
    }).bindPopup(
      `<strong>${a.name}</strong><br/>
       <span style="color:${statusColor(s.status)}">${s.status}</span> (${s.score}/100)<br/>
       ${s.reason}<br/>
       <em>${a.note}</em>`
    );
    layerGroup.addLayer(marker);
  }

  return scored;
}

function averageConditions(hours) {
  if (!hours.length) return { windKn: 0, gustKn: 0, windDir: 0, swellM: 0, periodS: 8 };
  const n = hours.length;
  const windDir = circularMean(hours.map((h) => h.windDir).filter((v) => v != null));
  return {
    windKn: hours.reduce((a, h) => a + (h.windKn || 0), 0) / n,
    gustKn: hours.reduce((a, h) => a + (h.gustKn || 0), 0) / n,
    windDir,
    swellM: hours.reduce((a, h) => a + ((h.swellM ?? h.waveM) || 0), 0) / n,
    periodS: hours.reduce((a, h) => a + ((h.swellPeriod ?? h.wavePeriod) || 8), 0) / n,
  };
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
        </li>`
        )
        .join('')}
    </ul>`;
}
