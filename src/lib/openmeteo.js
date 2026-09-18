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

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} for ${url}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Batch lat/lon for Open-Meteo multi-point */
function multiCoords(points) {
  return {
    latitude: points.map((p) => p.lat).join(','),
    longitude: points.map((p) => p.lon).join(','),
  };
}

function normalizeMulti(raw, points) {
  // Single point returns object; multi returns array
  if (Array.isArray(raw)) return raw;
  if (points.length === 1) return [raw];
  // Sometimes still object when one point fails — wrap
  return [raw];
}

export async function fetchAllForecasts(points = FORECAST_POINTS) {
  const coords = multiCoords(points);
  const wxUrl =
    `${WEATHER_URL}?${qs({
      ...coords,
      hourly: HOURLY_WX,
      daily: DAILY_WX,
      wind_speed_unit: 'kn',
      timezone: TZ,
      forecast_days: 16,
    })}`;
  const marineUrl =
    `${MARINE_URL}?${qs({
      ...coords,
      hourly: HOURLY_MARINE,
      timezone: TZ,
      forecast_days: 16,
    })}`;

  const [wxRaw, marineRaw] = await Promise.all([
    fetchJson(wxUrl),
    fetchJson(marineUrl),
  ]);

  const wxList = normalizeMulti(wxRaw, points);
  const marineList = normalizeMulti(marineRaw, points);

  const byId = {};
  points.forEach((pt, i) => {
    byId[pt.id] = mergePoint(pt, wxList[i], marineList[i]);
  });

  return {
    fetchedAt: new Date().toISOString(),
    points: byId,
    list: points.map((p) => byId[p.id]),
  };
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
  const days = wxDaily.time || [];
  return days.map((date, i) => {
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
      swellDir: swellDirs.length
        ? swellDirs[Math.floor(swellDirs.length / 2)]
        : null,
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
