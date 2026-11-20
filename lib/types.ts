export type DimensionId =
  | "cross_team"
  | "mentor_access"
  | "meaningful_work"
  | "senior_access"
  | "feedback"
  | "career_clarity"
  | "learning"
  | "belonging"
  | "network";

export type Cohort = "Toronto" | "Vancouver" | "Montreal" | "Calgary" | "Remote";

export type BusinessArea =
  | "Technology"
  | "Capital Markets"
  | "Wealth Management"
  | "Personal Banking"
  | "Risk"
  | "Corporate Functions";

export type Role = "intern" | "advisor" | "leader";

/** 1 = Private, 2 = Aggregated (anonymous program insights), 3 = Personalized support */
export type ConsentLevel = 1 | 2 | 3;

export type StationType = "mentor_coffee" | "cross_team_lunch" | "workshop" | "senior_ama";

export type ThemeId =
  | "mentorship"
  | "team_dynamics"
  | "learning"
  | "workload"
  | "onboarding"
  | "career_growth"
  | "belonging"
  | "leaving_intent";

/** Rating 1 to 5 from the Expectation Nav. A rating of 4 or 5 counts as "expected". */
export type Expectation = Record<DimensionId, number>;

export interface DimensionExperience {
  /** Self-reported signal from reflections and Wrapped check-ins, 0 to 1. */
  self: number;
  /** Verified experience taps in the current two week window. */
  taps: number;
  /** Experienced flag for weeks 1 to 5 (index 0 to 4). Week 6 is computed live. */
  history: boolean[];
}

export interface Intern {
  id: string;
  name: string;
  tagId: string;
  cohort: Cohort;
  area: BusinessArea;
  team: string;
  week: number;
  expectations: Expectation;
  experience: Record<DimensionId, DimensionExperience>;
  consentLevel: ConsentLevel;
  /** Opt-in reflections in the last two weeks and how many mention intent to leave. */
  reflections: { optIn: number; leaveMentions: number };
  connections: number;
}

export interface Reflection {
  id: string;
  internId: string;
  createdAt: number;
  text: string;
  chips: ThemeId[];
  detected: ThemeId[];
  optIn: boolean;
  stationType?: StationType;
}

export type TapKind = "station" | "connect";

export interface TapEvent {
  id: string;
  kind: TapKind;
  tagId: string;
  internId: string;
  internName: string;
  stationType?: StationType;
  partnerTagId?: string;
  partnerName?: string;
  /** For connections: pending until both sides approve. */
  status: "logged" | "pending" | "connected";
  dimensions: DimensionId[];
  /** False when the intern keeps data private (Vault level 1). Still counts for their own Wrapped. */
  aggregated: boolean;
  at: number;
  /** True for synthetic attendees added by the demo console. */
  synthetic?: boolean;
}

export interface Connection {
  id: string;
  a: string;
  b: string;
  crossTeam: boolean;
  at: number;
}

export interface GapRow {
  dimension: DimensionId;
  expectedPct: number;
  experiencedPct: number;
  gap: number;
  /** Gap per week from week 1 to the selected end week. */
  history: number[];
  /** Gap change over the last two weeks (positive = widening). */
  trend: number;
  /** Share of "experienced" responses backed by a verified tap. */
  tapShare: number;
}

export interface GapSnapshot {
  hidden: boolean;
  n: number;
  week: number;
  confidence: "High" | "Medium" | "Low";
  rows: GapRow[];
  reason?: string;
}

export interface Filter {
  cohorts: Cohort[];
  areas: BusinessArea[];
  weekStart: number;
  weekEnd: number;
}

export interface Intervention {
  id: string;
  name: string;
  description: string;
  /** Maximum gap reduction in points at 100% intensity. */
  effects: Partial<Record<DimensionId, number>>;
  cost: "$" | "$$" | "$$$";
  costNote: string;
  effortWeeks: number;
  owner: string;
}

export interface Alert {
  id: string;
  cohort: Cohort;
  dimension: DimensionId;
  change: number;
  weeks: number;
  severity: "watch" | "act";
  message: string;
  action: string;
  interventionId: string;
}

export interface Consent {
  internId: string;
  level: ConsentLevel;
  log: { at: number; action: string }[];
}

export interface GreenLitAction {
  id: string;
  interventionId: string;
  dimension: DimensionId;
  intensity: number;
  gapBefore: number;
  projectedGap: number;
  at: number;
}

export interface SupportRequest {
  id: string;
  internName: string;
  alias: string;
  createdAt: number;
  topic: string;
  fields: Record<string, string>;
  status: "new" | "scheduled";
}
