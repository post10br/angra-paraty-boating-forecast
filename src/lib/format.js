const TZ = 'America/Sao_Paulo';

export function knToKmh(kn) {
  return kn * 1.852;
}

export function degToCompass(deg) {
  if (deg == null || Number.isNaN(deg)) return '—';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const i = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return dirs[i];
}

export function formatWind(kn, gust = null) {
  if (kn == null && gust == null) return '—';
  if (kn == null) {
    return `gusts ${Math.round(gust)} kn (${Math.round(knToKmh(gust))} km/h)`;
  }
  const base = `${Math.round(kn)} kn (${Math.round(knToKmh(kn))} km/h)`;
  if (gust != null && !Number.isNaN(gust)) {
    return `${base}, gusts ${Math.round(gust)} kn`;
  }
  return base;
}

/**
 * Meteorological wind direction is WHERE THE WIND COMES FROM.
 * The arrow shows where it is blowing TO (like Windy): easterly (from E) → arrow points west (←).
 * CSS: 0° = arrow tip up (north); rotate by (fromDeg + 180).
 */
export function windBlowToRotation(fromDeg) {
  if (fromDeg == null || Number.isNaN(fromDeg)) return null;
  return (((fromDeg % 360) + 360) % 360 + 180) % 360;
}

export function formatDir(deg) {
  if (deg == null || Number.isNaN(deg)) return '—';
  const from = ((deg % 360) + 360) % 360;
  const rot = windBlowToRotation(from);
  const label = `${degToCompass(from)} ${Math.round(from)}°`;
  // aria: announce "from" direction; arrow is visual blow-to
  return `<span class="wind-dir" title="Wind from ${label} (arrow shows blow-to)"><span class="wind-dir-arrow" style="--wind-rot:${rot}deg" aria-hidden="true">⬆</span><span class="wind-dir-text">${label}</span></span>`;
}

export function formatWave(h, period, dir) {
  const parts = [];
  if (h != null) parts.push(`${Number(h).toFixed(1)} m`);
  if (period != null) parts.push(`${Math.round(period)} s`);
  if (dir != null) parts.push(formatDir(dir));
  return parts.length ? parts.join(' · ') : '—';
}

export function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) + ' BRT';
}

export function formatClock(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDay(iso) {
  const d = new Date(iso.includes('T') ? iso : iso + 'T12:00:00');
  return d.toLocaleDateString('en-GB', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function weatherLabel(code) {
  const map = {
    0: 'Clear',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Heavy freezing rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Light showers',
    81: 'Showers',
    82: 'Heavy showers',
    85: 'Snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm + hail',
    99: 'Severe thunderstorm',
  };
  return map[code] ?? `Code ${code}`;
}

export function nowIsoBRT() {
  return new Date().toLocaleString('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }) + ' BRT';
}

export { TZ };
