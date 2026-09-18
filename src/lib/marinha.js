/**
 * Marinha do Brasil — Avisos de Mau Tempo (METAREA V).
 * Isolated fetch/parse; degrades gracefully when Cloudflare/CORS blocks.
 *
 * Official page:
 * https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo
 */

import { MARINHA_AVISOS_URL } from '../data/locations.js';

const AREA_HINTS = [
  'metarea v',
  'metarea v',
  'costa sul',
  'rio de janeiro',
  'rj',
  'angra',
  'paraty',
  'ilha grande',
  'costa verde',
  'sepetiba',
  'cabo frio',
  'santos', // sometimes grouped with SE Brazil coastal
  'área a',
  'area a',
  'área b',
  'area b',
];

const SEVERITY_WORDS = [
  { re: /vermelho|red|extreme|extreme|furac|hurac/i, level: 'extreme' },
  { re: /laranja|orange|severe|muito forte|mar muito grosso|ressaca/i, level: 'severe' },
  { re: /amarelo|yellow|forte|grosso|aviso|warning|mau tempo/i, level: 'moderate' },
];

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function guessSeverity(text) {
  for (const s of SEVERITY_WORDS) {
    if (s.re.test(text)) return s.level;
  }
  return 'info';
}

function relevant(text) {
  const lower = text.toLowerCase();
  return AREA_HINTS.some((h) => lower.includes(h));
}

function parseAvisos(html) {
  const alerts = [];
  // Split on common aviso markers
  const chunks = html.split(/(?=Aviso\s+(?:de\s+)?(?:Mau\s+Tempo|N[ºo.]|Nr)|AVISO\s+N)/i);
  for (const chunk of chunks) {
    const text = stripTags(chunk).slice(0, 800);
    if (text.length < 40) continue;
    if (!/aviso|vento|onda|mar |ressaca|visibilidade/i.test(text)) continue;
    if (!relevant(text) && !/metarea|brasil|costa/i.test(text)) continue;
    // Prefer RJ / Costa Verde; still keep METAREA V coastal if no local match
    const local = relevant(text);
    alerts.push({
      severity: guessSeverity(text),
      title: (text.match(/Aviso[^.]{0,80}/i) || ['Marinha aviso'])[0].trim(),
      summary: text.slice(0, 280) + (text.length > 280 ? '…' : ''),
      local,
      link: MARINHA_AVISOS_URL,
    });
  }

  // Prefer local matches; else keep a few METAREA V
  const localOnes = alerts.filter((a) => a.local);
  const picked = (localOnes.length ? localOnes : alerts).slice(0, 5);
  return picked;
}

async function tryFetch(url) {
  const res = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-cache',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/**
 * @returns {{
 *   status: 'ok'|'none'|'error',
 *   checkedAt: string,
 *   alerts: Array,
 *   sourceUrl: string,
 *   message?: string
 * }}
 */
export async function fetchMarinhaAlerts() {
  const checkedAt = new Date().toISOString();
  const proxies = [
    // Direct (usually fails in browser due to CORS/CF)
    MARINHA_AVISOS_URL,
    // Public CORS mirrors — best-effort only
    `https://api.allorigins.win/raw?url=${encodeURIComponent(MARINHA_AVISOS_URL)}`,
    `https://corsproxy.io/?${encodeURIComponent(MARINHA_AVISOS_URL)}`,
  ];

  let lastError = null;
  for (const url of proxies) {
    try {
      const html = await tryFetch(url);
      if (!html || html.length < 200) throw new Error('Empty response');
      if (/cf-mitigated|just a moment|cloudflare/i.test(html) && html.length < 20000) {
        throw new Error('Cloudflare challenge');
      }
      const alerts = parseAvisos(html);
      if (!alerts.length) {
        return {
          status: 'none',
          checkedAt,
          alerts: [],
          sourceUrl: MARINHA_AVISOS_URL,
          message: 'No active Marinha alerts for this area',
        };
      }
      return {
        status: 'ok',
        checkedAt,
        alerts,
        sourceUrl: MARINHA_AVISOS_URL,
      };
    } catch (err) {
      lastError = err;
    }
  }

  return {
    status: 'error',
    checkedAt,
    alerts: [],
    sourceUrl: MARINHA_AVISOS_URL,
    message: 'No active Marinha alerts for this area',
    detail: lastError?.message || 'fetch failed',
  };
}
