"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, Radar, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { RoleGate } from "@/components/shell/RoleGate";
import { DumbbellChart, DumbbellLegend } from "@/components/charts/DumbbellChart";
import { Filters } from "@/components/insights/Filters";
import { SliceMatrix } from "@/components/insights/SliceMatrix";
import { AlertCards, RetentionPanel, VelocityGrid } from "@/components/insights/Signals";
import { GapCloser } from "@/components/insights/GapCloser";
import { Card, InfoTip, PageHeader, Pill, PrivacyLock, Toggle } from "@/components/ui/primitives";
import { CountUp } from "@/components/ui/CountUp";
import { useInterns } from "@/lib/hooks";
import { useCompass } from "@/lib/store/compass";
import { BLEND, cohortAlerts, computeGap, INTERVENTIONS, simulateIntervention } from "@/lib/gap";
import { dimShort, PROGRAM_STATS } from "@/lib/constants";
import { DEMO_STEPS } from "@/lib/demo";
import type { Alert, DimensionId, Filter } from "@/lib/types";

export default function InsightsPage() {
  return (
    <RoleGate allow="leader">
      <Insights />
    </RoleGate>
  );
}

function Insights() {
  const interns = useInterns();
  const toast = useCompass((s) => s.toast);
  const [filter, setFilter] = useState<Filter>({ cohorts: [], areas: [], weekStart: 1, weekEnd: 6 });
  const [guardrail, setGuardrail] = useState(false);
  const [simOn, setSimOn] = useState(false);
  const [selected, setSelected] = useState("rotation_day");
  const [intensity, setIntensity] = useState(60);
  const [flash, setFlash] = useState<DimensionId[]>([]);

  const snap = useMemo(() => computeGap(interns, filter), [interns, filter]);
  const alerts = useMemo(() => cohortAlerts(interns, filter.weekEnd), [interns, filter.weekEnd]);
  const iv = INTERVENTIONS.find((i) => i.id === selected)!;
  const projected = useMemo(
    () => (simOn && !snap.hidden ? simulateIntervention(snap.rows, iv, intensity) : undefined),
    [simOn, snap, iv, intensity],
  );

  // Live: when a tap closes a gap in this view, glow that row and announce it.
  const prev = useRef<Record<string, number> | null>(null);
  useEffect(() => {
    if (snap.hidden) {
      prev.current = null;
      return;
    }
    const now = Object.fromEntries(snap.rows.map((r) => [r.dimension, r.gap]));
    if (prev.current) {
      const closed = snap.rows.filter((r) => prev.current![r.dimension] !== undefined && r.gap < prev.current![r.dimension]);
      if (closed.length) {
        setFlash(closed.map((c) => c.dimension));
        const top = closed[0];
        toast({
          title: `${dimShort(top.dimension)} gap closed by ${prev.current[top.dimension] - top.gap} pts`,
          body: "New tap verified experiences just landed.",
        });
        setTimeout(() => setFlash([]), 2200);
      }
    }
    prev.current = now;
  }, [snap, toast]);

  const demoPath = useCompass((s) => (s.demo.active ? DEMO_STEPS[s.demo.step]?.path : undefined));
  useEffect(() => {
    if (window.location.hash === "#simulator" || demoPath?.endsWith("#simulator")) {
      setSimOn(true);
      setTimeout(() => document.getElementById("simulator")?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    } else if (demoPath === "/insights") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [demoPath]);

  const onSimulateAlert = (a: Alert) => {
    setSelected(a.interventionId);
    setSimOn(true);
    setFilter({ ...filter, cohorts: [a.cohort], areas: [] });
    document.getElementById("simulator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scope =
    filter.cohorts.length || filter.areas.length
      ? [filter.cohorts.join(", "), filter.areas.join(", ")].filter(Boolean).join(" · ")
      : "All cohorts and business areas";

  return (
    <div>
      <PageHeader
        eyebrow="Program leader · Experience Gap"
        title={
          <>
            What interns expected <span className="text-rbc-yellow">vs</span> what they live.
          </>
        }
        right={
          <div className="flex flex-wrap gap-2">
            <Pill tone="blue">
              <ShieldCheck size={12} /> Aggregates only, n ≥ 10
            </Pill>
            <Pill>Week {snap.week} of 16</Pill>
          </div>
        }
      >
        The Experience Gap is the share who expected something minus the share who report experiencing it. The bigger the gap, the bigger the risk of losing great people.
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Contributors", value: snap.n, suffix: "", note: `of ${PROGRAM_STATS.enrolled} enrolled` },
          { label: "Participation", value: PROGRAM_STATS.participation, suffix: "%", note: "opted in" },
          { label: "Engagement", value: PROGRAM_STATS.engagement, suffix: "%", note: "weekly active" },
          { label: "Support requests", value: PROGRAM_STATS.supportRequests, suffix: "", note: "voluntary" },
          { label: "Mentorship positive", value: PROGRAM_STATS.mentorshipPositive, suffix: "%", note: "opt-in reflections" },
          { label: "Career clarity positive", value: PROGRAM_STATS.careerClarityPositive, suffix: "%", note: "opt-in reflections" },
        ].map((s, i) => (
          <Card key={s.label} delay={i * 0.05} className="p-4 sm:p-4">
            <p className="text-[11px] font-semibold text-rbc-mist/60">{s.label}</p>
            <p className="num mt-1 text-3xl font-bold text-white">
              <CountUp value={s.value} suffix={s.suffix} />
            </p>
            <p className="text-[11px] text-rbc-mist/40">{s.note}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-white">Filters</h2>
            <Filters filter={filter} setFilter={setFilter} interns={interns} />
          </Card>
          <Card delay={0.1}>
            <Toggle
              checked={guardrail}
              onChange={setGuardrail}
              label="Show privacy guardrail"
              description="See every slice and which ones are hidden to protect small groups."
            />
            <ul className="mt-4 space-y-1.5 text-xs text-rbc-mist/60">
              <li>Minimum group size 10 unique contributors.</li>
              <li>Filter combos that could isolate a small group are locked.</li>
              <li>Raw reflections are never shown to leaders.</li>
            </ul>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card className="overflow-visible">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Radar size={18} className="text-rbc-yellow" />
                  <h2 className="font-display text-xl font-bold text-white">Gap Landscape</h2>
                  <InfoTip
                    wide
                    content={
                      <>
                        <p className="font-semibold text-white">How scores work</p>
                        <p className="mt-1">Expected: rated 4 or 5 out of 5 in the onboarding Expectation Nav.</p>
                        <p className="mt-1">
                          Experienced: score = {BLEND.self * 100}% self-reported (reflections, Wrapped check-ins) + {BLEND.tap * 100}% tap verified (at least one verified experience in the window). Counts as experienced at {BLEND.threshold} or above.
                        </p>
                      </>
                    }
                  />
                </div>
                <motion.p key={scope} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 text-xs text-rbc-mist/60">
                  {scope} · n = {snap.n} · Confidence {snap.confidence}
                </motion.p>
              </div>
              <DumbbellLegend />
            </div>
            <AnimatePresence mode="wait">
              {snap.hidden ? (
                <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <PrivacyLock message={snap.reason} />
                  <p className="mt-3 text-center text-xs text-rbc-mist/60">Widen the filters to see this view.</p>
                </motion.div>
              ) : (
                <motion.div key="chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <DumbbellChart rows={snap.rows} n={snap.n} projected={projected} flash={flash} />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          <AnimatePresence>
            {guardrail && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Card>
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-rbc-yellow" />
                    <h2 className="font-display text-lg font-bold text-white">Privacy guardrail: every slice</h2>
                  </div>
                  <SliceMatrix interns={interns} weekEnd={filter.weekEnd} />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card delay={0.1}>
              <div className="mb-4 flex items-center gap-2">
                <Activity size={18} className="text-danger" />
                <h2 className="font-display text-lg font-bold text-white">Early warning</h2>
                <InfoTip content="Gap Velocity: change in each cohort's gap over the last 2 weeks. An alert fires at 8 pts or more. Cohort level only, never individuals." />
              </div>
              <AlertCards alerts={alerts} onSimulate={onSimulateAlert} />
            </Card>
            <Card delay={0.15}>
              <RetentionPanel interns={interns} />
            </Card>
          </div>

          <Card delay={0.2}>
            <div className="mb-4 flex items-center gap-2">
              <Users size={18} className="text-rbc-sky" />
              <h2 className="font-display text-lg font-bold text-white">Gap Velocity</h2>
              <span className="text-xs text-rbc-mist/50">
                weeks {filter.weekStart} to {filter.weekEnd}, this view
              </span>
            </div>
            {snap.hidden ? <PrivacyLock compact /> : <VelocityGrid rows={snap.rows} />}
          </Card>

          <section id="simulator" className="scroll-mt-24">
            <Card delay={0.25}>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-rbc-yellow" />
                    <h2 className="font-display text-xl font-bold text-white">Gap Closer simulator</h2>
                  </div>
                  <p className="mt-1 text-xs text-rbc-mist/60">Illustrative projection, to be validated in a pilot. Ghost dots appear on the Gap Landscape.</p>
                </div>
                <Toggle checked={simOn} onChange={setSimOn} label="Show projection on chart" />
              </div>
              <GapCloser
                rows={snap.rows}
                selected={selected}
                setSelected={(id) => {
                  setSelected(id);
                  setSimOn(true);
                }}
                intensity={intensity}
                setIntensity={(v) => {
                  setIntensity(v);
                  setSimOn(true);
                }}
                projected={projected ?? (snap.hidden ? {} : simulateIntervention(snap.rows, iv, intensity))}
                disabled={snap.hidden}
              />
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
