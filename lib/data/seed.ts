import seedrandom from "seedrandom";
import { AREAS, COHORTS, DIM_IDS } from "../constants";
import type {
  BusinessArea,
  Cohort,
  DimensionExperience,
  DimensionId,
  Expectation,
  Intern,
} from "../types";

export const MAYA_ID = "int-001";
export const PRIYA_ID = "int-002";
export const MAYA_TAG = "maya-7f3a";
export const PRIYA_TAG = "priya-2c91";
export const TOTAL_INTERNS = 250;
export const SEED_WEEKS = 6;

/**
 * Program-wide targets. `expected` is the share rating the dimension 4 or 5 at onboarding.
 * `experienced` is the share experiencing it in weeks 1 to 6. Week 6 matches the pitch table.
 */
export const TARGETS: Record<DimensionId, { expected: number; experienced: number[] }> = {
  cross_team: { expected: 65, experienced: [36, 34, 33, 32, 31, 30] },
  career_clarity: { expected: 74, experienced: [45, 44, 43, 43, 42, 41] },
  mentor_access: { expected: 82, experienced: [64, 62, 60, 58, 55, 53] },
  senior_access: { expected: 58, experienced: [33, 33, 34, 33, 33, 33] },
  feedback: { expected: 79, experienced: [55, 56, 57, 57, 58, 58] },
  network: { expected: 70, experienced: [44, 46, 48, 49, 51, 52] },
  meaningful_work: { expected: 88, experienced: [66, 68, 70, 72, 73, 74] },
  learning: { expected: 85, experienced: [70, 72, 74, 75, 76, 77] },
  belonging: { expected: 80, experienced: [68, 70, 72, 74, 75, 76] },
};

/** Cohort by business area headcount. Several cells are deliberately under 10. */
const MATRIX: Record<Cohort, number[]> = {
  //          Tech  CM  WM  PB  Risk CF
  Toronto: [26, 20, 12, 12, 10, 10],
  Vancouver: [14, 7, 10, 10, 4, 5],
  Montreal: [13, 8, 6, 10, 4, 4],
  Calgary: [9, 4, 5, 8, 3, 6],
  Remote: [13, 3, 3, 4, 6, 1],
};

const TEAMS: Record<BusinessArea, string[]> = {
  Technology: ["Mobile Banking", "Cloud Platform", "Data and AI", "Digital Payments", "Cyber Defence"],
  "Capital Markets": ["Global Markets Analytics", "Fixed Income Tech", "Equity Research"],
  "Wealth Management": ["Advisor Tools", "Portfolio Analytics", "Client Experience"],
  "Personal Banking": ["Everyday Banking", "Lending Journeys", "Branch Innovation"],
  Risk: ["Model Validation", "Enterprise Risk", "Fraud Analytics"],
  "Corporate Functions": ["Finance Transformation", "HR Analytics", "Legal Ops"],
};

const FIRST = [
  "Aiden", "Amara", "Ananya", "Ben", "Chloe", "Daniel", "Elena", "Ethan", "Fatima", "Gabriel",
  "Hana", "Isaac", "Jasmine", "Jonah", "Kai", "Leila", "Liam", "Lucas", "Mei", "Mila",
  "Noah", "Nora", "Olivia", "Omar", "Rafael", "Riya", "Sam", "Sofia", "Tariq", "Theo",
  "Vera", "Wei", "Yara", "Zoe", "Arjun", "Camille", "Diego", "Emeka", "Ines", "Kenji",
];
const LAST = [
  "Ahmed", "Bouchard", "Campbell", "Das", "Edwards", "Fournier", "Gill", "Huang", "Ibrahim", "Kim",
  "Lam", "MacDonald", "Martin", "Nguyen", "Okafor", "Patel", "Roy", "Singh", "Tremblay", "Wong",
];

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function expectedAdj(cohort: Cohort, _area: BusinessArea, dim: DimensionId) {
  if (cohort === "Remote" && dim === "cross_team") return 0.1;
  return 0;
}

/** Planted stories that make cohort slices interesting. Applied to the experience ranking. */
function experiencedAdj(cohort: Cohort, area: BusinessArea, dim: DimensionId, week: number) {
  let adj = 0;
  if (cohort === "Calgary" && dim === "mentor_access") {
    adj += week <= 4 ? 0.06 : week === 5 ? -0.04 : -0.1;
  }
  if (area === "Capital Markets" && dim === "career_clarity") adj -= 0.2;
  if (cohort === "Remote" && dim === "cross_team") adj -= 0.13;
  if (area === "Technology" && dim === "belonging") adj += 0.15;
  return adj;
}

const MAYA_RATINGS: Expectation = {
  cross_team: 5,
  mentor_access: 5,
  meaningful_work: 5,
  senior_access: 3,
  feedback: 4,
  career_clarity: 4,
  learning: 5,
  belonging: 4,
  network: 4,
};

/** Dimensions Maria is forced to not experience (her story: she rarely sees her mentor). */
const MAYA_LOW: DimensionId[] = ["mentor_access", "cross_team"];

export function generateSeed(): Intern[] {
  const rng = seedrandom("rbc-compass-v1");
  const interns: Intern[] = [];
  const usedTags = new Set<string>([MAYA_TAG, PRIYA_TAG]);

  const slots: { cohort: Cohort; area: BusinessArea }[] = [];
  for (const cohort of COHORTS) {
    MATRIX[cohort].forEach((count, ai) => {
      for (let k = 0; k < count; k++) slots.push({ cohort, area: AREAS[ai] });
    });
  }
  // Maria: Toronto Technology. Priya: Toronto Capital Markets. Pull their slots to the front.
  const mayaSlot = slots.findIndex((s) => s.cohort === "Toronto" && s.area === "Technology");
  const [maya] = slots.splice(mayaSlot, 1);
  const priyaSlot = slots.findIndex((s) => s.cohort === "Toronto" && s.area === "Capital Markets");
  const [priya] = slots.splice(priyaSlot, 1);
  slots.unshift(maya, priya);

  slots.forEach((slot, i) => {
    let name: string;
    let tagId: string;
    let team: string;
    if (i === 0) {
      name = "Maria Chen";
      tagId = MAYA_TAG;
      team = "Mobile Banking";
    } else if (i === 1) {
      name = "Priya Nair";
      tagId = PRIYA_TAG;
      team = "Global Markets Analytics";
    } else {
      const first = FIRST[Math.floor(rng() * FIRST.length)];
      const last = LAST[Math.floor(rng() * LAST.length)];
      name = `${first} ${last}`;
      do {
        tagId = `${first.toLowerCase()}-${Math.floor(rng() * 0xffff).toString(16).padStart(4, "0")}`;
      } while (usedTags.has(tagId));
      usedTags.add(tagId);
      const teams = TEAMS[slot.area];
      team = teams[Math.floor(rng() * teams.length)];
    }

    const leaveRate = slot.cohort === "Calgary" ? 0.1 : slot.cohort === "Remote" ? 0.06 : 0.025;
    const optIn = 2 + Math.floor(rng() * 6);
    let leaveMentions = 0;
    for (let r = 0; r < optIn; r++) if (rng() < leaveRate) leaveMentions++;

    interns.push({
      id: `int-${String(i + 1).padStart(3, "0")}`,
      name,
      tagId,
      cohort: slot.cohort,
      area: slot.area,
      team,
      week: 6,
      expectations: {} as Expectation,
      experience: {} as Record<DimensionId, DimensionExperience>,
      consentLevel: 2,
      reflections: { optIn, leaveMentions: i === 0 ? 0 : leaveMentions },
      connections: i === 0 ? 7 : 2 + Math.floor(rng() * 9),
    });
  });

  for (const dim of DIM_IDS) {
    const target = TARGETS[dim];

    // Expectations: rank by propensity, top K expect it (rating 4 or 5).
    const expK = Math.round((target.expected / 100) * TOTAL_INTERNS);
    const expScores = interns.map((it, i) => {
      if (i === 0) return MAYA_RATINGS[dim] >= 4 ? Infinity : -Infinity;
      return rng() + expectedAdj(it.cohort, it.area, dim);
    });
    const expOrder = expScores.map((s, i) => [s, i] as const).sort((a, b) => b[0] - a[0]);
    expOrder.forEach(([, idx], rank) => {
      const it = interns[idx];
      if (idx === 0) it.expectations[dim] = MAYA_RATINGS[dim];
      else if (rank < expK) it.expectations[dim] = rng() < 0.55 ? 5 : 4;
      else it.expectations[dim] = 1 + Math.floor(rng() * 3);
    });

    // Experience: one stable base per intern, small weekly noise, planted adjustments.
    const base = interns.map(() => rng());
    const flags: boolean[][] = interns.map(() => []);
    for (let w = 1; w <= SEED_WEEKS; w++) {
      const k = Math.round((target.experienced[w - 1] / 100) * TOTAL_INTERNS);
      const scores = interns.map((it, i) => {
        if (i === 0 && MAYA_LOW.includes(dim)) return -Infinity;
        return base[i] + experiencedAdj(it.cohort, it.area, dim, w) + (rng() - 0.5) * 0.02;
      });
      const order = scores.map((s, i) => [s, i] as const).sort((a, b) => b[0] - a[0]);
      order.forEach(([, idx], rank) => {
        flags[idx][w - 1] = rank < k;
      });
    }

    interns.forEach((it, i) => {
      const experienced = flags[i][SEED_WEEKS - 1];
      let self: number;
      let taps = 0;
      if (i === 0 && dim === "mentor_access") self = 0.22;
      else if (i === 0 && dim === "cross_team") self = 0.32;
      else if (experienced) {
        if (rng() < 0.38) {
          taps = 1 + Math.floor(rng() * 2);
          self = 0.2 + rng() * 0.75;
        } else {
          self = 0.84 + rng() * 0.14;
        }
      } else {
        self = 0.2 + rng() * 0.6;
      }
      it.experience[dim] = {
        self: clamp(Math.round(self * 100) / 100, 0, 1),
        taps,
        history: flags[i].slice(0, SEED_WEEKS - 1),
      };
    });
  }

  // A handful of interns opted into personalized support (Vault level 3).
  const supportIdx = new Set<number>();
  while (supportIdx.size < 18) {
    const idx = 2 + Math.floor(rng() * (TOTAL_INTERNS - 2));
    supportIdx.add(idx);
  }
  supportIdx.forEach((idx) => (interns[idx].consentLevel = 3));

  return interns;
}

let cached: Intern[] | null = null;

/** Seed is deterministic, so the client and the server build the same dataset. */
export function getSeed(): Intern[] {
  if (!cached) cached = generateSeed();
  return cached;
}

export function findByTag(tagId: string): Intern | undefined {
  return getSeed().find((i) => i.tagId === tagId);
}
