/** Forecast sample points along Angra ↔ Paraty corridor */
export const FORECAST_POINTS = [
  {
    id: 'angra',
    name: 'Angra dos Reis',
    lat: -23.0065,
    lon: -44.3181,
    role: 'harbor',
  },
  {
    id: 'abraao',
    name: 'Ilha Grande / Abraão',
    lat: -23.1417,
    lon: -44.1678,
    role: 'island',
  },
  {
    id: 'crossing',
    name: 'Mid crossing (exposed)',
    lat: -23.15,
    lon: -44.55,
    role: 'exposed',
  },
  {
    id: 'paraty',
    name: 'Paraty',
    lat: -23.2178,
    lon: -44.7131,
    role: 'harbor',
  },
];

/**
 * Real recreational anchorages / shelter pockets in Costa Verde / Ilha Grande Bay.
 * shelterFrom: compass sectors (degrees) where land/islands block wind/swell.
 * quality: relative natural shelter 1–5 when wind is from a sheltered sector.
 */
export const ANCHORAGES = [
  {
    id: 'abraao',
    name: 'Vila do Abraão',
    lat: -23.1417,
    lon: -44.1678,
    shelterFrom: [[90, 220]], // E–SW land behind; open more to N/NW
    quality: 3,
    note: 'Main Ilha Grande village; busy, fair shelter in typical SE swell.',
  },
  {
    id: 'saco-do-ceu',
    name: 'Saco do Céu',
    lat: -23.107,
    lon: -44.205,
    shelterFrom: [[0, 90], [270, 360]], // deep inlet, open mainly S
    quality: 5,
    note: 'Deep, well-sheltered cove on N Ilha Grande.',
  },
  {
    id: 'lagoa-azul',
    name: 'Lagoa Azul',
    lat: -23.162,
    lon: -44.295,
    shelterFrom: [[45, 180]],
    quality: 4,
    note: 'Popular day anchorage; good in NE–S winds.',
  },
  {
    id: 'aracatiba',
    name: 'Araçatiba',
    lat: -23.152,
    lon: -44.338,
    shelterFrom: [[0, 140]],
    quality: 4,
    note: 'West Ilha Grande pocket; solid for N–SE.',
  },
  {
    id: 'feiticeira',
    name: 'Praia da Feiticeira',
    lat: -23.155,
    lon: -44.195,
    shelterFrom: [[80, 200]],
    quality: 3,
    note: 'Near Abraão; partial shelter.',
  },
  {
    id: 'palmas',
    name: 'Praia de Palmas',
    lat: -23.158,
    lon: -44.145,
    shelterFrom: [[100, 230]],
    quality: 3,
    note: 'East side; watch swell wrap.',
  },
  {
    id: 'angra-marina',
    name: 'Angra dos Reis (marina approaches)',
    lat: -23.0065,
    lon: -44.3181,
    shelterFrom: [[0, 360]],
    quality: 5,
    note: 'Mainland marina/harbor zone; excellent all-round shelter.',
  },
  {
    id: 'japuiba',
    name: 'Enseada de Japuíba',
    lat: -22.98,
    lon: -44.28,
    shelterFrom: [[90, 270]],
    quality: 4,
    note: 'Mainland bay N of Angra.',
  },
  {
    id: 'paraty-bay',
    name: 'Baía de Paraty (town)',
    lat: -23.2178,
    lon: -44.7131,
    shelterFrom: [[0, 360]],
    quality: 5,
    note: 'Shallow bay; very sheltered for small craft.',
  },
  {
    id: 'paraty-mirim',
    name: 'Paraty Mirim',
    lat: -23.248,
    lon: -44.658,
    shelterFrom: [[200, 360], [0, 40]],
    quality: 4,
    note: 'South of Paraty; good in S–N arc.',
  },
  {
    id: 'mamangua',
    name: 'Saco de Mamanguá',
    lat: -23.255,
    lon: -44.62,
    shelterFrom: [[0, 360]],
    quality: 5,
    note: 'Fjord-like inlet; outstanding shelter.',
  },
  {
    id: 'ilha-do-mantimento',
    name: 'Ilha do Mantimento',
    lat: -23.205,
    lon: -44.69,
    shelterFrom: [[90, 250]],
    quality: 3,
    note: 'Paraty bay island lee depending on wind.',
  },
  {
    id: 'praia-do-sono',
    name: 'Praia do Sono',
    lat: -23.335,
    lon: -44.635,
    shelterFrom: [[200, 320]],
    quality: 3,
    note: 'South Costa Verde; best in SW–NW.',
  },
  {
    id: 'jabaquara',
    name: 'Praia de Jabaquara',
    lat: -23.195,
    lon: -44.715,
    shelterFrom: [[60, 200]],
    quality: 4,
    note: 'N of Paraty historic center.',
  },
];

export const MAP_CENTER = [-23.14, -44.45];
export const MAP_ZOOM = 10;

export const MARINHA_AVISOS_URL =
  'https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo';

export const REFRESH_MS = 60 * 60 * 1000; // 1 hour
