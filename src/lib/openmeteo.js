import { FORECAST_POINTS } from '../data/locations.js';

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const TZ = 'America/Sao_Paulo';

const HOURLY_WX =
  'wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code,precipitation_probability,precipitation,visibility,cloud_cover';
const DAILY_WX =
  'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant';
const HOURLY_MARINE =
  'wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height,wind_wave_period,wind_wave_direction';

function qs(params) {
  return new URLSearchParams(params).toString();
}

const CACHE_KEY = 'angra-paraty-forecast-v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — matches page refresh cadence
const STATIC_TTL_MS = 90 * 60 * 1000;

function isFresh(timestamp, ttl) {
  const time = new Date(timestamp).getTime();
  if (!Number.isFinite(time)) return false;
  const age = Date.now() - time;
  return age >= 0 && age < ttl;
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.fetchedAt || !parsed?.payload) return null;
    if (!isFresh(parsed.fetchedAt, CACHE_TTL_MS)) return null;
    if (parsed.payload?.points && parsed.payload?.list) return parsed.payload;
    return null;
  } catch {
    return null;
  }
}

function writeCache(payload) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ fetchedAt: payload.fetchedAt, payload }),
    );
  } catch {
    /* quota / private mode */
  }
}

function snapshotHasWind(data) {
  const crossing = data?.points?.crossing?.hourly;
  if (!Array.isArray(crossing)) return false;
  const now = Date.now() - 60 * 60 * 1000;
  return crossing.some(
    (h) => h?.windKn != null && new Date(h.time).getTime() >= now,
  );
}

async function readStaticSnapshot() {
  if (typeof document === 'undefined' || typeof fetch !== 'function') return null;
  try {
    // document.baseURI keeps this relative to either the Vite root or Pages project path.
    const url = new URL('data/latest.json', document.baseURI).toString();
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.fetchedAt || !data?.points || !data?.list) return null;
    if (!isFresh(data.fetchedAt, STATIC_TTL_MS)) return null;
    // Don't serve a swell-only snapshot when anchorage scoring needs wind.
    if (!snapshotHasWind(data)) return null;
    return { ...data, source: 'static' };
  } catch {
    return null;
  }
}

async function fetchJson(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  // Open-Meteo can return a JSON error body even when the transport status is usable.
  if (!res.ok || data?.error === true) {
    throw new Error(
      data?.reason || `HTTP ${res.status} for ${url}: ${JSON.stringify(data).slice(0, 200)}`,
    );
  }
  return data;
}

/** Batch lat/lon for Open-Meteo multi-point */
function multiCoords(points) {
  return {
    latitude: points.map((p) => p.lat).join(','),
    longitude: points.map((p) => p.lon).join(','),
  };
}

function normalizeMulti(raw, points) {
  // Single point returns object; multi returns array.
  const values = Array.isArray(raw) ? raw : [raw];
  return points.map((_, i) => {
    const value = values[i];
    return value?.error === true ? null : value || null;
  });
}

function pointWeatherUrl(pt) {
  return `${WEATHER_URL}?${qs({
    latitude: pt.lat,
    longitude: pt.lon,
    hourly: HOURLY_WX,
    daily: DAILY_WX,
    wind_speed_unit: 'kn',
    timezone: TZ,
    forecast_days: 16,
  })}`;
}

function pointMarineUrl(pt) {
  return `${MARINE_URL}?${qs({
    latitude: pt.lat,
    longitude: pt.lon,
    hourly: HOURLY_MARINE,
    timezone: TZ,
    forecast_days: 16,
  })}`;
}

/** Fetch one bundle without allowing a weather failure to cancel marine (or vice versa). */
async function fetchBundle(points, batchUrl, pointUrl) {
  let batchError = null;
  try {
    return { list: normalizeMulti(await fetchJson(batchUrl), points), error: null };
  } catch (err) {
    batchError = err;
  }

  // A batch request can be rejected independently of the other API. Retry points in
  // parallel, but keep failed points as null so a partial payload can still render.
  const settled = await Promise.all(
    points.map(async (pt) => {
      try {
        return await fetchJson(pointUrl(pt));
      } catch {
        return null;
      }
    }),
  );
  const hasData = settled.some(Boolean);
  return {
    list: settled,
    error: hasData ? null : batchError?.message || 'Open-Meteo request failed',
  };
}

async function fetchWeatherBundle(points) {
  const coords = multiCoords(points);
  return fetchBundle(
    points,
    `${WEATHER_URL}?${qs({
      ...coords,
      hourly: HOURLY_WX,
      daily: DAILY_WX,
      wind_speed_unit: 'kn',
      timezone: TZ,
      forecast_days: 16,
    })}`,
    pointWeatherUrl,
  );
}

async function fetchMarineBundle(points) {
  const coords = multiCoords(points);
  return fetchBundle(
    points,
    `${MARINE_URL}?${qs({
      ...coords,
      hourly: HOURLY_MARINE,
      timezone: TZ,
      forecast_days: 16,
    })}`,
    pointMarineUrl,
  );
}

function hasForecastData(payload) {
  return payload?.list?.some((point) => point?.hourly?.length || point?.daily?.length);
}

/** Fetch live APIs and return whatever weather/marine data succeeded. */
export async function fetchLiveForecasts(points = FORECAST_POINTS) {
  const [wxResult, marineResult] = await Promise.all([
    fetchWeatherBundle(points),
    fetchMarineBundle(points),
  ]);

  const byId = {};
  points.forEach((pt, i) => {
    byId[pt.id] = mergePoint(pt, wxResult.list[i], marineResult.list[i]);
  });

  return {
    fetchedAt: new Date().toISOString(),
    points: byId,
    list: points.map((p) => byId[p.id]),
    errors: [
      wxResult.error ? `Weather: ${wxResult.error}` : null,
      marineResult.error ? `Marine: ${marineResult.error}` : null,
    ].filter(Boolean),
    source: 'live',
  };
}

export async function fetchAllForecasts(points = FORECAST_POINTS, { force = false } = {}) {
  if (!force) {
    const staticSnapshot = await readStaticSnapshot();
    if (staticSnapshot) return staticSnapshot;

    const cached = readCache();
    if (cached?.points && cached?.list) return { ...cached, source: 'local-cache' };
  }

  const payload = await fetchLiveForecasts(points);
  if (hasForecastData(payload)) writeCache(payload);
  return payload;
}

function mergePoint(meta, wx, marine) {
  const hourly = mergeHourly(wx?.hourly, marine?.hourly);
  const daily = buildDaily(wx?.daily, hourly);
  return {
    ...meta,
    units: {
      wind: wx?.hourly_units?.wind_speed_10m ?? 'kn',
      wave: marine?.hourly_units?.wave_height ?? 'm',
    },
    hourly,
    daily,
    current: hourly[0] ?? null,
  };
}

function mergeHourly(wxH = {}, mH = {}) {
  const times = wxH.time || mH.time || [];
  return times.map((time, i) => ({
    time,
    windKn: wxH.wind_speed_10m?.[i] ?? null,
    gustKn: wxH.wind_gusts_10m?.[i] ?? null,
    windDir: wxH.wind_direction_10m?.[i] ?? null,
    weatherCode: wxH.weather_code?.[i] ?? null,
    precipProb: wxH.precipitation_probability?.[i] ?? null,
    precip: wxH.precipitation?.[i] ?? null,
    visibility: wxH.visibility?.[i] ?? null,
    cloud: wxH.cloud_cover?.[i] ?? null,
    waveM: mH.wave_height?.[i] ?? null,
    waveDir: mH.wave_direction?.[i] ?? null,
    wavePeriod: mH.wave_period?.[i] ?? null,
    swellM: mH.swell_wave_height?.[i] ?? null,
    swellDir: mH.swell_wave_direction?.[i] ?? null,
    swellPeriod: mH.swell_wave_period?.[i] ?? null,
    windWaveM: mH.wind_wave_height?.[i] ?? null,
    windWavePeriod: mH.wind_wave_period?.[i] ?? null,
    windWaveDir: mH.wind_wave_direction?.[i] ?? null,
  }));
}

function buildDaily(wxDaily = {}, hourly = []) {
  const weatherDays = wxDaily.time || [];
  const hourlyDays = hourly.map((h) => h.time.slice(0, 10));
  const days = [...new Set([...weatherDays, ...hourlyDays])].sort();
  return days.map((date) => {
    const i = weatherDays.indexOf(date);
    const dayHours = hourly.filter((h) => h.time.startsWith(date));
    const swellHeights = dayHours.map((h) => h.swellM ?? h.waveM).filter((v) => v != null);
    const periods = dayHours.map((h) => h.swellPeriod ?? h.wavePeriod).filter((v) => v != null);
    const swellDirs = dayHours.map((h) => h.swellDir ?? h.waveDir).filter((v) => v != null);
    return {
      date,
      weatherCode: wxDaily.weather_code?.[i] ?? null,
      tempMax: wxDaily.temperature_2m_max?.[i] ?? null,
      tempMin: wxDaily.temperature_2m_min?.[i] ?? null,
      precipSum: wxDaily.precipitation_sum?.[i] ?? null,
      precipProbMax: wxDaily.precipitation_probability_max?.[i] ?? null,
      windMaxKn: wxDaily.wind_speed_10m_max?.[i] ?? null,
      gustMaxKn: wxDaily.wind_gusts_10m_max?.[i] ?? null,
      windDir: wxDaily.wind_direction_10m_dominant?.[i] ?? null,
      swellMaxM: swellHeights.length ? Math.max(...swellHeights) : null,
      swellAvgM: swellHeights.length
        ? swellHeights.reduce((a, b) => a + b, 0) / swellHeights.length
        : null,
      swellPeriodAvg: periods.length
        ? periods.reduce((a, b) => a + b, 0) / periods.length
        : null,
      swellDir: swellDirs.length ? swellDirs[Math.floor(swellDirs.length / 2)] : null,
      hours: dayHours,
    };
  });
}

/** Next N hours from "now" in America/Sao_Paulo sense (compare ISO local strings). */
export function sliceNextHours(hourly, hours = 48) {
  const now = Date.now();
  const future = hourly.filter((h) => new Date(h.time).getTime() >= now - 60 * 60 * 1000);
  return future.slice(0, hours);
}
