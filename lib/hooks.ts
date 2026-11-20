"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { getSeed, MAYA_ID } from "./data/seed";
import { applyEvents } from "./gap";
import { useCompass } from "./store/compass";
import type { Intern } from "./types";

/** Seed + live tap events + Maria's current Vault level. Same math as the server. */
export function useInterns(): Intern[] {
  const events = useCompass((s) => s.events);
  const consent = useCompass((s) => s.consent);
  return useMemo(
    () => applyEvents(getSeed(), events, { [MAYA_ID]: { consentLevel: consent } }),
    [events, consent],
  );
}

export function useMaya(): Intern {
  const interns = useInterns();
  return interns.find((i) => i.id === MAYA_ID)!;
}

/** True after the persisted store has loaded from localStorage. Avoids hydration flashes. */
export function useHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const unsub = useCompass.persist.onFinishHydration(() => setOk(true));
    if (useCompass.persist.hasHydrated()) setOk(true);
    return unsub;
  }, []);
  return ok;
}

export function useMotionOK() {
  return !useReducedMotion();
}

export function vibrate(pattern: number | number[] = 40) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Some browsers throw without a user gesture. Haptics are a nice to have.
    }
  }
}

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
