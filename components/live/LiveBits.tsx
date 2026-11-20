"use client";

import { animate, motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Award, HeartHandshake, Lightbulb, Loader2, Sparkles, TrendingUp, Users } from "lucide-react";
import type { LiveStatus } from "@/lib/live/useLiveDemo";
import type { Category } from "@/lib/live/model";
import { cn } from "@/lib/hooks";

export const CATEGORY_ICON: Record<Category, typeof Users> = {
  Collaboration: Users,
  Innovation: Lightbulb,
  Leadership: TrendingUp,
  "Continuous Learning": Sparkles,
  "Making a Difference": HeartHandshake,
};

export function categoryIcon(c: string) {
  return CATEGORY_ICON[c as Category] ?? Award;
}

export function ConnectionBadge({ status, className }: { status: LiveStatus; className?: string }) {
  const label = { connecting: "Connecting", live: "Live", offline: "Reconnecting", error: "Error" }[status];
  const dot = { connecting: "bg-warning", live: "bg-success", offline: "bg-warning", error: "bg-danger" }[status];
  return (
    <span className={cn("glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white", className)} role="status" aria-live="polite">
      <span className="relative flex h-2.5 w-2.5">
        {status === "live" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />}
        <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", dot)} />
      </span>
      {label}
    </span>
  );
}

/** Full screen error. Shown instead of a silent fallback when the backend is missing or rejects us. */
export function LiveError({ message }: { message: string }) {
  return (
    <div className="grid min-h-[100dvh] place-items-center px-6">
      <div className="glass max-w-md rounded-card p-6 text-center">
        <AlertTriangle className="mx-auto text-danger" size={32} />
        <h1 className="h-display mt-3 text-2xl">Live demo unavailable</h1>
        <p className="mt-2 text-sm text-rbc-mist/80">{message}</p>
      </div>
    </div>
  );
}

export function LiveLoading() {
  return (
    <div className="grid min-h-[100dvh] place-items-center">
      <Loader2 className="animate-spin text-rbc-yellow" size={32} aria-label="Loading" />
    </div>
  );
}

export function fmt(n: number) {
  return n.toLocaleString("en-CA");
}

/**
 * Animated points number. Eases from the previous value (or `from` on first render) to `value`
 * and pops on every change. Never remounts, so a live update counts 1,250 → 1,500, not 0 → 1,500.
 */
export function PointsCounter({ value, from, duration = 1.8, className }: { value: number; from?: number; duration?: number; className?: string }) {
  const reduce = useReducedMotion();
  // Last number actually on screen. Starting from it keeps mid-animation updates smooth.
  const displayed = useRef(from ?? value);
  const [shown, setShown] = useState(from ?? value);
  const pop = useAnimationControls();

  useEffect(() => {
    const start = displayed.current;
    const show = (v: number) => {
      displayed.current = v;
      setShown(v);
    };
    if (start === value || reduce) return show(value);
    pop.start({ scale: [1, 1.12, 1], transition: { duration: 0.7, ease: "easeOut" } });
    const c = animate(start, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => show(Math.round(v)) });
    return () => c.stop();
  }, [value, duration, reduce, pop]);

  return (
    <motion.span animate={pop} className={cn("inline-block origin-left tabular-nums", className)}>
      {fmt(shown)}
    </motion.span>
  );
}
