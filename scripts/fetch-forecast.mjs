import { mkdir, writeFile } from 'node:fs/promises';
import { FORECAST_POINTS } from '../src/data/locations.js';
import { fetchLiveForecasts } from '../src/lib/openmeteo.js';

const outputPath = new URL('../public/data/latest.json', import.meta.url);

function emptyPayload(error) {
  const points = FORECAST_POINTS.map((point) => ({
    ...point,
    units: { wind: 'kn', wave: 'm' },
    hourly: [],
    daily: [],
    current: null,
  }));
  return {
    fetchedAt: new Date().toISOString(),
    points: Object.fromEntries(points.map((point) => [point.id, point])),
    list: points,
    errors: [error],
    source: 'pipeline-error',
  };
}

let payload;
try {
  payload = await fetchLiveForecasts(FORECAST_POINTS);
} catch (error) {
  payload = emptyPayload(`Pipeline: ${error?.message || error}`);
}

await mkdir(new URL('../public/data/', import.meta.url), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

const available = payload.list.filter((point) => point.hourly.length).length;
console.log(`Wrote ${outputPath.pathname}: ${available}/${payload.list.length} points with hourly data`);
if (payload.errors?.length) console.warn(payload.errors.join('; '));
