"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Orbits, Particles, Waves } from "@/components/wrapped/Backdrops";
import { CompassLogo } from "@/components/ui/CompassLogo";
import { CountUp } from "@/components/ui/CountUp";
import { INITIAL_POINTS, WRAPPED_STATS, recognitionList, type LiveDemoState } from "@/lib/live/model";
import { Confetti } from "./Confetti";
import { categoryIcon, fmt } from "./LiveBits";

const SLIDE_MS = 5200;
const EASE = [0.16, 1, 0.3, 1] as const;

function Rise({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 40, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay, duration: 0.8, ease: EASE }} className={className}>
      {children}
    </motion.div>
  );
}

function StatSlide({ kicker, value, label, sub }: { kicker: string; value: number; label: string; sub: string }) {
  return (
    <div className="flex h-full flex-col justify-center px-[8vw]">
      <Rise className="text-[2.4vw] font-semibold text-rbc-mist/80">{kicker}</Rise>
      <Rise delay={0.15}>
        <p className="num text-[22vw] font-extrabold leading-[0.85] tracking-tighter text-white sm:text-[16vw]">
          <CountUp value={value} duration={1.6} />
        </p>
      </Rise>
      <Rise delay={0.35} className="font-display text-[4.6vw] font-bold leading-tight text-rbc-yellow">
        {label}
      </Rise>
      <Rise delay={0.7} className="mt-4 max-w-[60vw] text-[1.8vw] text-rbc-mist/75">
        {sub}
      </Rise>
    </div>
  );
}

/** Spotify Wrapped inspired, full screen, auto advancing. Built for a projector. */
export function LiveWrapped({ state, onClose }: { state: LiveDemoState; onClose: () => void }) {
  const recs = useMemo(() => recognitionList(state), [state]);
  const latest = recs[recs.length - 1];
  const earned = state.recognitionPoints - INITIAL_POINTS;

  const slides = useMemo(() => {
    const list: { id: string; bg: string; backdrop?: ReactNode; body: ReactNode }[] = [
      {
        id: "intro",
        bg: "from-[#0A2A5E] via-[#06142E] to-[#005DAA]",
        backdrop: <Orbits />,
        body: (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Rise>
              <CompassLogo size={140} success />
            </Rise>
            <Rise delay={0.25} className="mt-8 text-[1.6vw] font-semibold uppercase tracking-[0.4em] text-rbc-yellow">
              Final Intern Wrapped
            </Rise>
            <Rise delay={0.45}>
              <h1 className="h-display mt-4 text-[8vw] leading-[0.95]">{state.internName}</h1>
            </Rise>
            <Rise delay={0.8} className="mt-6 text-[2vw] text-rbc-mist/80">
              {WRAPPED_STATS.weeks} weeks. One journey. Let&apos;s unwrap it.
            </Rise>
          </div>
        ),
      },
      {
        id: "weeks",
        bg: "from-[#005DAA] via-[#0A2A5E] to-[#06142E]",
        backdrop: <Waves color="#4DA3FF" />,
        body: <StatSlide kicker="You invested" value={WRAPPED_STATS.weeks} label="weeks of professional growth" sub="Every check-in, every reflection, every small win added up." />,
      },
      {
        id: "skills",
        bg: "from-[#06142E] via-[#0A2A5E] to-[#005DAA]",
        backdrop: <Particles color="#4DA3FF" />,
        body: <StatSlide kicker="You developed" value={WRAPPED_STATS.skills} label="new skills" sub="From Kotlin coroutines to payments API design to presenting to senior leaders." />,
      },
      {
        id: "connections",
        bg: "from-[#3b2a00] via-[#06142E] to-[#0A2A5E]",
        backdrop: <Particles />,
        body: <StatSlide kicker="You built" value={WRAPPED_STATS.connections} label="professional connections" sub="Mentors, teammates and peers across RBC who now know your name." />,
      },
      {
        id: "projects",
        bg: "from-[#0A2A5E] via-[#005DAA] to-[#06142E]",
        backdrop: <Waves color="#FFDF01" />,
        body: <StatSlide kicker="You shipped" value={WRAPPED_STATS.projects} label="projects completed" sub="Real work, in production, reaching real clients." />,
      },
      {
        id: "milestones",
        bg: "from-[#06142E] via-[#0A2A5E] to-[#3b2a00]",
        backdrop: <Orbits />,
        body: <StatSlide kicker="You reached" value={WRAPPED_STATS.milestones} label="learning milestones" sub="Courses, certifications and workshops, all in your Career Passport." />,
      },
      {
        id: "points",
        bg: "from-[#3b2a00] via-[#0A2A5E] to-[#06142E]",
        backdrop: <Particles count={40} />,
        body: (
          <div className="flex h-full flex-col justify-center px-[8vw]">
            <Rise className="text-[2.4vw] font-semibold text-rbc-mist/80">You were recognized with</Rise>
            <Rise delay={0.15}>
              <p className="num text-glow text-[17vw] font-extrabold leading-[0.85] tracking-tighter text-rbc-yellow sm:text-[13vw]">
                <CountUp value={state.recognitionPoints} duration={2.2} />
              </p>
            </Rise>
            <Rise delay={0.35} className="font-display text-[4.2vw] font-bold text-white">
              recognition points
            </Rise>
            {earned > 0 && (
              <Rise delay={0.8} className="mt-5 inline-flex w-fit items-center gap-3 rounded-full bg-rbc-yellow px-6 py-3 text-[1.9vw] font-bold text-rbc-ink">
                +{fmt(earned)} awarded live today
              </Rise>
            )}
          </div>
        ),
      },
    ];

    if (recs.length) {
      list.push({
        id: "recognized",
        bg: "from-[#005DAA] via-[#0A2A5E] to-[#3b2a00]",
        backdrop: <Orbits />,
        body: (
          <div className="flex h-full flex-col justify-center px-[8vw]">
            <Rise className="text-[2.4vw] font-semibold text-rbc-mist/80">New achievements unlocked</Rise>
            <div className="mt-6 flex flex-wrap gap-4">
              {recs.slice(-6).map((r, i) => {
                const Icon = categoryIcon(r.category);
                return (
                  <Rise key={r.id} delay={0.2 + i * 0.15} className="flex items-center gap-3 rounded-full border border-rbc-yellow/40 bg-rbc-yellow/10 px-6 py-3 text-[2vw] font-bold text-white">
                    <Icon className="text-rbc-yellow" style={{ width: "2.2vw", height: "2.2vw" }} /> {r.category}
                  </Rise>
                );
              })}
            </div>
            {latest && (
              <Rise delay={0.8} className="mt-10 max-w-[75vw]">
                <p className="font-display text-[3.2vw] font-semibold leading-snug text-white">&ldquo;{latest.message}&rdquo;</p>
                <p className="mt-3 text-[1.6vw] text-rbc-mist/70">From your leadership team</p>
              </Rise>
            )}
          </div>
        ),
      });
    }

    list.push({
      id: "finale",
      bg: "from-[#06142E] via-[#0A2A5E] to-[#005DAA]",
      backdrop: <Particles count={50} />,
      body: (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <Rise>
            <h2 className="h-display text-[7vw] leading-[1]">Your internship ends.</h2>
          </Rise>
          <Rise delay={1.1}>
            <h2 className="h-display text-glow mt-2 text-[7vw] leading-[1] text-rbc-yellow">Your journey doesn&apos;t.</h2>
          </Rise>
          <Rise delay={2} className="mt-10 flex items-center gap-3 text-[1.6vw] text-rbc-mist/70">
            <CompassLogo size={40} success /> RBC Compass
          </Rise>
        </div>
      ),
    });
    return list;
  }, [state, recs, latest, earned]);

  const [index, setIndex] = useState(0);
  const last = slides.length - 1;
  const slide = slides[Math.min(index, last)];

  useEffect(() => {
    if (index >= last) return;
    const t = setTimeout(() => setIndex((i) => i + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, last]);

  const go = useCallback((d: number) => setIndex((i) => Math.max(0, Math.min(last, i + d))), [last]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[70] overflow-hidden bg-rbc-ink"
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.7, ease: EASE }}
      role="dialog"
      aria-label="Intern Wrapped"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          className={`absolute inset-0 bg-gradient-to-br ${slide.bg}`}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          {slide.backdrop}
          <div className="relative z-10 h-full">{slide.body}</div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-x-[4vw] top-6 z-20 flex gap-2">
        {slides.map((s, i) => (
          <div key={s.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
            <motion.div
              key={`${s.id}-${i === index}`}
              className="h-full bg-white"
              initial={{ width: i < index ? "100%" : "0%" }}
              animate={{ width: i < index ? "100%" : i === index ? "100%" : "0%" }}
              transition={{ duration: i === index && i < last ? SLIDE_MS / 1000 : 0.3, ease: "linear" }}
            />
          </div>
        ))}
      </div>
      <button onClick={onClose} className="absolute right-6 top-12 z-20 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20" aria-label="Close Wrapped">
        <X size={18} />
      </button>
      <Confetti fire={slide.id === "finale" ? 2 : slide.id === "points" ? 1 : 0} count={slide.id === "finale" ? 320 : 200} />
    </motion.div>
  );
}
