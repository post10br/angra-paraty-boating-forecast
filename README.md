# Angra ↔ Paraty Boating Forecast

Interactive marine weather for recreational coastal boating on the **Angra dos Reis ↔ Paraty** corridor (Costa Verde / Ilha Grande Bay, Rio de Janeiro, Brazil).

English UI · Portuguese place names · Times in **America/Sao_Paulo (BRT)**.

## Features

1. **Marinha do Brasil alerts banner** — best-effort fetch of Avisos de Mau Tempo (METAREA V / RJ south / Costa Verde). Degrades to a quiet “No active Marinha alerts for this area” state with last-check time and a link to the official CHM page when Cloudflare/CORS blocks scraping.
2. **24–48 h crossing briefing** — short summary that scores the **exposed open-water crossing** as pleasant / lumpy / uncomfortable / not recommended from wind + swell + period.
3. **Interactive Leaflet map** — wind barbs at sample points, corridor line, and **real anchorage pins** scored for shelter vs expected wind/swell (next ~36 h).
4. **Detailed ~1-day table** — 1- or 3-hourly wind (kn + gust + dir), swell (m + period + dir), weather, precip %, visibility; crossing windows highlighted.
5. **1-week** day-by-day marine cards.
6. **2-week** coarser outlook table.

Client-side auto-refresh about every **hour** (also refreshes when the tab becomes visible again).

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://127.0.0.1:5173/`).

Production build:

```bash
npm run build
npm run preview
```

Output lands in `dist/`.

## Deploy to GitHub Pages

This repo is private; enable Pages under **Settings → Pages → Deploy from a branch** (or GitHub Actions) if you want a public/private Pages URL.

For project Pages the asset base path must be `/angra-paraty-boating-forecast/`:

```bash
GITHUB_PAGES=1 npm run build
```

Then publish the `dist/` folder (or push `dist` to a `gh-pages` branch).

With the default `base: './'` (relative), `dist/` also works on any static host without a subpath.

## Data sources

| Data | Source | Notes |
|------|--------|--------|
| Wind, weather, precip, visibility | [Open-Meteo Forecast API](https://api.open-meteo.com/v1/forecast) | No API key · `wind_speed_unit=kn` · `timezone=America/Sao_Paulo` |
| Waves / swell | [Open-Meteo Marine API](https://marine-api.open-meteo.com/v1/marine) | Height m, period s, direction ° |
| Maritime warnings | [Marinha CHM — Avisos de Mau Tempo](https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo) | Client fetch + optional CORS proxies; filter METAREA V / RJ / Costa Verde; graceful fallback |

Sample forecast points:

- Angra dos Reis ≈ `-23.0065, -44.3181`
- Ilha Grande / Abraão ≈ `-23.1417, -44.1678`
- Mid crossing (exposed) ≈ `-23.15, -44.55`
- Paraty ≈ `-23.2178, -44.7131`

## Crossing comfort logic (brief)

At the **mid-crossing** point, each hour is scored from wind/gusts and swell (or significant wave) height, with short-period seas weighted as choppier. The worst meaningful condition over the next 24–48 h drives the label:

| Label | Typical drivers |
|-------|-----------------|
| pleasant | &lt; ~10 kn and low swell |
| lumpy | ~10–15 kn and/or ~0.7–1.2 m effective seas |
| uncomfortable | ~15–20 kn and/or ~1.2–1.8 m |
| not recommended | &gt; ~20 kn or rough / short-period seas |

Anchorages combine expected wind direction with each site’s **shelter sector** and a quality rating (e.g. Saco de Mamanguá, Saco do Céu = strong shelter).

## Anchorages plotted

Vila do Abraão, Saco do Céu, Lagoa Azul, Araçatiba, Praia da Feiticeira, Praia de Palmas, Angra dos Reis (marina approaches), Enseada de Japuíba, Baía de Paraty (town), Paraty Mirim, Saco de Mamanguá, Ilha do Mantimento, Praia do Sono, Praia de Jabaquara.

## Disclaimer

Not official navigation advice. Conditions change quickly in Ilha Grande Bay. Cross-check Marinha / Capitanias dos Portos products before departure.

## Stack

Vite · vanilla JS · Leaflet · Open-Meteo
