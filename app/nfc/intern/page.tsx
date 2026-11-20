"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Gift, Loader2, Lock, MonitorPlay, Sparkles } from "lucide-react";
import { useState } from "react";
import { Confetti } from "@/components/live/Confetti";
import { ConnectionBadge, LiveError, LiveLoading, PointsCounter, categoryIcon, fmt } from "@/components/live/LiveBits";
import { CompassLogo } from "@/components/ui/CompassLogo";
import { Particles } from "@/components/wrapped/Backdrops";
import { unlockWrapped } from "@/lib/live/client";
import { WRAPPED_STATS, recognitionList } from "@/lib/live/model";
import { useLiveDemo } from "@/lib/live/useLiveDemo";
import { vibrate } from "@/lib/hooks";

export default function InternCard() {
  const { session, state, status, error } = useLiveDemo();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [burst, setBurst] = useState(0);

  if (error) return <LiveError message={error} />;
  if (!state || !session) return <LiveLoading />;

  const recs = recognitionList(state);
  const unlocked = state.wrappedUnlocked;

  const unlock = async () => {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    vibrate([30, 40, 60]);
    try {
      await unlockWrapped(session);
      setBurst((b) => b + 1);
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-b from-[#0A2A5E] via-[#06142E] to-[#06142E] px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <Particles count={14} />
      <div className="relative z-10 mx-auto max-w-md">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CompassLogo size={30} />
            <span className="font-display text-[17px] font-bold text-white">
              RBC <span className="text-rbc-yellow">Compass</span>
            </span>
          </div>
          <ConnectionBadge status={status} />
        </header>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
          <p className="eyebrow">Intern Compass Card</p>
          <h1 className="h-display mt-2 text-4xl leading-tight">Hi, Maya Patel</h1>
          <p className="mt-2 text-rbc-mist/80">Week {WRAPPED_STATS.weeks} of {WRAPPED_STATS.weeks}. Your countdown is complete.</p>
        </motion.div>

        {/* Points */}
        <div className="glass mt-6 rounded-card p-5">
          <p className="text-sm text-rbc-mist/70">Recognition points</p>
          <p className="num text-glow text-6xl font-extrabold text-rbc-yellow">
            <PointsCounter value={state.recognitionPoints} />
          </p>
          {recs.length > 0 && (
            <ul className="mt-4 space-y-2">
              {recs
                .slice(-3)
                .reverse()
                .map((r) => {
                  const Icon = categoryIcon(r.category);
                  return (
                    <motion.li key={r.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3 rounded-2xl bg-white/[0.05] p-3">
                      <Icon size={18} className="mt-0.5 shrink-0 text-rbc-yellow" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">
                          {r.category} <span className="text-rbc-yellow">+{r.points}</span>
                        </p>
                        <p className="line-clamp-2 text-xs text-rbc-mist/70">{r.message}</p>
                      </div>
                    </motion.li>
                  );
                })}
            </ul>
          )}
        </div>

        {/* Locked Wrapped */}
        <motion.div
          className="relative mt-6 overflow-hidden rounded-card border border-rbc-yellow/30 bg-gradient-to-br from-[#005DAA] via-[#0A2A5E] to-[#3b2a00] p-6 text-center"
          animate={{ boxShadow: ["0 0 30px -10px rgba(255,223,1,0.3)", "0 0 60px -6px rgba(255,223,1,0.6)", "0 0 30px -10px rgba(255,223,1,0.3)"] }}
          transition={{ duration: 2.8, repeat: Infinity }}
        >
          <AnimatePresence mode="wait">
            {unlocked ? (
              <motion.div key="open" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <MonitorPlay className="mx-auto text-rbc-yellow" size={44} />
                <p className="h-display mt-3 text-2xl">Look up at the big screen</p>
                <p className="mt-2 text-sm text-rbc-mist/80">Your Wrapped is playing now.</p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-left">
                  {[
                    [WRAPPED_STATS.skills, "skills"],
                    [WRAPPED_STATS.connections, "connections"],
                    [WRAPPED_STATS.projects, "projects"],
                  ].map(([n, l]) => (
                    <div key={l} className="rounded-2xl bg-white/10 p-3">
                      <p className="num text-2xl font-bold text-white">{n}</p>
                      <p className="text-xs text-rbc-mist/70">{l}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="locked" exit={{ opacity: 0, scale: 0.9 }}>
                <motion.div animate={{ rotate: [0, -8, 8, -4, 0] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rbc-yellow/15 ring-1 ring-rbc-yellow/50">
                  <Lock className="text-rbc-yellow" size={28} />
                </motion.div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-rbc-yellow">Final Intern Wrapped</p>
                <p className="h-display mt-2 text-2xl">Your journey is ready to be revealed.</p>
                <p className="mt-2 text-sm text-rbc-mist/80">
                  {WRAPPED_STATS.weeks} weeks, {fmt(state.recognitionPoints)} points and more, waiting inside.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={unlock}
          disabled={busy || status === "error"}
          className="btn-primary mt-6 w-full py-4 text-lg"
        >
          {busy ? <Loader2 className="animate-spin" size={20} /> : unlocked ? <Sparkles size={20} /> : <Gift size={20} />}
          {unlocked ? "Replay on the big screen" : "Unlock My Wrapped"}
        </motion.button>
        {actionError && (
          <p role="alert" className="mt-3 text-center text-sm text-danger">
            {actionError}
          </p>
        )}
        {status === "offline" && <p className="mt-3 text-center text-xs text-warning">Reconnecting. Your tap will send when the connection returns.</p>}
        <p className="mt-6 text-center text-[11px] text-rbc-mist/50">Prototype with synthetic data. Points are simulated.</p>
      </div>
      <Confetti fire={burst} origin="center" />
    </div>
  );
}
