import { describe, expect, it } from "vitest";
import { generateSeed, MAYA_ID, MAYA_TAG, getSeed } from "../lib/data/seed";
import {
  applyEvents,
  cohortAlerts,
  computeGap,
  retentionPressure,
  simulateIntervention,
  INTERVENTIONS,
} from "../lib/gap";
import { applyPrivacy } from "../lib/privacy";
import { buildTap, pickCrowd } from "../lib/nfc";
import { COHORTS } from "../lib/constants";
import type { Filter, TapEvent } from "../lib/types";

const ALL: Filter = { cohorts: [], areas: [], weekStart: 1, weekEnd: 6 };

const TABLE: Record<string, [number, number, number]> = {
  cross_team: [65, 30, 35],
  career_clarity: [74, 41, 33],
  mentor_access: [82, 53, 29],
  senior_access: [58, 33, 25],
  feedback: [79, 58, 21],
  network: [70, 52, 18],
  meaningful_work: [88, 74, 14],
  learning: [85, 77, 8],
  belonging: [80, 76, 4],
};

describe("seed", () => {
  it("is deterministic", () => {
    const a = generateSeed();
    const b = generateSeed();
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
    expect(a).toHaveLength(250);
  });

  it("includes the hero personas", () => {
    const maya = getSeed().find((i) => i.id === MAYA_ID)!;
    expect(maya.name).toBe("Maria Chen");
    expect(maya.tagId).toBe(MAYA_TAG);
    expect(maya.cohort).toBe("Toronto");
    expect(maya.area).toBe("Technology");
  });
});

describe("computeGap", () => {
  it("matches the week 6 pitch table exactly", () => {
    const snap = computeGap(getSeed(), ALL);
    expect(snap.hidden).toBe(false);
    expect(snap.n).toBe(250);
    for (const row of snap.rows) {
      const [exp, got, gap] = TABLE[row.dimension];
      expect([row.dimension, row.expectedPct, row.experiencedPct, row.gap]).toEqual([
        row.dimension,
        exp,
        got,
        gap,
      ]);
    }
  });

  it("ranks cross-team as the biggest gap", () => {
    const rows = [...computeGap(getSeed(), ALL).rows].sort((a, b) => b.gap - a.gap);
    expect(rows[0].dimension).toBe("cross_team");
  });

  it("returns hidden for slices under 10", () => {
    const snap = computeGap(getSeed(), { ...ALL, cohorts: ["Calgary"], areas: ["Risk"] });
    expect(snap.hidden).toBe(true);
    expect(snap.rows).toHaveLength(0);
  });

  it("plants the Calgary mentor story", () => {
    const alerts = cohortAlerts(getSeed());
    const calgary = alerts.find((a) => a.cohort === "Calgary" && a.dimension === "mentor_access");
    expect(calgary).toBeDefined();
    expect(calgary!.change).toBeGreaterThanOrEqual(10);
  });

  it("plants Remote cross-team gap as largest and Capital Markets career clarity as lowest", () => {
    const seed = getSeed();
    const gapFor = (f: Partial<Filter>, dim: string) =>
      computeGap(seed, { ...ALL, ...f }).rows.find((r) => r.dimension === dim)!;
    const remote = gapFor({ cohorts: ["Remote"] }, "cross_team").gap;
    for (const c of COHORTS.filter((c) => c !== "Remote")) {
      expect(remote).toBeGreaterThan(gapFor({ cohorts: [c] }, "cross_team").gap);
    }
    const cm = gapFor({ areas: ["Capital Markets"] }, "career_clarity").experiencedPct;
    for (const a of ["Technology", "Wealth Management", "Personal Banking", "Risk", "Corporate Functions"] as const) {
      expect(cm).toBeLessThan(gapFor({ areas: [a] }, "career_clarity").experiencedPct);
    }
    const techBelonging = gapFor({ areas: ["Technology"] }, "belonging").experiencedPct;
    for (const a of ["Capital Markets", "Wealth Management", "Personal Banking", "Risk", "Corporate Functions"] as const) {
      expect(techBelonging).toBeGreaterThan(gapFor({ areas: [a] }, "belonging").experiencedPct);
    }
  });

  it("shrinks the cross-team gap when a station tap lands", () => {
    const seed = getSeed();
    const before = computeGap(seed, ALL).rows.find((r) => r.dimension === "cross_team")!.gap;
    const { events } = buildTap(
      { tagId: MAYA_TAG, stationType: "cross_team_lunch" },
      { consentOf: () => 2, pending: [] },
    );
    const after = computeGap(applyEvents(seed, events), ALL).rows.find((r) => r.dimension === "cross_team")!;
    expect(after.experiencedPct).toBeGreaterThanOrEqual(30);
    const maya = applyEvents(seed, events).find((i) => i.id === MAYA_ID)!;
    expect(maya.experience.cross_team.taps).toBe(1);
    expect(after.gap).toBeLessThanOrEqual(before);
  });
});

describe("NFC console magic moment", () => {
  it("Maria plus 7 attendees at a Cross-Team Lunch closes the program cross-team gap by 3 pts", () => {
    const seed = getSeed();
    const crowd = pickCrowd(seed, "cross_team_lunch", 7);
    expect(crowd).toHaveLength(7);
    const events = [MAYA_TAG, ...crowd.map((c) => c.tagId)].flatMap(
      (tagId) => buildTap({ tagId, stationType: "cross_team_lunch" }, { consentOf: () => 2, pending: [] }).events,
    );
    const after = computeGap(applyEvents(seed, events), ALL).rows.find((r) => r.dimension === "cross_team")!;
    expect(after.gap).toBe(32);
  });
});

describe("applyPrivacy", () => {
  const seed = getSeed();

  it("allows the full program", () => {
    expect(applyPrivacy(seed, { cohorts: [], areas: [] })).toEqual({ hidden: false, n: 250 });
  });

  it("hides any slice with fewer than 10 contributors", () => {
    const r = applyPrivacy(seed, { cohorts: ["Remote"], areas: ["Risk"] });
    expect(r.hidden).toBe(true);
    expect(r.reason).toBe("small_group");
  });

  it("blocks combinations that difference out a small group", () => {
    // Calgary minus Capital Markets (4 people) is large, but comparing it with all of Calgary reveals 4 people.
    const r = applyPrivacy(seed, {
      cohorts: ["Calgary"],
      areas: ["Technology", "Wealth Management", "Personal Banking", "Risk", "Corporate Functions"],
    });
    expect(r.n).toBeGreaterThanOrEqual(10);
    expect(r.hidden).toBe(true);
    expect(r.reason).toBe("differencing");
  });

  it("excludes interns who keep their data private", () => {
    const withPrivate = applyEvents(seed, [], { [MAYA_ID]: { consentLevel: 1 } });
    expect(applyPrivacy(withPrivate, { cohorts: [], areas: [] }).n).toBe(249);
  });
});

describe("connections need both sides", () => {
  it("records nothing until the partner approves", () => {
    const first = buildTap({ tagId: "maya-7f3a", partnerTagId: "priya-2c91" }, { consentOf: () => 2, pending: [] });
    expect(first.status).toBe("pending");
    expect(first.events).toHaveLength(0);
    const second = buildTap(
      { tagId: "priya-2c91", partnerTagId: "maya-7f3a" },
      { consentOf: () => 2, pending: [first.pending!] },
    );
    expect(second.status).toBe("connected");
    expect(second.events).toHaveLength(2);
    expect(second.events[0].dimensions).toContain("cross_team");
  });
});

describe("simulator and retention", () => {
  it("projects a smaller gap with more intensity", () => {
    const rows = computeGap(getSeed(), ALL).rows;
    const rotation = INTERVENTIONS.find((i) => i.id === "rotation_day")!;
    const low = simulateIntervention(rows, rotation, 20).cross_team;
    const high = simulateIntervention(rows, rotation, 100).cross_team;
    expect(high).toBeLessThan(low);
    expect(low).toBeLessThan(35);
  });

  it("retention pressure is cohort level and bounded", () => {
    for (const c of COHORTS) {
      const r = retentionPressure(getSeed(), c);
      expect(r.index).toBeGreaterThanOrEqual(0);
      expect(r.index).toBeLessThanOrEqual(100);
    }
    const calgary = retentionPressure(getSeed(), "Calgary");
    const toronto = retentionPressure(getSeed(), "Toronto");
    expect(calgary.index).toBeGreaterThan(toronto.index);
  });

  it("never treats missing reflections as risk", () => {
    const seed = getSeed().map((i) => (i.cohort === "Toronto" ? { ...i, reflections: { optIn: 0, leaveMentions: 0 } } : i));
    const r = retentionPressure(seed, "Toronto");
    expect(r.intentShare).toBe(0);
  });
});

describe("events", () => {
  it("ignores pending connection events", () => {
    const ev: TapEvent = {
      id: "x",
      kind: "connect",
      tagId: MAYA_TAG,
      internId: MAYA_ID,
      internName: "Maria Chen",
      status: "pending",
      dimensions: ["network"],
      aggregated: true,
      at: 1,
    };
    expect(applyEvents(getSeed(), [ev])).toBe(getSeed());
  });
});
