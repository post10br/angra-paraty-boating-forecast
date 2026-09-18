import { t } from './i18n.js';

/**
 * Crossing comfort for Angra ↔ Paraty exposed open-water leg.
 * Uses mid-crossing wind + swell/wave height + period.
 *
 * Labels: pleasant | lumpy | uncomfortable | not recommended
 */

function windScore(kn, gust) {
  const v = Math.max(kn ?? 0, (gust ?? 0) * 0.85);
  if (v < 10) return 0;
  if (v < 15) return 1;
  if (v < 20) return 2;
  return 3;
}

function swellScore(height, period) {
  const h = height ?? 0;
  const p = period ?? 8;
  // Short period makes same height feel worse (chop)
  const effective = p < 6 ? h * 1.35 : p < 8 ? h * 1.15 : h;
  if (effective < 0.7) return 0;
  if (effective < 1.2) return 1;
  if (effective < 1.8) return 2;
  return 3;
}

const LABELS = ['pleasant', 'lumpy', 'uncomfortable', 'not recommended'];

export function scoreHour({ windKn, gustKn, swellM, periodS, waveM }) {
  const height = swellM ?? waveM ?? 0;
  const period = periodS ?? 8;
  const score = Math.max(windScore(windKn, gustKn), swellScore(height, period));
  return {
    score,
    label: LABELS[score],
    windKn,
    gustKn,
    height,
    period,
  };
}

export function summarizeCrossing(hours) {
  if (!hours?.length) {
    return {
      label: 'unknown',
      sentence: 'Crossing comfort could not be assessed (missing marine data).',
      bestWindows: [],
      worstLabel: 'unknown',
    };
  }

  const scored = hours.map((h) => ({ ...h, ...scoreHour(h) }));
  const maxScore = Math.max(...scored.map((s) => s.score));
  const avgScore = scored.reduce((a, s) => a + s.score, 0) / scored.length;
  const overall = Math.max(maxScore >= 3 && scored.filter((s) => s.score >= 3).length >= 3 ? 3 : Math.round(avgScore), Math.min(maxScore, 2) === 2 && avgScore >= 1.5 ? 2 : Math.round(avgScore));
  // Prefer worst meaningful condition over next 24–48h
  const label = LABELS[Math.min(3, Math.max(overall, maxScore >= 3 ? 3 : maxScore >= 2 && avgScore >= 1.2 ? 2 : Math.round(avgScore)))];

  // Best windows: contiguous hours with score <= 1
  const bestWindows = [];
  let run = null;
  for (const s of scored) {
    if (s.score <= 1) {
      if (!run) run = { start: s.time, end: s.time, maxScore: s.score };
      else {
        run.end = s.time;
        run.maxScore = Math.max(run.maxScore, s.score);
      }
    } else if (run) {
      bestWindows.push(run);
      run = null;
    }
  }
  if (run) bestWindows.push(run);

  return {
    label,
    scored,
    bestWindows,
    worstLabel: LABELS[maxScore],
  };
}

/** Whether wind direction falls in any shelter sector [from,to] (degrees, may wrap). */
export function isSheltered(windDeg, sectors) {
  if (windDeg == null || !sectors?.length) return false;
  const d = ((windDeg % 360) + 360) % 360;
  return sectors.some(([a, b]) => {
    if (a <= b) return d >= a && d <= b;
    return d >= a || d <= b; // wrap
  });
}

/**
 * Score anchorage favorability for next 24–48h given expected wind/swell at nearest point.
 * Returns { status: 'favorable'|'marginal'|'exposed', score: 0-100, reason }
 */
function effectiveSwell(swellM, periodS) {
  const h = swellM ?? 0;
  const p = periodS ?? 8;
  // Short period = choppier / more uncomfortable at the same height
  return p < 6 ? h * 1.35 : p < 8 ? h * 1.15 : h;
}

function applySwellToScore(score, anchorage, sheltered, swellM, periodS, swellDir) {
  const h = effectiveSwell(swellM, periodS);
  const swellSheltered =
    swellDir != null && !Number.isNaN(swellDir)
      ? isSheltered(swellDir, anchorage.shelterFrom)
      : sheltered;

  if (swellSheltered === true) {
    if (h > 1.2) score -= 8;
    if (h > 1.8) score -= 12;
  } else if (swellSheltered === false) {
    if (h > 0.6) score -= 10;
    if (h > 1.0) score -= 15;
    if (h > 1.5) score -= 20;
  } else {
    if (h > 0.8) score -= 8;
    if (h > 1.4) score -= 12;
  }
  // Very short period always hurts a bit more at anchor
  if ((periodS ?? 8) < 6 && h > 0.5) score -= 5;
  return score;
}

function swellReasonBits(swellM, periodS, swellDir) {
  if (swellM == null && periodS == null && swellDir == null) return '';
  const parts = [];
  if (swellM != null) parts.push(`${Number(swellM).toFixed(1)} m`);
  if (periodS != null) parts.push(`${Math.round(periodS)} s`);
  if (swellDir != null) parts.push(t('anch.swellFrom', { dir: Math.round(swellDir) }));
  return parts.length ? t('anch.swellBit', { parts: parts.join(' / ') }) : '';
}

export function scoreAnchorage(anchorage, conditions) {
  const windKn = conditions.windKn;
  const gustKn = conditions.gustKn;
  const windDir = conditions.windDir;
  const swellM = conditions.swellM;
  const periodS = conditions.periodS;
  const swellDir = conditions.swellDir;
  const q = anchorage.quality ?? 3;

  const hasSpeed = windKn != null || gustKn != null;
  const hasDir = windDir != null && !Number.isNaN(windDir);
  const v = hasSpeed ? Math.max(windKn ?? 0, (gustKn ?? 0) * 0.85) : null;
  const swellBit = swellReasonBits(swellM, periodS, swellDir);

  // Missing wind: score from swell / period / direction only
  if (v == null && !hasDir) {
    let score = 55 + q * 4;
    score = applySwellToScore(score, anchorage, null, swellM ?? 0, periodS ?? 8, swellDir);
    score = Math.max(0, Math.min(100, Math.round(score)));
    const status = score >= 65 ? 'favorable' : score >= 45 ? 'marginal' : 'exposed';
    return {
      status,
      score,
      reason: t('anch.reason.noWind', { swell: swellBit }),
      sheltered: null,
      swellM,
      periodS,
      swellDir,
    };
  }

  // Calm wind: still apply swell (surge/chop can ruin a calm anchorage)
  if (v != null && v < 3) {
    let score = 88;
    score = applySwellToScore(score, anchorage, true, swellM ?? 0, periodS ?? 8, swellDir);
    score = Math.max(0, Math.min(100, Math.round(score)));
    const status = score >= 65 ? 'favorable' : score >= 45 ? 'marginal' : 'exposed';
    return {
      status,
      score,
      reason: t('anch.reason.calm', { speed: v.toFixed(0), swell: swellBit }),
      sheltered: true,
      swellM,
      periodS,
      swellDir,
    };
  }

  const speed = v ?? 0;
  const sheltered = hasDir ? isSheltered(windDir, anchorage.shelterFrom) : null;

  let score = 50;
  if (sheltered === true) score += 15 + q * 5;
  else if (sheltered === false) score -= 10 + Math.min(speed, 25);
  else score += q * 3;

  if (speed < 10) score += 15;
  else if (speed < 15) score += 5;
  else if (speed < 20) score -= 10;
  else score -= 25;

  score = applySwellToScore(score, anchorage, sheltered, swellM ?? 0, periodS ?? 8, swellDir);
  score = Math.max(0, Math.min(100, Math.round(score)));

  let status;
  if (score >= 65) status = 'favorable';
  else if (score >= 45) status = 'marginal';
  else status = 'exposed';

  let reason;
  if (sheltered === true) {
    reason = t('anch.reason.sheltered', {
      dir: Math.round(windDir),
      speed: speed.toFixed(0),
      swell: swellBit,
    });
  } else if (sheltered === false) {
    reason = t('anch.reason.open', {
      dir: Math.round(windDir),
      speed: speed.toFixed(0),
      swell: swellBit,
    });
  } else {
    reason = t('anch.reason.dirUnknown', {
      speed: speed.toFixed(0),
      swell: swellBit,
    });
  }

  return { status, score, reason, sheltered, swellM, periodS, swellDir };
}
