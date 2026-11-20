"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Cpu, HeartHandshake, Lock, Mic, Nfc, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Card, PageHeader, Pill, Skeleton, Toggle } from "@/components/ui/primitives";
import { CompassLogo } from "@/components/ui/CompassLogo";
import { Magnetic } from "@/components/ui/Magnetic";
import { STATIONS, THEMES } from "@/lib/constants";
import { MAYA_ID } from "@/lib/data/seed";
import { SAMPLE_REFLECTION } from "@/lib/maya";
import { useCompass } from "@/lib/store/compass";
import { detectThemes, type ThemeAnalysis } from "@/lib/themes";
import { cn } from "@/lib/hooks";
import type { StationType, ThemeId } from "@/lib/types";

const THEME_LABEL: Record<ThemeId, string> = {
  ...(Object.fromEntries(THEMES.map((t) => [t.id, t.label])) as Record<ThemeId, string>),
  leaving_intent: "Thinking about leaving",
};

const STEPS = ["Reading on your device", "Finding themes", "Checking if support could help"];

export default function ReflectPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Reflect />
    </Suspense>
  );
}

function Reflect() {
  const params = useSearchParams();
  const stationParam = params.get("station");
  const station = stationParam && stationParam in STATIONS ? (stationParam as StationType) : undefined;
  const contribute = useCompass((s) => s.contributeReflections);
  const setContribute = useCompass((s) => s.setContributeReflections);
  const addReflection = useCompass((s) => s.addReflection);
  const toast = useCompass((s) => s.toast);

  const [chips, setChips] = useState<ThemeId[]>([]);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"write" | "analyzing" | "done">("write");
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState<ThemeAnalysis | null>(null);

  useEffect(() => {
    if (station === "cross_team_lunch") setChips(["team_dynamics", "belonging"]);
    if (station === "mentor_coffee") setChips(["mentorship"]);
    if (station === "workshop") setChips(["learning", "career_growth"]);
    if (station === "senior_ama") setChips(["career_growth"]);
  }, [station]);

  const submit = () => {
    const analysis = detectThemes(text, chips);
    setResult(analysis);
    setPhase("analyzing");
    setStepIdx(0);
    STEPS.forEach((_, i) => setTimeout(() => setStepIdx(i + 1), 650 * (i + 1)));
    setTimeout(() => {
      setPhase("done");
      addReflection({
        id: `r-${Date.now()}`,
        internId: MAYA_ID,
        createdAt: Date.now(),
        text,
        chips,
        detected: analysis.themes.map((t) => t.id),
        optIn: contribute,
        stationType: station,
      });
    }, 650 * STEPS.length + 500);
  };

  const reset = () => {
    setPhase("write");
    setText("");
    setChips([]);
    setResult(null);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Evening reflection · about 30 seconds" title="How did today really go?">
        Write as much or as little as you like. Your words stay on this device. Only theme counts leave, and only if you say so.
      </PageHeader>

      <AnimatePresence mode="wait">
        {phase === "write" && (
          <motion.div key="write" exit={{ opacity: 0, y: -10 }}>
            <Card>
              {station && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rbc-gold/30 bg-rbc-gold/[0.08] px-3 py-2 text-sm text-white">
                  <Nfc size={16} className="text-rbc-gold" /> Linked to your {STATIONS[station].label} tap
                </div>
              )}
              <p className="text-sm font-semibold text-white">What was on your mind?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {THEMES.map((t) => {
                  const on = chips.includes(t.id);
                  return (
                    <motion.button
                      key={t.id}
                      layout
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setChips(on ? chips.filter((c) => c !== t.id) : [...chips, t.id])}
                      aria-pressed={on}
                      className={cn("chip", on && "border-rbc-yellow/60 bg-rbc-yellow/10 text-rbc-yellow")}
                    >
                      {on && <Check size={13} />} {t.label}
                    </motion.button>
                  );
                })}
              </div>

              <div className="relative mt-5">
                <label htmlFor="reflection" className="sr-only">
                  Your reflection
                </label>
                <textarea
                  id="reflection"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                  placeholder="One win, one challenge, anything else..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-rbc-ink/50 p-4 pr-14 text-[15px] leading-relaxed text-white placeholder:text-rbc-mist/40 focus:border-rbc-yellow/50 focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Voice input (placeholder)"
                  onClick={() => toast({ title: "Voice input is a placeholder", body: "On device speech to text would go here.", tone: "info" })}
                  className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white/[0.08] text-rbc-mist hover:bg-white/[0.14]"
                >
                  <Mic size={18} />
                </button>
              </div>
              <button onClick={() => setText(SAMPLE_REFLECTION)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rbc-sky hover:underline">
                <Wand2 size={13} /> Use Maya&apos;s sample
              </button>

              <div className="mt-5 rounded-2xl bg-white/[0.04] p-4">
                <Toggle
                  checked={contribute}
                  onChange={setContribute}
                  label="Contribute anonymized themes"
                  description="Only theme counts like 'mentorship' join program insights, for groups of 10 or more. Never your words."
                />
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-rbc-mist/50">
                  <Lock size={13} /> Private by default
                </span>
                <Magnetic className="btn-primary" onClick={submit} disabled={!text.trim() && chips.length === 0}>
                  Save reflection <ArrowRight size={16} />
                </Magnetic>
              </div>
            </Card>
          </motion.div>
        )}

        {phase === "analyzing" && (
          <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <Card className="py-10 text-center">
              <div className="relative mx-auto grid h-24 w-24 place-items-center">
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-dashed border-rbc-sky/50"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                <Cpu className="text-rbc-sky" size={32} />
              </div>
              <p className="mt-5 font-display text-xl font-bold text-white">Private analysis</p>
              <p className="text-sm text-rbc-mist/60">Runs on your device. Nothing is sent anywhere.</p>
              <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex items-center gap-2 text-sm">
                    {stepIdx > i ? (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid h-5 w-5 place-items-center rounded-full bg-success text-rbc-ink">
                        <Check size={12} />
                      </motion.span>
                    ) : (
                      <span className="h-5 w-5 animate-pulse rounded-full border border-white/20" />
                    )}
                    <span className={stepIdx > i ? "text-white" : "text-rbc-mist/50"}>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}

        {phase === "done" && result && (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <Card>
              <div className="flex items-center gap-3">
                <CompassLogo size={40} success />
                <div>
                  <p className="font-display text-xl font-bold text-white">Saved. Here is what Nav noticed.</p>
                  <p className="text-xs text-rbc-mist/60">Deterministic keyword themes. Same words, same result, every time.</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {result.themes.length === 0 && <span className="text-sm text-rbc-mist/60">No strong themes today. That is okay.</span>}
                {result.themes.map((t, i) => (
                  <motion.span key={t.id} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * i, type: "spring", stiffness: 300, damping: 18 }}>
                    <Pill tone={t.id === "leaving_intent" ? "warning" : "blue"} className="px-3 py-1 text-xs">
                      <Sparkles size={12} /> {THEME_LABEL[t.id]}
                      {t.hits.length > 0 && <span className="font-normal text-rbc-mist/60">&nbsp;&ldquo;{t.hits[0]}&rdquo;</span>}
                    </Pill>
                  </motion.span>
                ))}
              </div>
              <p className="mt-4 text-sm text-rbc-mist/70">
                Overall tone: <span className="font-semibold text-white">{result.sentiment === "concern" ? "Some concerns" : result.sentiment === "mixed" ? "Mixed" : "Positive"}</span>
              </p>
              <div className="mt-4 rounded-2xl bg-white/[0.04] p-3 text-xs text-rbc-mist/70">
                <span className="font-semibold text-white">What leaves your device: </span>
                {contribute
                  ? `theme counts only (${result.themes.map((t) => THEME_LABEL[t.id]).join(", ") || "none"}), pooled with 10 or more interns.`
                  : "nothing. You chose to keep this reflection fully private."}
              </div>
            </Card>

            {result.suggestion && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="border-rbc-yellow/40">
                  <div className="flex items-start gap-3">
                    <HeartHandshake className="mt-0.5 shrink-0 text-rbc-yellow" />
                    <div>
                      <p className="font-display text-lg font-bold text-white">{result.suggestion.title}</p>
                      <p className="mt-1 text-sm text-rbc-mist/75">{result.suggestion.body}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link href="/intern/gap" className="btn-primary">
                          See options to close my gap
                        </Link>
                        <Link href={result.suggestion.href} className="btn-ghost">
                          Ask an advisor, my choice
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            <div className="flex gap-2">
              <button onClick={reset} className="btn-ghost">
                <RotateCcw size={15} /> Write another
              </button>
              <Link href="/intern" className="btn-ghost">
                Back home
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
