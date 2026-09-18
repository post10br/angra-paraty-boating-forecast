/**
 * Lightweight i18n for Angra ↔ Paraty boating forecast.
 * Default: pt-BR. Persist choice in localStorage.
 */

const STORAGE_KEY = 'angra-paraty-lang';
export const DEFAULT_LANG = 'pt-BR';

const STRINGS = {
  'pt-BR': {
    // Document
    'doc.title': 'Previsão náutica Angra ↔ Paraty',
    'doc.description':
      'Previsão náutica Angra dos Reis ↔ Paraty — vento, ondulação, ancoragens e alertas da Marinha.',

    // Chrome
    'lang.switchToEn': 'English',
    'lang.switchToPt': 'Português',
    'lang.ariaToEn': 'Mudar para inglês',
    'lang.ariaToPt': 'Mudar para português',
    'header.eyebrow': 'Costa Verde · Baía da Ilha Grande · RJ',
    'header.title': 'Angra dos Reis ↔ Paraty',
    'header.tagline': 'Previsão para navegação costeira recreativa — vento, ondulação e abrigo',
    'header.loading': 'Carregando…',
    'header.updating': 'Atualizando…',
    'header.refresh': 'Atualizar',
    'header.lastUpdated': 'Atualizado em {time}',
    'header.forecastUnavailable': 'Previsão indisponível · {time}',

    'map.title': 'Mapa interativo',
    'map.subtitle': 'Barbs de vento nos pontos de amostragem · pinos de ancoragem avaliados para 1–2 dias',
    'map.aria': 'Mapa do corredor Angra a Paraty',

    'footer.sources':
      'Clima e mar: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> (sem chave de API). Alertas: consulte <a href="https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo" target="_blank" rel="noopener">Marinha CHM — Avisos de Mau Tempo</a> (METAREA V). Não é aconselhamento oficial de navegação — sempre confira Marinha / Capitanias antes de zarpar.',
    'footer.meta': 'Atualização automática ~1 h · Horários em America/Sao_Paulo (BRT)',

    // Alerts
    'alerts.activeTitle': 'Marinha do Brasil — Avisos de Mau Tempo',
    'alerts.quietTitle': 'Alertas da Marinha do Brasil',
    'alerts.checked': 'Verificado {time}',
    'alerts.lastCheck': 'Última verificação {time}',
    'alerts.none': 'Nenhum alerta ativo da Marinha nesta área',
    'alerts.verify': 'Verificar no CHM ↗',
    'alerts.official': 'Aviso oficial ↗',
    'alerts.fetchNote':
      'Nota da busca: {detail} — o banner degrada com elegância quando o CHM bloqueia acesso automatizado.',
    'alerts.severity.extreme': 'extremo',
    'alerts.severity.severe': 'severo',
    'alerts.severity.moderate': 'moderado',
    'alerts.severity.info': 'info',

    // Summary
    'summary.title': 'Briefing da travessia',
    'summary.sentence1':
      'Próximas 24–48 h no corredor Angra dos Reis ↔ Paraty: a travessia em águas abertas parece <strong class="{cls}">{label}</strong> com base no vento e ondulação no meio da baía.',
    'summary.sentence2':
      'Ponto exposto ({name}): picos perto de {gust} kn de rajada e {swell} m de mar (período ~{period} s).',
    'summary.sentence3':
      'Melhores janelas de travessia (horário local): {windows}. Sempre atravesse com luz do dia e margem para a brisa da tarde.',
    'summary.noWindow': 'nenhuma janela calma se destaca',
    'summary.chipCrossing': 'Travessia: {label}',
    'summary.chipWind': 'Vento {wind}',
    'summary.chipSwell': 'Ondulação {swell}',
    'summary.updated': 'Atualizado {time} · fuso America/Sao_Paulo (BRT)',
    'summary.partial':
      'Previsão parcial: um feed do Open-Meteo está indisponível; mostrando os dados que carregaram.',
    'summary.unavailableTitle': 'Dados de previsão temporariamente indisponíveis',
    'summary.unavailableBody':
      'Os alertas da Marinha continuam acima. Clima e dados marinhos aparecerão quando o Open-Meteo responder.',
    'summary.errorTitle': 'Não foi possível carregar a previsão',
    'summary.errorBody': 'Os alertas da Marinha ainda estão disponíveis acima. {err}',
    'summary.errorHint':
      'O Open-Meteo pode estar limitando esta rede. Tente Atualizar em um minuto.',

    // Crossing labels (keys match internal English labels)
    'crossing.pleasant': 'agradável',
    'crossing.lumpy': 'agitado',
    'crossing.uncomfortable': 'desconfortável',
    'crossing.not recommended': 'não recomendado',
    'crossing.unknown': 'desconhecido',

    // Hourly
    'hourly.title': 'Detalhe ~1 dia (meio da travessia)',
    'hourly.subtitle':
      'Ponto médio / exposto · vento kn · ondulação m / período s · a cada {step} h',
    'hourly.goodWindows':
      'Horas favoráveis à travessia destacadas. Prefira pernas com luz do dia.',
    'hourly.fewCalm':
      'Poucas horas calmas — considere esperar ou abraçar o sotavento abrigado das ilhas.',
    'hourly.th.time': 'Hora',
    'hourly.th.wx': 'Tempo',
    'hourly.th.wind': 'Vento',
    'hourly.th.gust': 'Rajada',
    'hourly.th.dir': 'Dir',
    'hourly.th.swell': 'Ondulação',
    'hourly.th.per': 'Per',
    'hourly.th.swellDir': 'Dir ond.',
    'hourly.th.rain': 'Chuva%',
    'hourly.th.vis': 'Vis',
    'hourly.th.cross': 'Trav.',

    // Weekly
    'weekly.title': 'Resumo marinho de 1 semana',
    'weekly.subtitle': 'Dia a dia no ponto exposto do meio da travessia',
    'weekly.windMax': 'Vento máx',
    'weekly.dir': 'Dir',
    'weekly.swell': 'Ondulação',
    'weekly.swellDir': 'Dir ond.',
    'weekly.rain': 'Chuva',
    'weekly.crossing': 'Travessia: {label}',

    // Outlook
    'outlook.title': 'Perspectiva de 2 semanas',
    'outlook.subtitle': 'Tendência marinha mais grosseira (dias 8–16) · confiança cai com o alcance',
    'outlook.empty': 'Dias estendidos indisponíveis.',
    'outlook.th.day': 'Dia',
    'outlook.th.weather': 'Tempo',
    'outlook.th.windMax': 'Vento máx',
    'outlook.th.dir': 'Dir',
    'outlook.th.swellMax': 'Ond. máx',
    'outlook.th.period': 'Período',
    'outlook.th.rain': 'Chuva%',
    'outlook.th.lean': 'Tendência trav.',

    // Map / anchorages
    'map.popup.wind': 'Vento',
    'map.popup.waves': 'Ondas',
    'map.popup.gusts': 'Rajadas',
    'map.popup.swell': 'Ondulação',
    'map.windyTitle': 'Abrir este ponto no Windy',
    'anch.favorable': 'favorável',
    'anch.marginal': 'marginal',
    'anch.exposed': 'exposto',
    'anch.legend.favorable': 'Favorável',
    'anch.legend.marginal': 'Marginal',
    'anch.legend.exposed': 'Exposto',
    'anch.legend.hint': 'Avaliado para ~36 h de vento/ondulação vs setor de abrigo',
    'anch.list.swell': 'Ondulação {swell}',

    // Anchorage reasons
    'anch.reason.noWind': 'Dados de vento indisponíveis{swell}',
    'anch.reason.calm': 'Calmo ({speed} kn){swell}',
    'anch.reason.sheltered': 'Abrigo do vento de {dir}°; {speed} kn{swell}',
    'anch.reason.open': 'Aberto ao vento de {dir}°; {speed} kn{swell}',
    'anch.reason.dirUnknown': 'Direção do vento desconhecida; {speed} kn{swell}',
    'anch.swellBit': ' · ondulação {parts}',
    'anch.swellFrom': 'de {dir}°',

    // Format helpers
    'fmt.gustsOnly': 'rajadas {gust} kn ({kmh} km/h)',
    'fmt.gusts': 'rajadas {gust} kn',
    'fmt.windFrom': 'Vento de {label} (seta mostra para onde sopra)',
    'fmt.brt': 'BRT',

    // Weather codes
    'wx.0': 'Limpo',
    'wx.1': 'Predominantemente limpo',
    'wx.2': 'Parcialmente nublado',
    'wx.3': 'Nublado',
    'wx.45': 'Nevoeiro',
    'wx.48': 'Nevoeiro com geada',
    'wx.51': 'Garoa fraca',
    'wx.53': 'Garoa',
    'wx.55': 'Garoa forte',
    'wx.61': 'Chuva fraca',
    'wx.63': 'Chuva',
    'wx.65': 'Chuva forte',
    'wx.66': 'Chuva congelante',
    'wx.67': 'Chuva congelante forte',
    'wx.71': 'Neve fraca',
    'wx.73': 'Neve',
    'wx.75': 'Neve forte',
    'wx.77': 'Grãos de neve',
    'wx.80': 'Pancadas fracas',
    'wx.81': 'Pancadas',
    'wx.82': 'Pancadas fortes',
    'wx.85': 'Pancadas de neve',
    'wx.86': 'Pancadas de neve fortes',
    'wx.95': 'Trovoada',
    'wx.96': 'Trovoada com granizo',
    'wx.99': 'Trovoada severa',
    'wx.code': 'Código {code}',

    // Point / anchorage display names & notes
    'point.crossing': 'Meio da travessia (exposto)',
    'point.angra': 'Angra dos Reis',
    'point.abraao': 'Ilha Grande / Abraão',
    'point.paraty': 'Paraty',
    'anch.name.angra-marina': 'Angra dos Reis (aproximações da marina)',
    'note.abraao': 'Aproximações de Vila do Abraão (Navily).',
    'note.saco-do-ceu': 'Ancoragem norte de Saco do Céu (Navily).',
    'note.lagoa-azul': 'Ancoragem diurna oeste de Lagoa Azul (Navily) — entre Angra e Abraão.',
    'note.aracatiba': 'Água em frente à Praia de Araçatiba.',
    'note.sitio-forte': 'Água na enseada de Sítio Forte.',
    'note.feiticeira': 'Água em frente à Praia da Feiticeira (Ilha Grande).',
    'note.enseada-das-palmas': 'Enseada das Palmas (E da Ilha Grande) — água na baía.',
    'note.mangue': 'Praia do Mangue (área Palmas / Abraão) — água em frente à praia.',
    'note.parnaioca': 'Água em frente à Praia do Parnaioca (Navily).',
    'note.angra-marina': 'Água de aproximação da marina / porto de Angra dos Reis.',
    'note.japuiba': 'Água na Enseada de Japuíba.',
    'note.flecha': 'Água na enseada da Ilha da Gipóia (Flechas).',
    'note.dentista': 'Jurubaíba / Dentista — água logo em frente à praia da Gipóia.',
    'note.sandy': 'Aproximações de Ilha Sandri / Praia dos Coelhos.',
    'note.cotia': 'Água a sotavento NNE da Ilha da Cutia (Navily).',
    'note.cedro': 'Enseada norte da Ilha do Cedro (Navily).',
    'note.bom-jardim': 'Água em frente a Bom Jardim / praia particular.',
    'note.paraty-bay': 'Ancoragem da cidade na Baía de Paraty (Navily).',
    'note.paraty-mirim': 'Ancoragem na baía ao sul da barra do rio (Mina2).',
    'note.mamangua': 'Água interior do Saco de Mamanguá (Navily).',
    'note.ilha-do-mantimento': 'Água a oeste da Ilha do Mantimento.',
    'note.cajaiba': 'Praia Grande de Cajaíba — água em frente à praia.',
    'note.praia-do-sono': 'Água em frente à Praia do Sono.',
    'note.jabaquara': 'Água em frente à Praia de Jabaquara.',
  },

  en: {
    'doc.title': 'Angra ↔ Paraty Boating Forecast',
    'doc.description':
      'Boating weather for Angra dos Reis ↔ Paraty — wind, swell, anchorages, Marinha alerts.',

    'lang.switchToEn': 'English',
    'lang.switchToPt': 'Português',
    'lang.ariaToEn': 'Switch to English',
    'lang.ariaToPt': 'Switch to Portuguese',
    'header.eyebrow': 'Costa Verde · Ilha Grande Bay · RJ',
    'header.title': 'Angra dos Reis ↔ Paraty',
    'header.tagline': 'Recreational coastal boating forecast — wind, swell & shelter',
    'header.loading': 'Loading…',
    'header.updating': 'Updating…',
    'header.refresh': 'Refresh',
    'header.lastUpdated': 'Last updated {time}',
    'header.forecastUnavailable': 'Forecast unavailable · {time}',

    'map.title': 'Interactive map',
    'map.subtitle': 'Wind barbs at sample points · anchorage pins scored for next 1–2 days',
    'map.aria': 'Map of Angra to Paraty corridor',

    'footer.sources':
      'Weather & marine: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> (no API key). Alerts: try <a href="https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo" target="_blank" rel="noopener">Marinha CHM Avisos de Mau Tempo</a> (METAREA V). Not official navigation advice — always check Marinha / Capitanias before casting off.',
    'footer.meta': 'Auto-refresh ~1 h · Times in America/Sao_Paulo (BRT)',

    'alerts.activeTitle': 'Marinha do Brasil — Avisos de Mau Tempo',
    'alerts.quietTitle': 'Marinha do Brasil alerts',
    'alerts.checked': 'Checked {time}',
    'alerts.lastCheck': 'Last check {time}',
    'alerts.none': 'No active Marinha alerts for this area',
    'alerts.verify': 'Verify on CHM ↗',
    'alerts.official': 'Official aviso ↗',
    'alerts.fetchNote':
      'Fetch note: {detail} — banner degrades gracefully when CHM blocks automated access.',
    'alerts.severity.extreme': 'extreme',
    'alerts.severity.severe': 'severe',
    'alerts.severity.moderate': 'moderate',
    'alerts.severity.info': 'info',

    'summary.title': 'Crossing briefing',
    'summary.sentence1':
      'Next 24–48 h on the Angra dos Reis ↔ Paraty corridor: open-water crossing looks <strong class="{cls}">{label}</strong> based on mid-bay wind and swell.',
    'summary.sentence2':
      'Exposed point ({name}): peaks near {gust} kn gusts and {swell} m seas (period ~{period} s).',
    'summary.sentence3':
      'Better crossing windows (local time): {windows}. Always cross with daylight and a margin for afternoon sea breeze.',
    'summary.noWindow': 'no calm window stands out',
    'summary.chipCrossing': 'Crossing: {label}',
    'summary.chipWind': 'Wind {wind}',
    'summary.chipSwell': 'Swell {swell}',
    'summary.updated': 'Updated {time} · timezone America/Sao_Paulo (BRT)',
    'summary.partial':
      'Partial forecast: one Open-Meteo feed is unavailable; showing the data that loaded.',
    'summary.unavailableTitle': 'Forecast data is temporarily unavailable',
    'summary.unavailableBody':
      'Marinha alerts are still shown above. Weather and marine data will appear when Open-Meteo responds.',
    'summary.errorTitle': 'Could not load forecast',
    'summary.errorBody': 'Marinha alerts are still available above. {err}',
    'summary.errorHint':
      'Open-Meteo may be rate-limiting this network. Try Refresh in a minute.',

    'crossing.pleasant': 'pleasant',
    'crossing.lumpy': 'lumpy',
    'crossing.uncomfortable': 'uncomfortable',
    'crossing.not recommended': 'not recommended',
    'crossing.unknown': 'unknown',

    'hourly.title': 'Detailed 1-day (mid-crossing)',
    'hourly.subtitle':
      'Mid-crossing / exposed point · wind kn · swell m / period s · every {step} h',
    'hourly.goodWindows':
      'Crossing-friendly hours highlighted. Prefer daylight legs.',
    'hourly.fewCalm':
      'Few calm hours — consider waiting or hugging the sheltered island lee.',
    'hourly.th.time': 'Time',
    'hourly.th.wx': 'Wx',
    'hourly.th.wind': 'Wind',
    'hourly.th.gust': 'Gust',
    'hourly.th.dir': 'Dir',
    'hourly.th.swell': 'Swell',
    'hourly.th.per': 'Per',
    'hourly.th.swellDir': 'Swell dir',
    'hourly.th.rain': 'Rain%',
    'hourly.th.vis': 'Vis',
    'hourly.th.cross': 'Cross',

    'weekly.title': '1-week marine summary',
    'weekly.subtitle': 'Day-by-day at the exposed mid-crossing point',
    'weekly.windMax': 'Wind max',
    'weekly.dir': 'Dir',
    'weekly.swell': 'Swell',
    'weekly.swellDir': 'Swell dir',
    'weekly.rain': 'Rain',
    'weekly.crossing': 'Crossing: {label}',

    'outlook.title': '2-week outlook',
    'outlook.subtitle': 'Coarser marine trend (days 8–16) · confidence drops with range',
    'outlook.empty': 'Extended days unavailable.',
    'outlook.th.day': 'Day',
    'outlook.th.weather': 'Weather',
    'outlook.th.windMax': 'Wind max',
    'outlook.th.dir': 'Dir',
    'outlook.th.swellMax': 'Swell max',
    'outlook.th.period': 'Period',
    'outlook.th.rain': 'Rain%',
    'outlook.th.lean': 'Crossing lean',

    'map.popup.wind': 'Wind',
    'map.popup.waves': 'Waves',
    'map.popup.gusts': 'Gusts',
    'map.popup.swell': 'Swell',
    'map.windyTitle': 'Open this spot in Windy',
    'anch.favorable': 'favorable',
    'anch.marginal': 'marginal',
    'anch.exposed': 'exposed',
    'anch.legend.favorable': 'Favorable',
    'anch.legend.marginal': 'Marginal',
    'anch.legend.exposed': 'Exposed',
    'anch.legend.hint': 'Scored for next ~36 h wind/swell vs shelter sector',
    'anch.list.swell': 'Swell {swell}',

    'anch.reason.noWind': 'Wind data unavailable{swell}',
    'anch.reason.calm': 'Calm ({speed} kn){swell}',
    'anch.reason.sheltered': 'Sheltered from {dir}° wind; {speed} kn{swell}',
    'anch.reason.open': 'Open to {dir}° wind; {speed} kn{swell}',
    'anch.reason.dirUnknown': 'Wind dir unknown; {speed} kn{swell}',
    'anch.swellBit': ' · swell {parts}',
    'anch.swellFrom': 'from {dir}°',

    'fmt.gustsOnly': 'gusts {gust} kn ({kmh} km/h)',
    'fmt.gusts': 'gusts {gust} kn',
    'fmt.windFrom': 'Wind from {label} (arrow shows blow-to)',
    'fmt.brt': 'BRT',

    'wx.0': 'Clear',
    'wx.1': 'Mainly clear',
    'wx.2': 'Partly cloudy',
    'wx.3': 'Overcast',
    'wx.45': 'Fog',
    'wx.48': 'Rime fog',
    'wx.51': 'Light drizzle',
    'wx.53': 'Drizzle',
    'wx.55': 'Heavy drizzle',
    'wx.61': 'Light rain',
    'wx.63': 'Rain',
    'wx.65': 'Heavy rain',
    'wx.66': 'Freezing rain',
    'wx.67': 'Heavy freezing rain',
    'wx.71': 'Light snow',
    'wx.73': 'Snow',
    'wx.75': 'Heavy snow',
    'wx.77': 'Snow grains',
    'wx.80': 'Light showers',
    'wx.81': 'Showers',
    'wx.82': 'Heavy showers',
    'wx.85': 'Snow showers',
    'wx.86': 'Heavy snow showers',
    'wx.95': 'Thunderstorm',
    'wx.96': 'Thunderstorm + hail',
    'wx.99': 'Severe thunderstorm',
    'wx.code': 'Code {code}',

    'point.crossing': 'Mid crossing (exposed)',
    'point.angra': 'Angra dos Reis',
    'point.abraao': 'Ilha Grande / Abraão',
    'point.paraty': 'Paraty',
    'anch.name.angra-marina': 'Angra dos Reis (marina approaches)',
    'note.abraao': 'Vila do Abraão approaches (Navily).',
    'note.saco-do-ceu': 'Saco do Céu N anchorage (Navily).',
    'note.lagoa-azul': 'Lagoa Azul West day anchorage (Navily) — between Angra and Abraão.',
    'note.aracatiba': 'Water off Praia de Araçatiba.',
    'note.sitio-forte': 'Enseada de Sítio Forte cove water.',
    'note.feiticeira': 'Water off Praia da Feiticeira (Ilha Grande).',
    'note.enseada-das-palmas': 'Enseada das Palmas (E Ilha Grande) — water in the bay.',
    'note.mangue': 'Praia do Mangue (Palmas / Abraão area) — water off beach.',
    'note.parnaioca': 'Water off Praia do Parnaioca (Navily).',
    'note.angra-marina': 'Angra dos Reis marina / port approach water.',
    'note.japuiba': 'Enseada de Japuíba water.',
    'note.flecha': 'Ilha da Gipóia cove water (Flechas).',
    'note.dentista': 'Jurubaíba / Dentista — water just off Gipóia beach.',
    'note.sandy': 'Ilha Sandri / Praia dos Coelhos approaches.',
    'note.cotia': 'Ilha da Cutia Nord lee water (Navily).',
    'note.cedro': 'Ilha do Cedro northern cove (Navily).',
    'note.bom-jardim': 'Water off Bom Jardim / private beach.',
    'note.paraty-bay': 'Baía de Paraty town anchorage (Navily).',
    'note.paraty-mirim': 'Bay anchorage S of river bar (Mina2).',
    'note.mamangua': 'Saco de Mamanguá inner water (Navily).',
    'note.ilha-do-mantimento': 'West-side water off Ilha do Mantimento.',
    'note.cajaiba': 'Praia Grande de Cajaíba — water off beach.',
    'note.praia-do-sono': 'Water off Praia do Sono.',
    'note.jabaquara': 'Water off Praia de Jabaquara.',
  },
};

let currentLang = DEFAULT_LANG;
const listeners = new Set();

function readStoredLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'en' || v === 'pt-BR') return v;
  } catch {
    /* private mode */
  }
  return DEFAULT_LANG;
}

export function getLang() {
  return currentLang;
}

export function getLocale() {
  return currentLang === 'en' ? 'en-GB' : 'pt-BR';
}

export function t(key, vars = {}) {
  const table = STRINGS[currentLang] || STRINGS[DEFAULT_LANG];
  let s = table[key] ?? STRINGS[DEFAULT_LANG][key] ?? STRINGS.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, v == null ? '' : String(v));
  }
  return s;
}

export function crossingLabel(label) {
  return t(`crossing.${label}`);
}

export function anchorageStatus(status) {
  return t(`anch.${status}`);
}

export function severityLabel(sev) {
  return t(`alerts.severity.${sev}`);
}

export function pointDisplayName(pt) {
  const key = `point.${pt.id}`;
  const translated = t(key);
  return translated === key ? pt.name : translated;
}

export function anchorageDisplayName(a) {
  const key = `anch.name.${a.id}`;
  const translated = t(key);
  return translated === key ? a.name : translated;
}

export function anchorageNote(a) {
  const key = `note.${a.id}`;
  const translated = t(key);
  return translated === key ? a.note || '' : translated;
}

export function applyDocumentLang() {
  document.documentElement.lang = currentLang;
  document.title = t('doc.title');
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', t('doc.description'));
}

export function setLang(next) {
  const lang = next === 'en' ? 'en' : 'pt-BR';
  if (lang === currentLang) return;
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  applyDocumentLang();
  for (const cb of listeners) {
    try {
      cb(lang);
    } catch (err) {
      console.error(err);
    }
  }
}

export function toggleLang() {
  setLang(currentLang === 'en' ? 'pt-BR' : 'en');
}

export function onLangChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function initI18n() {
  currentLang = readStoredLang();
  applyDocumentLang();
  return currentLang;
}

export function langButtonLabel() {
  return currentLang === 'pt-BR' ? t('lang.switchToEn') : t('lang.switchToPt');
}

export function langButtonAria() {
  return currentLang === 'pt-BR' ? t('lang.ariaToEn') : t('lang.ariaToPt');
}
