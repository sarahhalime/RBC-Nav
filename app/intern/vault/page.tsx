"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, EyeOff, HeartHandshake, History, Lock, LogOut, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card, PageHeader } from "@/components/ui/primitives";
import { useCompass } from "@/lib/store/compass";
import { useHydrated, cn } from "@/lib/hooks";
import { MAYA_ID } from "@/lib/data/seed";
import type { ConsentLevel } from "@/lib/types";

const LEVELS: { level: ConsentLevel; title: string; icon: typeof Lock; body: string; shares: string[] }[] = [
  {
    level: 1,
    title: "Private",
    icon: EyeOff,
    body: "Everything stays with you. Your Wrapped and Gap still work.",
    shares: ["Nothing leaves your profile"],
  },
  {
    level: 2,
    title: "Aggregated",
    icon: Users,
    body: "Anonymous theme counts and gap scores join program insights, only in groups of 10 or more.",
    shares: ["Theme counts, never your words", "Gap scores, pooled with 10+ interns", "Tap types, never location or time"],
  },
  {
    level: 3,
    title: "Personalized support",
    icon: HeartHandshake,
    body: "Everything in Aggregated, plus you can send an advisor exactly the details you pick, when you ask for help.",
    shares: ["Only what you pick, per request", "You can withdraw any request"],
  },
];

function syncConsent(level: ConsentLevel) {
  fetch("/api/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ internId: MAYA_ID, level }) }).catch(() => undefined);
}

export default function VaultPage() {
  const hydrated = useHydrated();
  const consent = useCompass((s) => s.consent);
  const setConsent = useCompass((s) => s.setConsent);
  const log = useCompass((s) => s.consentLog);
  const toast = useCompass((s) => s.toast);
  const resetDemo = useCompass((s) => s.resetDemo);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const choose = (level: ConsentLevel) => {
    if (level === consent) return;
    setConsent(level, `Changed sharing to ${LEVELS[level - 1].title}.`);
    syncConsent(level);
    toast({ title: `Sharing set to ${LEVELS[level - 1].title}`, body: level === 1 ? "You left program insights. Nothing new is shared." : undefined });
  };

  const withdraw = () => {
    setConsent(1, "Withdrew from program insights. Past contributions removed from future aggregates.");
    syncConsent(1);
    toast({ title: "Withdrawn", body: "You are out of every aggregate from now on." });
  };

  const del = () => {
    resetDemo();
    setConsent(1, "Deleted my Compass data. Sharing reset to Private.");
    syncConsent(1);
    setConfirmDelete(false);
    toast({ title: "Your data was deleted", body: "Reflections, taps and requests are gone. Demo data only." });
  };

  return (
    <div>
      <PageHeader eyebrow="Profile settings" title="You decide what is shared.">
        Change your mind anytime. Every change is logged here, for you.
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3" role="radiogroup" aria-label="Sharing level">
        {LEVELS.map((l, i) => {
          const on = hydrated && consent === l.level;
          return (
            <motion.button
              key={l.level}
              role="radio"
              aria-checked={on}
              onClick={() => choose(l.level)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className={cn("glass relative overflow-hidden rounded-card p-6 text-left transition-colors", on && "border-rbc-yellow/60")}
            >
              {on && (
                <motion.span layoutId="vault-glow" className="absolute inset-0 bg-gradient-to-br from-rbc-yellow/15 to-transparent" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
              )}
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className={cn("grid h-11 w-11 place-items-center rounded-2xl", on ? "bg-rbc-yellow text-rbc-ink" : "bg-white/[0.07] text-rbc-mist")}>
                    <l.icon size={20} />
                  </span>
                  <span className="text-xs font-semibold text-rbc-mist/50">Level {l.level}</span>
                </div>
                <p className="mt-4 font-display text-xl font-bold text-white">{l.title}</p>
                <p className="mt-1 text-sm text-rbc-mist/70">{l.body}</p>
                <ul className="mt-4 space-y-1.5">
                  {l.shares.map((s) => (
                    <li key={s} className="flex items-start gap-1.5 text-xs text-rbc-mist/80">
                      <Check size={13} className="mt-0.5 shrink-0 text-success" /> {s}
                    </li>
                  ))}
                </ul>
                <AnimatePresence>
                  {on && (
                    <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mt-4 inline-flex items-center gap-1 rounded-full bg-rbc-yellow px-3 py-1 text-xs font-bold text-rbc-ink">
                      <Check size={13} /> Current
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card delay={0.1}>
          <div className="mb-4 flex items-center gap-2">
            <History size={17} className="text-rbc-sky" />
            <h2 className="font-display text-lg font-bold text-white">Permissions log</h2>
          </div>
          <ol className="relative space-y-3 border-l border-white/10 pl-5">
            <AnimatePresence initial={false}>
              {hydrated &&
                [...log].reverse().map((entry) => (
                  <motion.li key={`${entry.at}-${entry.action}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative">
                    <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-rbc-yellow" />
                    <p className="text-sm text-white">{entry.action}</p>
                    <p className="text-[11px] text-rbc-mist/50">{new Date(entry.at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </motion.li>
                ))}
            </AnimatePresence>
          </ol>
        </Card>

        <Card delay={0.15}>
          <h2 className="font-display text-lg font-bold text-white">Your controls</h2>
          <p className="mt-1 text-sm text-rbc-mist/70">These work instantly in the demo. Production would also purge server copies within the retention limit.</p>
          <div className="mt-5 space-y-3">
            <button onClick={withdraw} className="btn-ghost w-full justify-start">
              <LogOut size={16} /> Withdraw from program insights
            </button>
            <button onClick={() => setConfirmDelete(true)} className="btn-ghost w-full justify-start border-danger/40 text-danger hover:bg-danger/10">
              <Trash2 size={16} /> Delete my Compass data
            </button>
            <Link href="/intern/support" className="btn-ghost w-full justify-start">
              <HeartHandshake size={16} /> Ask an advisor for support
            </Link>
          </div>
          <AnimatePresence>
            {confirmDelete && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 rounded-2xl border border-danger/40 bg-danger/10 p-4">
                  <p className="text-sm font-semibold text-white">Delete everything?</p>
                  <p className="mt-1 text-xs text-rbc-mist/70">Reflections, taps, Wrapped history and support requests. This cannot be undone.</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={del} className="btn bg-danger px-4 py-2 text-white">
                      Delete
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="btn-ghost px-4 py-2">
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      <p className="mt-8 text-center text-sm font-semibold text-rbc-mist/70">
        <Lock size={14} className="mr-1 inline text-rbc-yellow" />
        No employee surveillance. No individual employment risk scores.
      </p>
    </div>
  );
}
