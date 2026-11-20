"use client";

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { Award, Coffee, GraduationCap, Mic, Pause, Play, Share2, ShieldCheck, Sparkles, UtensilsCrossed, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Orbits, Particles, Waves } from "@/components/wrapped/Backdrops";
import { CompassLogo } from "@/components/ui/CompassLogo";
import { CountUp } from "@/components/ui/CountUp";
import { useCompass } from "@/lib/store/compass";
import { useMaya, useHydrated, cn } from "@/lib/hooks";
import { getSeed, MAYA_ID } from "@/lib/data/seed";
import { personalGap } from "@/lib/gap";
import { MAYA_PROFILE } from "@/lib/maya";
import { STATIONS, STATION_IDS, dimLabel, dimShort } from "@/lib/constants";
import type { StationType } from "@/lib/types";

const DURATION = 7000;

const STATION_ICONS: Record<StationType, typeof Coffee> = {
  mentor_coffee: Coffee,
  cross_team_lunch: UtensilsCrossed,
  workshop: GraduationCap,
  senior_ama: Mic,
};

function Big({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("num text-[96px] font-extrabold leading-none tracking-tighter text-white sm:text-[120px]", className)}>{children}</p>;
}

function Line({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

export default function WrappedPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const hydrated = useHydrated();
  const maya = useMaya();
  const events = useCompass((s) => s.events);
  const toast = useCompass((s) => s.toast);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const holdRef = useRef(false);

  const data = useMemo(() => {
    const mine = hydrated ? events.filter((e) => e.internId === MAYA_ID && e.status !== "pending") : [];
    const byType = { ...MAYA_PROFILE.baseExperiences };
    mine.filter((e) => e.kind === "station").forEach((e) => (byType[e.stationType!] += 1));
    const experiences = Object.values(byType).reduce((a, b) => a + b, 0);
    const newConnections = mine.filter((e) => e.kind === "connect");
    const crossTeam = 2 + newConnections.filter((e) => e.dimensions.includes("cross_team")).length;
    const latest = [...mine].sort((a, b) => b.at - a.at)[0];
    const justAdded = latest && Date.now() - latest.at < 15 * 60 * 1000 ? latest : undefined;

    const seedMaya = getSeed().find((i) => i.id === MAYA_ID)!;
    const before = personalGap(seedMaya);
    const after = personalGap(maya);
    const journey = after
      .map((a) => ({ ...a, before: before.find((b) => b.dimension === a.dimension)!.gap }))
      .map((a) => ({ ...a, change: a.before - a.gap }))
      .sort((a, b) => b.change - a.change || b.before - a.before)
      .slice(0, 3);
    return { byType, experiences, connections: maya.connections, crossTeam, justAdded, journey };
  }, [events, hydrated, maya]);

  const closedAny = data.journey.some((j) => j.change > 0.05);

  const cards: { id: string; bg: string; render: () => ReactNode; backdrop?: ReactNode }[] = [
    {
      id: "intro",
      bg: "from-[#0A2A5E] via-[#06142E] to-[#005DAA]",
      backdrop: <Orbits />,
      render: () => (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <Line>
            <CompassLogo size={88} success />
          </Line>
          <Line delay={0.2} className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-rbc-yellow">
            Weeks 5 to 6
          </Line>
          <Line delay={0.35}>
            <h1 className="h-display mt-3 text-5xl leading-[1.02]">
              Your Wrapped,
              <br />
              Maria.
            </h1>
          </Line>
          <Line delay={0.6} className="mt-4 text-rbc-mist/70">
            Two weeks. Here is what you made of them.
          </Line>
        </div>
      ),
    },
    {
      id: "skills",
      bg: "from-[#005DAA] via-[#0A2A5E] to-[#06142E]",
      backdrop: <Waves color="#4DA3FF" />,
      render: () => (
        <div className="flex h-full flex-col justify-center">
          <Line className="text-lg text-rbc-mist/80">You picked up</Line>
          <Big>
            <CountUp value={MAYA_PROFILE.skills.length} />
          </Big>
          <Line delay={0.1} className="font-display text-3xl font-bold text-white">
            new skills
          </Line>
          <div className="mt-8 space-y-2">
            {MAYA_PROFILE.skills.map((s, i) => (
              <Line key={s} delay={0.4 + i * 0.15} className="rounded-2xl bg-white/10 px-4 py-3 text-lg font-semibold text-white backdrop-blur">
                {s}
              </Line>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "connections",
      bg: "from-[#3b2a00] via-[#06142E] to-[#0A2A5E]",
      backdrop: <Particles />,
      render: () => (
        <div className="flex h-full flex-col justify-center">
          <Line className="text-lg text-rbc-mist/80">You connected with</Line>
          <Big className="text-rbc-yellow text-glow">
            <CountUp value={data.connections} />
          </Big>
          <Line delay={0.1} className="font-display text-3xl font-bold text-white">
            people
          </Line>
          <Line delay={0.5} className="mt-6 text-lg text-rbc-mist/80">
            <span className="num font-bold text-white">{data.crossTeam}</span> of them work on other teams. Every one was a Tap to Connect you both approved.
          </Line>
        </div>
      ),
    },
    {
      id: "experiences",
      bg: "from-[#1c1912] via-[#0b0b0d] to-[#06142E]",
      backdrop: <Particles color="#C9A961" count={18} />,
      render: () => (
        <div className="flex h-full flex-col justify-center">
          {data.justAdded && (
            <Line className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-rbc-gold/20 px-3 py-1 text-xs font-bold text-rbc-gold">
              <Sparkles size={13} /> Just added from your tap
            </Line>
          )}
          <Line className="text-lg text-rbc-mist/80">You showed up for</Line>
          <Big className="text-rbc-gold">
            <CountUp value={data.experiences} />
          </Big>
          <Line delay={0.1} className="font-display text-3xl font-bold text-white">
            experiences
          </Line>
          <div className="mt-6 grid grid-cols-2 gap-2">
            {STATION_IDS.map((s, i) => {
              const Icon = STATION_ICONS[s];
              const fresh = data.justAdded?.stationType === s;
              return (
                <Line key={s} delay={0.3 + i * 0.1} className={cn("rounded-2xl p-3 backdrop-blur", fresh ? "bg-rbc-gold/25 ring-1 ring-rbc-gold" : "bg-white/10")}>
                  <Icon size={18} className="text-rbc-gold" />
                  <p className="num mt-1 text-2xl font-bold text-white">{data.byType[s]}</p>
                  <p className="text-xs text-rbc-mist/70">{STATIONS[s].label}</p>
                </Line>
              );
            })}
          </div>
          <Line delay={0.8} className="mt-3 text-xs text-rbc-mist/50">
            From your Nav nametag taps. Type of experience only, never location.
          </Line>
        </div>
      ),
    },
    {
      id: "recognition",
      bg: "from-[#0A2A5E] via-[#06142E] to-[#2a1f00]",
      backdrop: <Orbits />,
      render: () => (
        <div className="flex h-full flex-col justify-center">
          <Line>
            <Award size={40} className="text-rbc-yellow" />
          </Line>
          <Line delay={0.1} className="mt-4 text-lg text-rbc-mist/80">
            Your team recognized you
          </Line>
          <Big className="text-[80px] sm:text-[100px]">
            <CountUp value={MAYA_PROFILE.recognition.points} />
          </Big>
          <Line delay={0.2} className="font-display text-2xl font-bold text-white">
            recognition points from {MAYA_PROFILE.recognition.shoutouts} shout-outs
          </Line>
          <Line delay={0.6} className="mt-6 rounded-2xl bg-white/10 p-3 text-xs text-rbc-mist/70">
            Simulated recognition integration. Points are never awarded for giving feedback, sharing personal information or positive ratings.
          </Line>
        </div>
      ),
    },
    {
      id: "journey",
      bg: "from-[#06142E] via-[#0A2A5E] to-[#005DAA]",
      backdrop: <Waves color="#FFDF01" />,
      render: () => (
        <div className="flex h-full flex-col justify-center">
          <Line className="text-sm font-semibold uppercase tracking-[0.25em] text-rbc-yellow">Your Gap Journey</Line>
          <Line delay={0.1}>
            <h2 className="h-display mt-2 text-4xl leading-tight">
              {closedAny ? "You started closing the gap." : "Here is where to grow next."}
            </h2>
          </Line>
          <div className="mt-8 space-y-5">
            {data.journey.map((j, i) => {
              const pct = (g: number) => `${Math.min(100, (g / 4) * 100)}%`;
              return (
                <Line key={j.dimension} delay={0.3 + i * 0.15}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-white">{dimLabel(j.dimension)}</span>
                    <span className="text-xs text-rbc-mist/70">{j.change > 0.05 ? `Closed ${j.change.toFixed(1)} of ${j.before.toFixed(1)}` : `Gap ${j.gap.toFixed(1)} of 4`}</span>
                  </div>
                  <div className="relative mt-2 h-3 rounded-full bg-white/10">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-white/20" style={{ width: pct(j.before) }} />
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-rbc-yellow"
                      initial={{ width: pct(j.before) }}
                      animate={{ width: pct(j.gap) }}
                      transition={{ duration: 1.4, delay: 0.8 + i * 0.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </Line>
              );
            })}
          </div>
          <Line delay={1} className="mt-6 text-sm text-rbc-mist/70">
            {closedAny ? "Tap verified experiences moved these. Keep going." : `Your biggest gap is ${dimShort(data.journey[0].dimension)}. One tap at the right station starts closing it.`}
          </Line>
        </div>
      ),
    },
    {
      id: "next",
      bg: "from-[#005DAA] via-[#06142E] to-[#0A2A5E]",
      backdrop: <Particles color="#4DA3FF" />,
      render: () => (
        <div className="flex h-full flex-col justify-center">
          <Line className="text-sm font-semibold uppercase tracking-[0.25em] text-rbc-sky">Next chapter</Line>
          <Line delay={0.15}>
            <h2 className="h-display mt-3 text-4xl leading-tight">
              Before week 8: <span className="text-rbc-yellow">2 mentor chats</span> and <span className="text-rbc-yellow">1 cross-team lunch.</span>
            </h2>
          </Line>
          <Line delay={0.5} className="mt-5 text-rbc-mist/75">
            Chosen from your biggest gaps. You can change it anytime.
          </Line>
        </div>
      ),
    },
    {
      id: "summary",
      bg: "from-[#06142E] via-[#0A2A5E] to-[#06142E]",
      render: () => (
        <div className="flex h-full flex-col justify-center">
          <Line className="rounded-[28px] border border-rbc-gold/40 bg-[linear-gradient(135deg,#141414,#0b0b0d_55%,#1c1912)] p-6 shadow-[0_0_60px_-20px_rgba(201,169,97,0.6)]">
            <div className="flex items-center gap-2">
              <CompassLogo size={30} success />
              <span className="font-display font-bold text-white">
                RBC <span className="text-rbc-gold">Nav</span> Wrapped
              </span>
            </div>
            <p className="mt-1 text-xs text-rbc-mist/50">Maria · Weeks 5 to 6</p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                { v: data.connections, l: "connections" },
                { v: data.experiences, l: "experiences" },
                { v: MAYA_PROFILE.skills.length, l: "new skills" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="num text-4xl font-bold text-white">
                    <CountUp value={s.v} />
                  </p>
                  <p className="text-[11px] text-rbc-mist/60">{s.l}</p>
                </div>
              ))}
            </div>
          </Line>
          <Line delay={0.3} className="mt-4 flex items-center gap-1.5 text-xs text-rbc-mist/60">
            <ShieldCheck size={14} className="text-success" /> Share-safe: no reflections, moods or gaps included.
          </Line>
          <Line delay={0.4} className="mt-5 flex gap-2">
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const text = `My RBC Nav Wrapped, weeks 5 to 6: ${data.connections} connections, ${data.experiences} experiences, ${MAYA_PROFILE.skills.length} new skills.`;
                try {
                  if (navigator.share) await navigator.share({ title: "My Nav Wrapped", text });
                  else {
                    await navigator.clipboard.writeText(text);
                    toast({ title: "Copied share-safe summary" });
                  }
                } catch {
                  // Share sheet dismissed.
                }
              }}
              className="btn-primary flex-1 py-3"
            >
              <Share2 size={16} /> Share
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push("/intern");
              }}
              className="btn-ghost py-3"
            >
              Done
            </button>
          </Line>
        </div>
      ),
    },
  ];

  const total = cards.length;
  const go = useCallback(
    (i: number) => {
      setProgress(0);
      setIndex(Math.max(0, Math.min(total - 1, i)));
    },
    [total],
  );

  const progressRef = useRef(0);
  useEffect(() => {
    progressRef.current = 0;
    if (paused || reduce || index === total - 1) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = t - last;
      last = t;
      if (!holdRef.current) {
        progressRef.current += dt / DURATION;
        if (progressRef.current >= 1) {
          setProgress(0);
          setIndex((i) => Math.min(total - 1, i + 1));
          return;
        }
        setProgress(progressRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, reduce, index, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        go(index + 1);
      }
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "Escape") router.push("/intern");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, router]);

  const stageRef = useRef<HTMLDivElement>(null);
  const onTap = (_: unknown, info: { point: { x: number } }) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    if (info.point.x - window.scrollX - r.left < r.width * 0.3) go(index - 1);
    else go(index + 1);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) go(index + 1);
    else if (info.offset.x > 60) go(index - 1);
  };

  const card = cards[index];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-rbc-ink sm:p-6">
      <div ref={stageRef} className="relative h-full w-full overflow-hidden bg-rbc-ink sm:h-[min(860px,94dvh)] sm:max-w-[440px] sm:rounded-[36px] sm:border sm:border-white/10 sm:shadow-card">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={cn("absolute inset-0 bg-gradient-to-br", card.bg)}
          >
            {card.backdrop}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={onDragEnd}
              onTap={card.id === "summary" ? undefined : onTap}
              onPointerDown={() => (holdRef.current = true)}
              onPointerUp={() => (holdRef.current = false)}
              onPointerLeave={() => (holdRef.current = false)}
              className="relative h-full cursor-pointer select-none px-7 pb-24 pt-24"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${total}`}
            >
              {card.render()}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-x-0 top-0 z-10 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex gap-1">
            {cards.map((c, i) => (
              <button key={c.id} onClick={() => go(i)} aria-label={`Go to card ${i + 1}`} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                <span
                  className="block h-full rounded-full bg-white"
                  style={{ width: i < index ? "100%" : i === index ? `${(index === total - 1 ? 1 : progress) * 100}%` : "0%" }}
                />
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-white/80">
              <CompassLogo size={22} /> Nav Wrapped
            </span>
            <div className="flex gap-1">
              <button aria-label={paused ? "Play" : "Pause"} onClick={() => setPaused((p) => !p)} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white">
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button aria-label="Close Wrapped" onClick={() => router.push("/intern")} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
        <p className="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-[10px] text-white/40">Tap or swipe · Synthetic data</p>
      </div>
    </div>
  );
}
