"use client";

import { motion } from "framer-motion";
import { ArrowRight, Compass, Nfc, PenLine } from "lucide-react";
import Link from "next/link";
import { RadarChart } from "@/components/charts/RadarChart";
import { Card, InfoTip, PageHeader, Pill, Toggle } from "@/components/ui/primitives";
import { useCompass } from "@/lib/store/compass";
import { useMaya, useHydrated, cn } from "@/lib/hooks";
import { BLEND, personalGap } from "@/lib/gap";
import { dimLabel } from "@/lib/constants";
import { CLOSE_GAP, mayaExpectations } from "@/lib/maya";
import { MAYA_ID } from "@/lib/data/seed";

export default function InternGapPage() {
  const maya = useMaya();
  const hydrated = useHydrated();
  const override = useCompass((s) => s.expectations);
  const consent = useCompass((s) => s.consent);
  const setConsent = useCompass((s) => s.setConsent);
  const exp = mayaExpectations(maya, hydrated ? override : null);
  const rows = personalGap({ ...maya, expectations: exp }).map((r) => ({
    ...r,
    expected: exp[r.dimension],
    gap: Math.max(0, exp[r.dimension] - r.experienced),
  }));
  const top = [...rows].sort((a, b) => b.gap - a.gap).slice(0, 3);

  const onContribute = (on: boolean) => {
    const level = on ? 2 : 1;
    setConsent(level, on ? "Turned on: contribute my gap anonymously (Level 2)." : "Turned off: my gap stays private (Level 1).");
    fetch("/api/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ internId: MAYA_ID, level }) }).catch(() => undefined);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Only you can see this"
        title={
          <>
            Your <span className="text-rbc-yellow">Experience Gap</span>
          </>
        }
        right={
          <Link href="/intern/expectations" className="btn-ghost">
            <Compass size={16} /> Redo my Expectation Compass
          </Link>
        }
      >
        Yellow is what you wanted from RBC. Blue is what you are living so far. The pulsing points are your biggest gaps.
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="flex flex-col items-center">
          <RadarChart points={rows.map((r) => ({ dimension: r.dimension, expected: r.expected, experienced: r.experienced }))} />
          <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-rbc-mist/70">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-5 bg-rbc-yellow" /> Expected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-rbc-sky bg-rbc-sky/40" /> Experienced
            </span>
            <InfoTip
              content={`Experience score = ${BLEND.self * 100}% self-reported (reflections, Wrapped check-ins) + ${BLEND.tap * 100}% tap verified. Shown on a 1 to 5 scale next to your expectation.`}
            />
          </div>
          <div className="mt-6 w-full rounded-2xl bg-white/[0.04] p-4">
            <Toggle
              checked={hydrated ? consent >= 2 : true}
              onChange={onContribute}
              label="Contribute this anonymously to program insights"
              description="Sharing Level 2 in Profile settings. Joins groups of 10 or more. Leaders never see you individually."
            />
          </div>
        </Card>

        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-white">Close your gap</h2>
          {top.map((r, i) => {
            const c = CLOSE_GAP[r.dimension];
            return (
              <motion.div key={r.dimension} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="yellow">{dimLabel(r.dimension)}</Pill>
                    <Pill tone={r.tapVerified ? "blue" : "default"}>{r.tapVerified ? "Tap verified" : "Self-reported"}</Pill>
                  </div>
                  <p className="mt-3 font-display text-lg font-bold text-white">{c.title}</p>
                  <p className="mt-1 text-sm text-rbc-mist/75">{c.body}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-1.5 text-xs text-rbc-gold">
                      <Nfc size={14} /> {c.tip}
                    </p>
                    <Link href={c.href} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-rbc-yellow hover:underline">
                      Go <ArrowRight size={13} />
                    </Link>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Card className="mt-6" delay={0.2}>
        <h2 className="mb-4 font-display text-lg font-bold text-white">Every dimension</h2>
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          {rows.map((r, i) => (
            <div key={r.dimension}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-white">{dimLabel(r.dimension)}</span>
                <span className="flex items-center gap-1 text-[11px] text-rbc-mist/60">
                  {r.tapVerified ? <Nfc size={12} className="text-rbc-gold" /> : <PenLine size={12} />}
                  {r.tapVerified ? "Tap verified" : "Self-reported"}
                </span>
              </div>
              <div className="relative mt-2 h-2.5 rounded-full bg-white/[0.07]">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-rbc-blue to-rbc-sky"
                  initial={{ width: 0 }}
                  animate={{ width: `${((r.experienced - 1) / 4) * 100}%` }}
                  transition={{ duration: 1, delay: 0.1 + i * 0.05 }}
                />
                <span
                  className={cn("absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-rbc-yellow shadow-glow")}
                  style={{ left: `calc(${((r.expected - 1) / 4) * 100}% - 2px)` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
