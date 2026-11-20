"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RadarChart } from "@/components/charts/RadarChart";
import { CompassLogo } from "@/components/ui/CompassLogo";
import { DIMENSIONS } from "@/lib/constants";
import { useCompass } from "@/lib/store/compass";
import { cn } from "@/lib/hooks";
import type { DimensionId, Expectation } from "@/lib/types";

const SCALE = [
  { v: 1, label: "Not a priority" },
  { v: 2, label: "Nice to have" },
  { v: 3, label: "Matters" },
  { v: 4, label: "Really want it" },
  { v: 5, label: "Essential" },
];

export default function ExpectationsPage() {
  const router = useRouter();
  const setExpectations = useCompass((s) => s.setExpectations);
  const toast = useCompass((s) => s.toast);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Expectation>>({});
  const [dir, setDir] = useState(1);
  const done = step >= DIMENSIONS.length;
  const progress = Math.min(step, DIMENSIONS.length) / DIMENSIONS.length;

  const pick = (dim: DimensionId, v: number) => {
    setAnswers((a) => ({ ...a, [dim]: v }));
    setDir(1);
    setTimeout(() => setStep((s) => s + 1), 220);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 5) pick(DIMENSIONS[step].id, n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const save = () => {
    setExpectations(answers as Expectation);
    toast({ title: "Expectation Nav saved", body: "Nav will compare this with what you experience." });
    router.push("/intern/gap");
  };

  const q = DIMENSIONS[step];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-4">
        <motion.div animate={{ rotate: progress * 360 }} transition={{ type: "spring", stiffness: 80, damping: 14 }}>
          <CompassLogo size={56} success={done} />
        </motion.div>
        <div className="flex-1">
          <p className="eyebrow">Expectation Nav · 60 seconds</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-rbc-yellow to-rbc-sky" animate={{ width: `${progress * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-rbc-mist/50">
            {done ? "All set" : `${step + 1} of ${DIMENSIONS.length}`}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait" custom={dir}>
        {!done ? (
          <motion.div
            key={q.id}
            custom={dir}
            initial={{ opacity: 0, x: 60 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 * dir }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="h-display text-3xl leading-tight sm:text-4xl">
              How much do you want to <span className="text-rbc-yellow">{q.want}</span>?
            </h1>
            <p className="mt-2 text-sm text-rbc-mist/60">{q.label}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-5" role="radiogroup" aria-label={q.label}>
              {SCALE.map((s, i) => {
                const on = answers[q.id] === s.v;
                return (
                  <motion.button
                    key={s.v}
                    role="radio"
                    aria-checked={on}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => pick(q.id, s.v)}
                    className={cn(
                      "glass flex items-center gap-3 rounded-2xl p-4 text-left sm:flex-col sm:items-start sm:py-6",
                      on && "border-rbc-yellow/70 bg-rbc-yellow/10",
                    )}
                  >
                    <span className="num text-3xl font-bold text-rbc-yellow">{s.v}</span>
                    <span className="text-sm font-semibold text-white">{s.label}</span>
                  </motion.button>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-between text-xs text-rbc-mist/50">
              <button
                disabled={step === 0}
                onClick={() => {
                  setDir(-1);
                  setStep((s) => s - 1);
                }}
                className="inline-flex items-center gap-1 disabled:opacity-30"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <span className="hidden sm:inline">Tip: press 1 to 5</span>
            </div>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <h1 className="h-display text-3xl sm:text-4xl">This is your nav.</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-rbc-mist/70">
              What you want from RBC. As your weeks unfold, Nav will draw what you actually experience on top, privately.
            </p>
            <div className="mt-6 flex justify-center">
              <RadarChart
                points={DIMENSIONS.map((d) => ({ dimension: d.id, expected: answers[d.id] ?? 3 }))}
                showExperience={false}
                pulseGaps={false}
                drawDelay={0.2}
              />
            </div>
            <button onClick={save} className="btn-primary mt-4 px-7 py-3">
              Save and see my gap <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
