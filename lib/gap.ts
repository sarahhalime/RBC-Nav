import { COHORTS, CURRENT_WEEK, DIM_IDS, dimShort } from "./constants";
import { applyPrivacy, sliceOf } from "./privacy";
import type {
  Alert,
  Cohort,
  ConsentLevel,
  DimensionExperience,
  DimensionId,
  Filter,
  GapRow,
  GapSnapshot,
  Intern,
  Intervention,
  TapEvent,
} from "./types";

/** Blend weights. Shown to users in the "How scores work" tooltip. */
export const BLEND = { self: 0.6, tap: 0.4, threshold: 0.5 } as const;

export const EXPECTED_RATING = 4;

export function experienceScore(e: DimensionExperience): number {
  return BLEND.self * e.self + BLEND.tap * Math.min(1, e.taps);
}

export function isExperienced(e: DimensionExperience, week: number = CURRENT_WEEK): boolean {
  if (week >= CURRENT_WEEK) return experienceScore(e) >= BLEND.threshold;
  return !!e.history[week - 1];
}

export function isExpected(intern: Intern, dim: DimensionId): boolean {
  return intern.expectations[dim] >= EXPECTED_RATING;
}

/**
 * Applies live tap events on top of the seed. Returns new objects only for interns that changed.
 * Events from interns at Vault level 1 still update their own data, but `contributors()`
 * keeps them out of every aggregate.
 */
export function applyEvents(
  seed: Intern[],
  events: TapEvent[],
  overrides: Record<string, { consentLevel?: ConsentLevel }> = {},
): Intern[] {
  const byId = new Map<string, Intern>();
  const get = (id: string) => {
    let it = byId.get(id);
    if (!it) {
      const base = seed.find((s) => s.id === id);
      if (!base) return undefined;
      it = {
        ...base,
        experience: Object.fromEntries(
          DIM_IDS.map((d) => [d, { ...base.experience[d] }]),
        ) as Intern["experience"],
      };
      byId.set(id, it);
    }
    return it;
  };

  for (const ev of events) {
    if (ev.status === "pending") continue;
    const it = get(ev.internId);
    if (!it) continue;
    for (const d of ev.dimensions) it.experience[d].taps += 1;
    if (ev.kind === "connect") it.connections += 1;
  }
  for (const [id, o] of Object.entries(overrides)) {
    if (o.consentLevel) {
      const it = get(id);
      if (it) it.consentLevel = o.consentLevel;
    }
  }
  if (byId.size === 0) return seed;
  return seed.map((s) => byId.get(s.id) ?? s);
}

function pct(count: number, n: number) {
  return n === 0 ? 0 : (count / n) * 100;
}

export function confidenceFor(n: number): GapSnapshot["confidence"] {
  if (n >= 100) return "High";
  if (n >= 30) return "Medium";
  return "Low";
}

function gapAtWeek(slice: Intern[], dim: DimensionId, week: number) {
  const n = slice.length;
  let exp = 0;
  let got = 0;
  for (const it of slice) {
    if (isExpected(it, dim)) exp++;
    if (isExperienced(it.experience[dim], week)) got++;
  }
  const expectedPct = Math.round(pct(exp, n));
  const experiencedPct = Math.round(pct(got, n));
  return { expectedPct, experiencedPct, gap: expectedPct - experiencedPct };
}

/** Gap = % who expected it minus % who report experiencing it, for every dimension. */
export function computeGap(interns: Intern[], filter: Filter): GapSnapshot {
  const privacy = applyPrivacy(interns, filter);
  const week = Math.min(CURRENT_WEEK, Math.max(1, filter.weekEnd));
  if (privacy.hidden) {
    return {
      hidden: true,
      n: privacy.n,
      week,
      confidence: "Low",
      rows: [],
      reason: privacy.message,
    };
  }
  const slice = sliceOf(interns, filter);
  const n = slice.length;
  const start = Math.max(1, Math.min(filter.weekStart, week));

  const rows: GapRow[] = DIM_IDS.map((dim) => {
    const history: number[] = [];
    for (let w = start; w <= week; w++) history.push(gapAtWeek(slice, dim, w).gap);
    const now = gapAtWeek(slice, dim, week);
    const twoAgo = gapAtWeek(slice, dim, Math.max(1, week - 2));
    let experiencedCount = 0;
    let tapBacked = 0;
    for (const it of slice) {
      const e = it.experience[dim];
      if (isExperienced(e, CURRENT_WEEK)) {
        experiencedCount++;
        if (e.taps > 0) tapBacked++;
      }
    }
    return {
      dimension: dim,
      ...now,
      history,
      trend: now.gap - twoAgo.gap,
      tapShare: experiencedCount ? Math.round((tapBacked / experiencedCount) * 100) : 0,
    };
  });

  return { hidden: false, n, week, confidence: confidenceFor(n), rows };
}

/** Gap change per week over the last `weeks` weeks. Positive means the gap is widening. */
export function gapVelocity(history: number[], weeks = 2): number {
  if (history.length < 2) return 0;
  const span = Math.min(weeks, history.length - 1);
  return (history[history.length - 1] - history[history.length - 1 - span]) / span;
}

export const ALERT_THRESHOLD = 8;

const SUGGESTED: Record<DimensionId, { action: string; interventionId: string }> = {
  mentor_access: { action: "structured mentor check-ins", interventionId: "mentor_coffee" },
  cross_team: { action: "a cross-team rotation day", interventionId: "rotation_day" },
  career_clarity: { action: "a career path workshop", interventionId: "career_workshop" },
  senior_access: { action: "a senior leader AMA", interventionId: "senior_ama" },
  feedback: { action: "a feedback cadence nudge for managers", interventionId: "feedback_nudge" },
  network: { action: "a cross-team rotation day", interventionId: "rotation_day" },
  meaningful_work: { action: "a project scoping review with managers", interventionId: "feedback_nudge" },
  learning: { action: "a career path workshop", interventionId: "career_workshop" },
  belonging: { action: "mentor coffee chats", interventionId: "mentor_coffee" },
};

/** Cohort-level early warning. Never computed for individuals or for suppressed slices. */
export function cohortAlerts(interns: Intern[], weekEnd = CURRENT_WEEK): Alert[] {
  const alerts: Alert[] = [];
  for (const cohort of COHORTS) {
    const snap = computeGap(interns, { cohorts: [cohort], areas: [], weekStart: 1, weekEnd });
    if (snap.hidden) continue;
    for (const row of snap.rows) {
      const change = Math.round(gapVelocity(row.history, 2) * 2);
      if (change >= ALERT_THRESHOLD) {
        const s = SUGGESTED[row.dimension];
        alerts.push({
          id: `${cohort}-${row.dimension}`,
          cohort,
          dimension: row.dimension,
          change,
          weeks: 2,
          severity: change >= 11 ? "act" : "watch",
          message: `${cohort}: ${dimShort(row.dimension)} gap widened ${change} pts in 2 weeks.`,
          action: `Suggested action: ${s.action}.`,
          interventionId: s.interventionId,
        });
      }
    }
  }
  return alerts.sort((a, b) => b.change - a.change);
}

export const RETENTION_WEIGHTS = { widening: 0.6, intent: 0.4, wideningCap: 12, intentCap: 0.15 };

export interface RetentionPressure {
  cohort: Cohort;
  hidden: boolean;
  index: number;
  band: "Low" | "Elevated" | "High";
  widening: number;
  intentShare: number;
  n: number;
}

/**
 * Directional cohort index (0 to 100):
 *   60% x (average widening of the top 3 widening gaps over 2 weeks / 12 pts, capped at 1)
 * + 40% x (share of opt-in reflections mentioning intent to leave / 15%, capped at 1)
 * Only opt-in reflections count. Missing reflections are never treated as risk.
 */
export function retentionPressure(interns: Intern[], cohort: Cohort): RetentionPressure {
  const snap = computeGap(interns, { cohorts: [cohort], areas: [], weekStart: 1, weekEnd: CURRENT_WEEK });
  if (snap.hidden) {
    return { cohort, hidden: true, index: 0, band: "Low", widening: 0, intentShare: 0, n: snap.n };
  }
  const widenings = snap.rows
    .map((r) => r.trend)
    .filter((t) => t > 0)
    .sort((a, b) => b - a)
    .slice(0, 3);
  const widening = widenings.length ? widenings.reduce((a, b) => a + b, 0) / 3 : 0;
  const slice = sliceOf(interns, { cohorts: [cohort], areas: [] });
  const optIn = slice.reduce((a, i) => a + i.reflections.optIn, 0);
  const leave = slice.reduce((a, i) => a + i.reflections.leaveMentions, 0);
  const intentShare = optIn ? leave / optIn : 0;
  const w = RETENTION_WEIGHTS;
  const index = Math.round(
    100 *
      (w.widening * Math.min(1, widening / w.wideningCap) +
        w.intent * Math.min(1, intentShare / w.intentCap)),
  );
  const band = index >= 60 ? "High" : index >= 35 ? "Elevated" : "Low";
  return { cohort, hidden: false, index, band, widening, intentShare, n: snap.n };
}

export const INTERVENTIONS: Intervention[] = [
  {
    id: "mentor_coffee",
    name: "Mentor coffee chat program",
    description: "Biweekly 30 minute mentor chats with a shared agenda and a Nav station tap.",
    effects: { mentor_access: 14, feedback: 4, belonging: 3 },
    cost: "$",
    costNote: "Under $5K: coffee budget and scheduling time",
    effortWeeks: 2,
    owner: "Early Talent Program Office",
  },
  {
    id: "rotation_day",
    name: "Cross-team rotation day",
    description: "One day each month interns shadow a partner team, then share back at a cross-team lunch.",
    effects: { cross_team: 16, network: 7, career_clarity: 4 },
    cost: "$$",
    costNote: "$5K to $25K: host team time and lunch",
    effortWeeks: 4,
    owner: "Business area leads with Early Talent",
  },
  {
    id: "career_workshop",
    name: "Career path workshop",
    description: "Recent grads walk through real RBC career paths and return-offer timelines.",
    effects: { career_clarity: 15, senior_access: 3, learning: 3 },
    cost: "$",
    costNote: "Under $5K: speaker time and room",
    effortWeeks: 3,
    owner: "Talent Development",
  },
  {
    id: "senior_ama",
    name: "Senior leader AMA",
    description: "Monthly 45 minute open AMA with a VP or above, questions collected anonymously.",
    effects: { senior_access: 13, career_clarity: 4, belonging: 2 },
    cost: "$",
    costNote: "Under $5K: leader time only",
    effortWeeks: 1,
    owner: "Executive sponsor office",
  },
  {
    id: "feedback_nudge",
    name: "Feedback cadence nudge",
    description: "A gentle biweekly nudge to managers with a 3 question feedback template.",
    effects: { feedback: 11, mentor_access: 3, meaningful_work: 2 },
    cost: "$",
    costNote: "Under $5K: uses existing Teams and Outlook",
    effortWeeks: 1,
    owner: "HR Business Partners",
  },
];

/** Diminishing returns curve. 0 at intensity 0, 1 at intensity 100. */
export function intensityCurve(intensity: number) {
  const t = Math.max(0, Math.min(100, intensity)) / 100;
  return (1 - Math.exp(-2.2 * t)) / (1 - Math.exp(-2.2));
}

/**
 * Illustrative projection only: projected gap = current gap - max effect x curve(intensity).
 * Coefficients in INTERVENTIONS are documented assumptions to be validated in a pilot.
 */
export function simulateIntervention(
  rows: GapRow[],
  intervention: Intervention,
  intensity: number,
): Record<DimensionId, number> {
  const k = intensityCurve(intensity);
  const out = {} as Record<DimensionId, number>;
  for (const r of rows) {
    const effect = intervention.effects[r.dimension] ?? 0;
    out[r.dimension] = Math.max(0, Math.round(r.gap - effect * k));
  }
  return out;
}

/** Personal view for one intern: expectation (1 to 5) vs experience (1 to 5). */
export function personalGap(intern: Intern) {
  return DIM_IDS.map((d) => {
    const e = intern.experience[d];
    const score = experienceScore(e);
    return {
      dimension: d,
      expected: intern.expectations[d],
      experienced: Math.round((1 + score * 4) * 10) / 10,
      score,
      tapVerified: e.taps > 0,
      gap: Math.max(0, intern.expectations[d] - (1 + score * 4)),
    };
  });
}
