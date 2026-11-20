import { describe, expect, it } from "vitest";
import { AWARD_POINTS, INITIAL_POINTS, MAX_AWARDS, applyAward, applyUnlock, initialState, normalize, validateAward } from "../lib/live/model";

const award = (id: string) => ({ id, category: "Collaboration" as const, message: "Great teamwork" });

describe("live demo model", () => {
  it("starts Maria at 1,250 points, locked", () => {
    const s = initialState(1);
    expect(s.recognitionPoints).toBe(INITIAL_POINTS);
    expect(s.wrappedUnlocked).toBe(false);
  });

  it("adds exactly 250 points and records before/after", () => {
    const r = applyAward(initialState(1), award("rc_aaaaaaaa"), 2);
    expect(r.kind).toBe("awarded");
    if (r.kind !== "awarded") return;
    expect(r.state.recognitionPoints).toBe(INITIAL_POINTS + AWARD_POINTS);
    expect(r.recognition.pointsBefore).toBe(1250);
    expect(r.recognition.pointsAfter).toBe(1500);
    expect(r.state.latestRecognition?.id).toBe("rc_aaaaaaaa");
  });

  it("never awards the same submission twice", () => {
    const first = applyAward(initialState(1), award("rc_aaaaaaaa"), 2);
    if (first.kind !== "awarded") throw new Error("expected award");
    const again = applyAward(first.state, award("rc_aaaaaaaa"), 3);
    expect(again.kind).toBe("duplicate");
    expect(again.state.recognitionPoints).toBe(1500);
  });

  it("stacks distinct awards", () => {
    let s = initialState(1);
    for (const id of ["rc_aaaaaaaa", "rc_bbbbbbbb", "rc_cccccccc"]) {
      const r = applyAward(s, award(id), 2);
      if (r.kind !== "awarded") throw new Error("expected award");
      s = r.state;
    }
    expect(s.recognitionPoints).toBe(2000);
  });

  it("caps awards so the demo cannot run away", () => {
    let s = initialState(1);
    for (let i = 0; i < MAX_AWARDS; i++) {
      const r = applyAward(s, award(`rc_${String(i).padStart(8, "0")}`), 2);
      if (r.kind !== "awarded") throw new Error("expected award");
      s = r.state;
    }
    expect(applyAward(s, award("rc_overflow1"), 3).kind).toBe("limit");
  });

  it("validates category, message and id", () => {
    expect(validateAward({ id: "rc_aaaaaaaa", category: "Bribery", message: "hello" }).ok).toBe(false);
    expect(validateAward({ id: "rc_aaaaaaaa", category: "Innovation", message: "  " }).ok).toBe(false);
    expect(validateAward({ id: "bad id", category: "Innovation", message: "hello" }).ok).toBe(false);
    expect(validateAward({ id: "rc_aaaaaaaa", category: "Innovation", message: "x".repeat(281) }).ok).toBe(false);
    const ok = validateAward({ id: "rc_aaaaaaaa", category: "Innovation", message: "  hello  " });
    expect(ok.ok && ok.value.message).toBe("hello");
  });

  it("increments unlockCount on every unlock", () => {
    const a = applyUnlock(initialState(1), 2);
    const b = applyUnlock(a, 3);
    expect(a.wrappedUnlocked).toBe(true);
    expect(b.unlockCount).toBe(2);
  });

  it("normalizes Firebase snapshots that dropped empty fields", () => {
    const n = normalize({ internName: "Maria Patel", recognitionPoints: 1500, wrappedUnlocked: false, unlockCount: 0, resetAt: 1, updatedAt: 1 });
    expect(n?.recognitions).toEqual({});
    expect(n?.latestRecognition).toBeNull();
    expect(normalize(null)).toBeNull();
  });

  it("always reports the current intern name, even from an older record", () => {
    const n = normalize({ internName: "Maya Patel", recognitionPoints: 1250, wrappedUnlocked: false, unlockCount: 0, resetAt: 1, updatedAt: 1 });
    expect(n?.internName).toBe("Maria Patel");
  });
});
