"use client";

import { useEffect, useState } from "react";
import { LiveConfigError, ensureSession, resolveSession, subscribe } from "./client";
import type { LiveDemoState } from "./model";

export type LiveStatus = "connecting" | "live" | "offline" | "error";

/** Subscribes to the shared demo session. `state` is null until the first snapshot arrives. */
export function useLiveDemo() {
  const [session, setSession] = useState<string | null>(null);
  const [state, setState] = useState<LiveDemoState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let off: (() => void) | undefined;
    try {
      const s = resolveSession(new URLSearchParams(window.location.search).get("s"));
      setSession(s);
      off = subscribe(s, {
        onState: (next) => {
          setState(next);
          setError(null);
        },
        onError: (e) => setError(e.message),
        onConnection: setConnected,
      });
      ensureSession(s).catch((e: Error) => setError(e.message));
    } catch (e) {
      setError(e instanceof LiveConfigError || e instanceof Error ? e.message : String(e));
    }
    return () => off?.();
  }, []);

  const status: LiveStatus = error ? "error" : !state ? "connecting" : connected ? "live" : "offline";
  return { session, state, status, connected, error };
}
