"use client";

import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import type {
  ConsentLevel,
  Expectation,
  GreenLitAction,
  Reflection,
  Role,
  SupportRequest,
  TapEvent,
} from "../types";

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone?: "success" | "info" | "warning";
}

interface CompassState {
  role: Role;
  events: TapEvent[];
  consent: ConsentLevel;
  consentLog: { at: number; action: string }[];
  contributeReflections: boolean;
  actions: GreenLitAction[];
  reflections: Reflection[];
  expectations: Expectation | null;
  support: SupportRequest[];
  mood: number | null;
  signedIn: boolean;
  demo: { active: boolean; step: number };
  toasts: Toast[];

  setRole: (r: Role) => void;
  mergeEvents: (evs: TapEvent[]) => void;
  resetDemo: () => void;
  setConsent: (level: ConsentLevel, action: string) => void;
  setContributeReflections: (v: boolean) => void;
  greenLight: (a: GreenLitAction) => void;
  addReflection: (r: Reflection) => void;
  setExpectations: (e: Expectation) => void;
  addSupport: (r: SupportRequest) => void;
  withdrawSupport: (id: string) => void;
  setMood: (m: number) => void;
  setSignedIn: (v: boolean) => void;
  setDemo: (d: Partial<CompassState["demo"]>) => void;
  toast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}

type Persisted = Omit<CompassState, "toasts">;

/**
 * Role and guided demo progress live in sessionStorage so each tab keeps its own
 * (a leader tab and an intern tab side by side). Everything else is shared through
 * localStorage so taps, actions and consent sync across tabs.
 */
const splitStorage: PersistStorage<Persisted> = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    const local = localStorage.getItem(name);
    const session = sessionStorage.getItem(name);
    if (!local && !session) return null;
    const l = local ? JSON.parse(local) : { state: {}, version: 1 };
    return { ...l, state: { ...l.state, ...(session ? JSON.parse(session) : {}) } };
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    const { role, demo, ...shared } = value.state;
    sessionStorage.setItem(name, JSON.stringify({ role, demo }));
    localStorage.setItem(name, JSON.stringify({ ...value, state: shared }));
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

export const useCompass = create<CompassState>()(
  persist(
    (set) => ({
      role: "intern",
      events: [],
      consent: 2,
      consentLog: [
        { at: Date.UTC(2026, 9, 5, 14), action: "Joined Compass. Sharing set to Private." },
        { at: Date.UTC(2026, 9, 5, 14, 2), action: "Chose Aggregated: anonymous themes may join program insights." },
      ],
      contributeReflections: true,
      actions: [],
      reflections: [],
      expectations: null,
      support: [],
      mood: null,
      signedIn: false,
      demo: { active: false, step: 0 },
      toasts: [],

      setRole: (role) => set({ role }),
      mergeEvents: (evs) =>
        set((s) => {
          const ids = new Set(s.events.map((e) => e.id));
          const fresh = evs.filter((e) => !ids.has(e.id));
          if (!fresh.length) return s;
          return { events: [...s.events, ...fresh].sort((a, b) => a.at - b.at).slice(-1500) };
        }),
      resetDemo: () => set({ events: [], actions: [], reflections: [], support: [], signedIn: false }),
      setConsent: (consent, action) =>
        set((s) => ({ consent, consentLog: [...s.consentLog, { at: Date.now(), action }] })),
      setContributeReflections: (contributeReflections) =>
        set((s) => ({
          contributeReflections,
          consentLog: [
            ...s.consentLog,
            {
              at: Date.now(),
              action: contributeReflections
                ? "Turned on: contribute anonymized reflection themes."
                : "Turned off: reflection themes stay private.",
            },
          ],
        })),
      greenLight: (a) => set((s) => ({ actions: [...s.actions.filter((x) => x.interventionId !== a.interventionId), a] })),
      addReflection: (r) => set((s) => ({ reflections: [...s.reflections, r] })),
      setExpectations: (expectations) => set({ expectations }),
      addSupport: (r) => set((s) => ({ support: [r, ...s.support] })),
      withdrawSupport: (id) => set((s) => ({ support: s.support.filter((x) => x.id !== id) })),
      setMood: (mood) => set({ mood }),
      setSignedIn: (signedIn) => set({ signedIn }),
      setDemo: (d) => set((s) => ({ demo: { ...s.demo, ...d } })),
      toast: (t) => {
        const id = Math.random().toString(36).slice(2);
        set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4200);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
    }),
    {
      name: "rbc-compass-demo",
      version: 1,
      storage: splitStorage,
      partialize: ({ toasts: _t, ...rest }) => rest as Persisted,
    },
  ),
);
