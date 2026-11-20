"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Coffee, GraduationCap, Mic, Nfc, QrCode, RotateCcw, Smartphone, Sparkles, Users, UtensilsCrossed } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import { CompassCard } from "@/components/nfc/CompassCard";
import { ConnectDemo } from "@/components/nfc/ConnectDemo";
import { Card, InfoTip, PageHeader, Pill, Toggle } from "@/components/ui/primitives";
import { CountUp } from "@/components/ui/CountUp";
import { Magnetic } from "@/components/ui/Magnetic";
import { useInterns, useHydrated, vibrate, cn } from "@/lib/hooks";
import { useCompass } from "@/lib/store/compass";
import { crowdFor, resetDemoEverywhere, tapStation } from "@/lib/tapClient";
import { applyEvents, computeGap } from "@/lib/gap";
import { getSeed, MAYA_ID, MAYA_TAG } from "@/lib/data/seed";
import { dimLabel, dimShort, STATIONS, STATION_IDS } from "@/lib/constants";
import type { DimensionId, StationType } from "@/lib/types";

const STATION_ICONS: Record<StationType, typeof Coffee> = {
  mentor_coffee: Coffee,
  cross_team_lunch: UtensilsCrossed,
  workshop: GraduationCap,
  senior_ama: Mic,
};

const ALL = { cohorts: [], areas: [], weekStart: 1, weekEnd: 6 };

function programGap(events = useCompass.getState().events) {
  const consent = useCompass.getState().consent;
  return computeGap(applyEvents(getSeed(), events, { [MAYA_ID]: { consentLevel: consent } }), ALL);
}

export default function NfcConsole() {
  const interns = useInterns();
  const hydrated = useHydrated();
  const events = useCompass((s) => s.events);
  const toast = useCompass((s) => s.toast);
  const [station, setStation] = useState<StationType>("cross_team_lunch");
  const [withCrowd, setWithCrowd] = useState(true);
  const [crowdSize, setCrowdSize] = useState(7);
  const [tapKey, setTapKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [origin, setOrigin] = useState(process.env.NEXT_PUBLIC_BASE_URL ?? "");

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_BASE_URL) setOrigin(window.location.origin);
  }, []);

  const snap = useMemo(() => computeGap(interns, ALL), [interns]);
  const maya = interns.find((i) => i.id === MAYA_ID)!;
  const mayaEvents = events.filter((e) => e.internId === MAYA_ID && e.status !== "pending");
  const experiences = mayaEvents.filter((e) => e.kind === "station").length;
  const dims = STATIONS[station].dims;

  const simulate = () => {
    if (busy) return;
    setBusy(true);
    setSuccess(false);
    const primary: DimensionId = dims[0];
    const before = programGap().rows.find((r) => r.dimension === primary)!.gap;
    setTapKey((k) => k + 1);
    vibrate([30, 40, 60]);
    tapStation(MAYA_TAG, station);

    const crowd = withCrowd ? crowdFor(interns, station, crowdSize) : [];
    crowd.forEach((c, i) => setTimeout(() => tapStation(c.tagId, station, true), 140 * (i + 1)));

    setTimeout(() => {
      const after = programGap().rows.find((r) => r.dimension === primary)!.gap;
      const closed = before - after;
      setSuccess(true);
      setBusy(false);
      toast({
        title: closed > 0 ? `Gap closed by ${closed} pts` : "Experience logged",
        body:
          closed > 0
            ? `${dimShort(primary)} gap: ${before} to ${after} pts program wide. Added to Maria's Wrapped.`
            : `Added to Maria's Wrapped. ${withCrowd ? "" : "Add attendees to see the program gap move."}`,
      });
      setTimeout(() => setSuccess(false), 2500);
    }, 140 * (crowd.length + 1) + 200);
  };

  const tUrl = `${origin}/t/${MAYA_TAG}`;

  return (
    <div>
      <PageHeader
        eyebrow="Nav card"
        title={
          <>
            Tap a moment. <span className="text-rbc-yellow">Watch the gap move.</span>
          </>
        }
        right={
          <button className="btn-ghost" onClick={() => resetDemoEverywhere()}>
            <RotateCcw size={15} /> Reset demo
          </button>
        }
      >
        The nametag stores only a link. Each tap is a voluntary action that becomes experience evidence for Wrapped and the Experience Gap.
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6">
          <Card className="overflow-visible">
            <div className="py-4">
              <CompassCard tapKey={tapKey} success={success} />
            </div>
            <p className="mt-2 text-center text-xs text-rbc-mist/50">Move your pointer over the card</p>

            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold text-rbc-mist/60">Experience Station</p>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Station">
                {STATION_IDS.map((s) => {
                  const Icon = STATION_ICONS[s];
                  const on = s === station;
                  return (
                    <button
                      key={s}
                      role="radio"
                      aria-checked={on}
                      onClick={() => setStation(s)}
                      className={cn(
                        "relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                        on ? "border-rbc-yellow/60 bg-rbc-yellow/[0.08]" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                      )}
                    >
                      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", on ? "bg-rbc-yellow text-rbc-ink" : "bg-white/[0.06] text-rbc-mist")}>
                        <Icon size={17} />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-white">{STATIONS[s].label}</span>
                        <span className="block text-[11px] text-rbc-mist/50">{STATIONS[s].dims.map(dimShort).join(" + ")}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white/[0.03] p-3 sm:flex-row sm:items-center sm:justify-between">
              <Toggle
                checked={withCrowd}
                onChange={setWithCrowd}
                label={`Include ${crowdSize} other attendees`}
                description="Synthetic Toronto interns tapping at the same event."
              />
              {withCrowd && (
                <input
                  aria-label="Number of other attendees"
                  type="range"
                  min={1}
                  max={15}
                  value={crowdSize}
                  onChange={(e) => setCrowdSize(Number(e.target.value))}
                  className="range w-full sm:w-36"
                  style={{ ["--fill" as string]: `${((crowdSize - 1) / 14) * 100}%` }}
                />
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Magnetic className="btn-primary px-7 py-3.5 text-base" onClick={simulate} disabled={busy}>
                <Nfc size={20} /> {busy ? "Tapping..." : "Simulate tap"}
              </Magnetic>
              <span className="text-xs text-rbc-mist/50">Writes to /api/tap, then every open screen updates.</span>
            </div>
          </Card>

          <ConnectDemo />
        </div>

        <div className="space-y-6">
          <Card delay={0.05}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={17} className="text-rbc-yellow" />
                <h2 className="font-display text-lg font-bold text-white">Experience Gap, live</h2>
              </div>
              <Pill tone="blue">Program wide · n = {snap.n}</Pill>
            </div>
            <div className="space-y-4">
              {(["cross_team", "network", "mentor_access", "learning", "career_clarity", "senior_access"] as DimensionId[]).map((d) => {
                const r = snap.rows.find((x) => x.dimension === d)!;
                const active = dims.includes(d);
                return (
                  <div key={d} className={cn("rounded-2xl p-2.5 transition-colors", active && "bg-rbc-yellow/[0.06] ring-1 ring-rbc-yellow/25")}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn("font-semibold", active ? "text-white" : "text-rbc-mist/70")}>{dimLabel(d)}</span>
                      <span className="num text-base font-bold text-rbc-yellow">
                        <CountUp value={r.gap} duration={0.9} /> <span className="text-[10px] text-rbc-mist/50">pts</span>
                      </span>
                    </div>
                    <div className="relative mt-2 h-2.5 rounded-full bg-white/[0.07]">
                      <motion.div
                        className="absolute inset-y-0 rounded-full bg-gradient-to-r from-rbc-sky to-rbc-yellow"
                        initial={false}
                        animate={{ left: `${r.experiencedPct}%`, width: `${Math.max(0, r.expectedPct - r.experiencedPct)}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 18 }}
                      />
                      <motion.span
                        className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-rbc-sky bg-rbc-blue"
                        initial={false}
                        animate={{ left: `${r.experiencedPct}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 18 }}
                      />
                      <span
                        className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rbc-yellow shadow-glow"
                        style={{ left: `${r.expectedPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card delay={0.1}>
            <div className="mb-4 flex items-center gap-2">
              <Users size={17} className="text-rbc-sky" />
              <h2 className="font-display text-lg font-bold text-white">Maria&apos;s Wrapped, live</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Connections", value: maya.connections },
                { label: "Experiences", value: hydrated ? experiences : 0 },
                { label: "Cross-team", value: maya.experience.cross_team.taps },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/[0.04] p-3 text-center">
                  <p className="num text-3xl font-bold text-white">
                    <CountUp value={s.value} duration={0.8} />
                  </p>
                  <p className="text-[11px] text-rbc-mist/60">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(["mentor_access", "cross_team", "network", "learning", "senior_access"] as DimensionId[]).map((d) => {
                const tap = maya.experience[d].taps > 0;
                return (
                  <motion.span key={`${d}-${tap}`} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <Pill tone={tap ? "yellow" : "default"}>
                      {dimShort(d)}: {tap ? "Tap verified" : "Self-reported"}
                    </Pill>
                  </motion.span>
                );
              })}
            </div>
          </Card>

          <Card delay={0.15}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-white">Live event feed</h2>
              <span className="flex items-center gap-1.5 text-[11px] text-success">
                <motion.span className="h-2 w-2 rounded-full bg-success" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
                Live
              </span>
            </div>
            <ul className="no-scrollbar max-h-72 space-y-2 overflow-y-auto">
              <AnimatePresence initial={false}>
                {hydrated &&
                  [...events]
                    .reverse()
                    .slice(0, 25)
                    .map((e) => (
                      <motion.li
                        key={e.id}
                        layout
                        initial={{ opacity: 0, x: -16, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: "auto" }}
                        exit={{ opacity: 0 }}
                        className={cn("rounded-xl border px-3 py-2 text-xs", e.synthetic ? "border-white/[0.05] bg-white/[0.02] text-rbc-mist/60" : "border-rbc-yellow/25 bg-rbc-yellow/[0.05] text-white")}
                      >
                        <span className="font-semibold">{e.synthetic ? "Attendee" : e.internName}</span>{" "}
                        {e.kind === "station" ? `tapped at ${STATIONS[e.stationType!].label}` : `connected with ${e.partnerName}`}
                        <span className="ml-1 text-rbc-mist/50">· {e.dimensions.map(dimShort).join(", ")}</span>
                        {!e.aggregated && <span className="ml-1 text-warning">· private, not aggregated</span>}
                      </motion.li>
                    ))}
              </AnimatePresence>
              {hydrated && events.length === 0 && <li className="text-xs text-rbc-mist/50">No taps yet. Press Simulate tap.</li>}
            </ul>
          </Card>

          <Card delay={0.2}>
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white p-2.5">
                {origin ? <QRCodeSVG value={tUrl} size={112} fgColor="#06142E" /> : <div className="h-[112px] w-[112px]" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <QrCode size={16} className="text-rbc-yellow" />
                  <h2 className="text-sm font-semibold text-white">QR fallback</h2>
                  <InfoTip content="If the physical tap fails, scan this. It opens the same /t/ link the NFC tag stores." />
                </div>
                <p className="mt-1 text-xs text-rbc-mist/60">Scan with any phone camera to open Maria&apos;s tag page.</p>
                <p className="mt-2 break-all font-mono text-[11px] text-rbc-sky">{tUrl}</p>
                <a href={`/t/${MAYA_TAG}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rbc-yellow hover:underline">
                  <Smartphone size={13} /> Open phone view
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
