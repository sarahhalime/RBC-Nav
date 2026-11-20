"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Compass,
  MessageCircleQuestion,
  MessageSquareText,
  Radar,
  Shield,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Pill } from "@/components/ui/primitives";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useCompass } from "@/lib/store/compass";
import { useHydrated, cn } from "@/lib/hooks";
import { MAYA_PROFILE } from "@/lib/maya";
import { CURRENT_WEEK, PROGRAM_WEEKS } from "@/lib/constants";

const MOODS = [
  { emoji: "😣", label: "Rough" },
  { emoji: "😕", label: "Meh" },
  { emoji: "😐", label: "Okay" },
  { emoji: "🙂", label: "Good" },
  { emoji: "🤩", label: "Great" },
];

const TILES = [
  { href: "/intern/reflect", label: "Reflect", body: "30 seconds tonight", icon: MessageSquareText, tone: "from-rbc-blue/40" },
  { href: "/intern/wrapped", label: "Wrapped", body: "Weeks 5 to 6 are ready", icon: Sparkles, tone: "from-rbc-yellow/25" },
  { href: "/intern/gap", label: "My Gap", body: "Expected vs lived", icon: Radar, tone: "from-rbc-sky/30" },
  { href: "/intern/vault", label: "Profile settings", body: "You control sharing", icon: Shield, tone: "from-success/25" },
];

const ASK = [
  {
    q: "How do return offers work?",
    a: "Return offer conversations usually start around week 12. Ask your manager what good looks like for your role. The Career path workshop on Tuesday covers timelines.",
  },
  {
    q: "My mentor keeps rescheduling. What can I do?",
    a: "Try proposing a fixed 20 minute slot every two weeks. If it still slips, an Early Talent advisor can help, only if you ask.",
  },
  {
    q: "Who sees my reflections?",
    a: "Only you. If you opt in, anonymous theme counts can join program insights for groups of 10 or more. Never the text itself.",
  },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function InternHome() {
  const hydrated = useHydrated();
  const mood = useCompass((s) => s.mood);
  const setMood = useCompass((s) => s.setMood);
  const expectations = useCompass((s) => s.expectations);
  const [goalDone, setGoalDone] = useState(false);
  const [ask, setAsk] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const [hello, setHello] = useState("Good morning");

  useEffect(() => setHello(greeting()), []);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="eyebrow">Technology · Mobile Banking · Toronto</p>
          <h1 className="h-display mt-2 text-4xl sm:text-5xl">
            {hello}, <span className="text-rbc-yellow text-glow">{MAYA_PROFILE.first}</span>
          </h1>
          <p className="mt-2 text-rbc-mist/70">Your check-in takes about a minute. Everything here is private by default.</p>
        </motion.div>
        <ProgressRing value={CURRENT_WEEK} total={PROGRAM_WEEKS} />
      </div>

      {hydrated && !expectations && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link
            href="/intern/expectations"
            className="group flex items-center gap-4 rounded-card border border-rbc-yellow/40 bg-rbc-yellow/[0.07] p-4 transition-colors hover:bg-rbc-yellow/[0.12]"
          >
            <Compass className="shrink-0 text-rbc-yellow" />
            <div className="flex-1">
              <p className="font-semibold text-white">Set your Expectation Nav</p>
              <p className="text-sm text-rbc-mist/70">60 seconds. Tell us what you want from RBC so Nav can help you get it.</p>
            </div>
            <ArrowRight className="text-rbc-yellow transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="text-sm font-semibold text-white">How are you feeling today?</p>
          <div className="mt-4 grid grid-cols-5 gap-2" role="radiogroup" aria-label="Mood">
            {MOODS.map((m, i) => {
              const on = hydrated && mood === i;
              return (
                <motion.button
                  key={m.label}
                  role="radio"
                  aria-checked={on}
                  aria-label={m.label}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMood(i)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border py-3 transition-colors",
                    on ? "border-rbc-yellow/60 bg-rbc-yellow/10" : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]",
                  )}
                >
                  <motion.span animate={on ? { scale: [1, 1.35, 1.15] } : { scale: 1 }} className="text-3xl sm:text-4xl">
                    {m.emoji}
                  </motion.span>
                  <span className="text-[11px] text-rbc-mist/60">{m.label}</span>
                </motion.button>
              );
            })}
          </div>
          <AnimatePresence>
            {hydrated && mood !== null && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 flex items-center gap-1.5 text-xs text-success">
                <Check size={14} /> Logged privately. Moods are never shared or used as a risk signal.
              </motion.p>
            )}
          </AnimatePresence>
        </Card>

        <Card delay={0.05}>
          <div className="flex items-center gap-2">
            <CalendarClock size={17} className="text-rbc-sky" />
            <p className="text-sm font-semibold text-white">Upcoming mentor chat</p>
          </div>
          <p className="mt-3 font-display text-xl font-bold text-white">{MAYA_PROFILE.mentor}</p>
          <p className="text-sm text-rbc-mist/70">{MAYA_PROFILE.nextMentorChat}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Pill tone="warning">Last chat {MAYA_PROFILE.lastMentorChat}</Pill>
          </div>
          <p className="mt-3 text-xs text-rbc-mist/60">Tap your nametag at the Mentor Coffee Chat station to log it.</p>
        </Card>

        <Card delay={0.1} className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <Target size={17} className="text-rbc-yellow" />
            <p className="text-sm font-semibold text-white">Today&apos;s goal</p>
          </div>
          <button
            onClick={() => setGoalDone((v) => !v)}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white/[0.04] p-4 text-left hover:bg-white/[0.07]"
            aria-pressed={goalDone}
          >
            <motion.span
              animate={goalDone ? { scale: [1, 1.3, 1] } : {}}
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full border-2",
                goalDone ? "border-success bg-success text-rbc-ink" : "border-white/30",
              )}
            >
              {goalDone && <Check size={15} />}
            </motion.span>
            <span className={cn("text-sm", goalDone ? "text-rbc-mist/50 line-through" : "text-white")}>
              Ask someone from another team what they are building this sprint.
            </span>
          </button>
          <p className="mt-2 text-xs text-rbc-mist/50">Picked because Cross-team exposure is your biggest gap.</p>
        </Card>

        <Card delay={0.15}>
          <button onClick={() => setAsk(true)} className="flex h-full w-full flex-col items-start text-left">
            <MessageCircleQuestion className="text-rbc-yellow" />
            <p className="mt-3 font-display text-lg font-bold text-white">Ask Nav</p>
            <p className="text-sm text-rbc-mist/70">Quick answers about the program. Private.</p>
          </button>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TILES.map((t, i) => (
          <motion.div key={t.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }} whileHover={{ y: -4 }}>
            <Link href={t.href} className={cn("glass group block h-full rounded-card bg-gradient-to-br to-transparent p-5", t.tone)}>
              <t.icon className="text-white" />
              <p className="mt-6 font-display text-lg font-bold text-white">{t.label}</p>
              <p className="text-xs text-rbc-mist/70">{t.body}</p>
              <ArrowRight size={16} className="mt-3 text-rbc-yellow transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {ask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-rbc-ink/70 p-4 backdrop-blur-sm"
            onClick={() => setAsk(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Ask Nav"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-lg rounded-card p-6"
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-bold text-white">Ask Nav</p>
                <button aria-label="Close" onClick={() => setAsk(false)} className="text-rbc-mist/60 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {ASK.map((a, i) => (
                  <button key={a.q} onClick={() => setAnswer(i)} className={cn("chip text-left", answer === i && "border-rbc-yellow/50 text-rbc-yellow")}>
                    {a.q}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                {answer !== null && (
                  <motion.p key={answer} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 rounded-2xl bg-white/[0.05] p-4 text-sm leading-relaxed text-rbc-mist/90">
                    {ASK[answer].a}
                  </motion.p>
                )}
              </AnimatePresence>
              <p className="mt-4 text-[11px] text-rbc-mist/50">Curated answers in this prototype. Production would use RBC approved AI infrastructure.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
