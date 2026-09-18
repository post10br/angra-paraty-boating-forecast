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
export function scoreAnchorage(anchorage, conditions) {
  const windKn = conditions.windKn;
  const gustKn = conditions.gustKn;
  const windDir = conditions.windDir;
  const swellM = conditions.swellM ?? 0;
  const periodS = conditions.periodS ?? 8;
  const q = anchorage.quality ?? 3;

  const hasSpeed = windKn != null || gustKn != null;
  const hasDir = windDir != null && !Number.isNaN(windDir);
  const v = hasSpeed ? Math.max(windKn ?? 0, (gustKn ?? 0) * 0.85) : null;

  // Missing wind (common when weather API is rate-limited): never invent 0° / Exposed
  if (v == null && !hasDir) {
    const h = swellM * (periodS < 6 ? 1.3 : 1);
    let score = 55 + q * 4;
    if (h > 1.2) score -= 15;
    if (h > 1.8) score -= 15;
    score = Math.max(0, Math.min(100, Math.round(score)));
    const status = score >= 65 ? 'favorable' : score >= 45 ? 'marginal' : 'exposed';
    return {
      status,
      score,
      reason: h > 0.3 ? `Wind data unavailable · swell ~${h.toFixed(1)} m` : 'Wind data unavailable',
      sheltered: null,
    };
  }

  // Truly calm: treat as favorable regardless of sector
  if (v != null && v < 3) {
    return {
      status: 'favorable',
      score: 88,
      reason: `Calm (${v.toFixed(0)} kn)`,
      sheltered: true,
    };
  }

  const speed = v ?? 0;
  const sheltered = hasDir ? isSheltered(windDir, anchorage.shelterFrom) : null;

  let score = 50;
  if (sheltered === true) score += 15 + q * 5;
  else if (sheltered === false) score -= 10 + Math.min(speed, 25);
  else score += q * 3; // direction unknown

  if (speed < 10) score += 15;
  else if (speed < 15) score += 5;
  else if (speed < 20) score -= 10;
  else score -= 25;

  const h = swellM * (periodS < 6 ? 1.3 : 1);
  if (sheltered === true) {
    if (h > 1.5) score -= 10;
  } else if (sheltered === false) {
    if (h > 0.8) score -= 15;
    if (h > 1.5) score -= 20;
  } else if (h > 1.2) {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let status;
  if (score >= 65) status = 'favorable';
  else if (score >= 45) status = 'marginal';
  else status = 'exposed';

  let reason;
  if (sheltered === true) reason = `Sheltered from ${Math.round(windDir)}° wind; ${speed.toFixed(0)} kn`;
  else if (sheltered === false) reason = `Open to ${Math.round(windDir)}° wind; ${speed.toFixed(0)} kn`;
  else reason = `Wind dir unknown; ${speed.toFixed(0)} kn`;

  return { status, score, reason, sheltered };
}
