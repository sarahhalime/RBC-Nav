/**
 * Shared state for the live NFC demo (Intern card, Leadership card, presentation display).
 * Pure logic only: no Firebase imports, so it is unit tested and reused by every screen.
 * All names, points and awards are synthetic.
 */

export const INITIAL_POINTS = 1250;
export const AWARD_POINTS = 250;
/** Hard ceiling so a stuck button or a script cannot run the counter away during a demo. */
export const MAX_AWARDS = 40;
export const MAX_MESSAGE = 280;

export const CATEGORIES = [
  "Collaboration",
  "Innovation",
  "Leadership",
  "Continuous Learning",
  "Making a Difference",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const SUGGESTED_MESSAGES: Record<Category, string> = {
  Collaboration: "Maya brought three teams together to ship the payments fix ahead of schedule.",
  Innovation: "Maya's prototype for instant receipts gave us a new way to think about the client experience.",
  Leadership: "Maya stepped up to run our sprint demo and made space for every voice in the room.",
  "Continuous Learning": "Maya picked up Kotlin coroutines in two weeks and taught the rest of the interns.",
  "Making a Difference": "Maya's accessibility fixes mean more clients can bank with confidence.",
};

/** Fictional Wrapped statistics from the brief. Recognition is live, everything else is fixed. */
export const WRAPPED_STATS = {
  weeks: 16,
  skills: 12,
  connections: 18,
  projects: 6,
  milestones: 8,
} as const;

export interface Recognition {
  id: string;
  category: Category;
  message: string;
  points: number;
  pointsBefore: number;
  pointsAfter: number;
  at: number;
}

export interface LiveDemoState {
  internName: string;
  recognitionPoints: number;
  wrappedUnlocked: boolean;
  /** Increments on every Unlock press so the display can replay Wrapped on demand. */
  unlockCount: number;
  unlockedAt: number | null;
  /** Keyed by submission id. The key is what makes awards idempotent. */
  recognitions: Record<string, Recognition>;
  latestRecognition: Recognition | null;
  resetAt: number;
  updatedAt: number;
}

export function initialState(now = Date.now()): LiveDemoState {
  return {
    internName: "Maya Patel",
    recognitionPoints: INITIAL_POINTS,
    wrappedUnlocked: false,
    unlockCount: 0,
    unlockedAt: null,
    recognitions: {},
    latestRecognition: null,
    resetAt: now,
    updatedAt: now,
  };
}

/** Firebase drops empty objects and nulls, so fill defaults back in after a read. */
export function normalize(raw: unknown): LiveDemoState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<LiveDemoState>;
  const base = initialState(0);
  return {
    ...base,
    ...r,
    recognitions: r.recognitions ?? {},
    latestRecognition: r.latestRecognition ?? null,
    unlockedAt: r.unlockedAt ?? null,
  };
}

export function recognitionList(s: LiveDemoState): Recognition[] {
  return Object.values(s.recognitions).sort((a, b) => a.at - b.at);
}

const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const SESSION_RE = /^[a-z0-9-]{3,40}$/;

export function isValidSession(id: string) {
  return SESSION_RE.test(id);
}

export type AwardInput = { id: string; category: string; message: string };
export type AwardValidation = { ok: true; value: { id: string; category: Category; message: string } } | { ok: false; error: string };

export function validateAward(input: AwardInput): AwardValidation {
  if (!ID_RE.test(input.id)) return { ok: false, error: "Invalid submission id" };
  if (!CATEGORIES.includes(input.category as Category)) return { ok: false, error: "Pick a recognition category" };
  const message = input.message.trim();
  if (message.length < 3) return { ok: false, error: "Write a short recognition message" };
  if (message.length > MAX_MESSAGE) return { ok: false, error: `Keep the message under ${MAX_MESSAGE} characters` };
  return { ok: true, value: { id: input.id, category: input.category as Category, message } };
}

export type AwardResult =
  | { kind: "awarded"; state: LiveDemoState; recognition: Recognition }
  | { kind: "duplicate"; state: LiveDemoState; recognition: Recognition }
  | { kind: "limit"; state: LiveDemoState };

/**
 * Applies one award to the current state. Runs inside a database transaction, so it must be pure:
 * the same submission id never adds points twice.
 */
export function applyAward(current: LiveDemoState | null, award: { id: string; category: Category; message: string }, now: number): AwardResult {
  const state = current ?? initialState(now);
  const existing = state.recognitions[award.id];
  if (existing) return { kind: "duplicate", state, recognition: existing };
  if (Object.keys(state.recognitions).length >= MAX_AWARDS) return { kind: "limit", state };

  const recognition: Recognition = {
    id: award.id,
    category: award.category,
    message: award.message,
    points: AWARD_POINTS,
    pointsBefore: state.recognitionPoints,
    pointsAfter: state.recognitionPoints + AWARD_POINTS,
    at: now,
  };
  return {
    kind: "awarded",
    recognition,
    state: {
      ...state,
      recognitionPoints: recognition.pointsAfter,
      recognitions: { ...state.recognitions, [award.id]: recognition },
      latestRecognition: recognition,
      updatedAt: now,
    },
  };
}

export function applyUnlock(current: LiveDemoState | null, now: number): LiveDemoState {
  const state = current ?? initialState(now);
  return { ...state, wrappedUnlocked: true, unlockCount: state.unlockCount + 1, unlockedAt: now, updatedAt: now };
}

export function newSubmissionId() {
  const rand = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().replace(/-/g, "") : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `rc_${rand}`.slice(0, 40);
}
