"use client";

import { motion } from "framer-motion";
import { scaleLinear } from "d3-scale";
import { Clock, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { Card, InfoTip, PageHeader } from "@/components/ui/primitives";
import { CountUp } from "@/components/ui/CountUp";
import { PROGRAM_WEEKS } from "@/lib/constants";
import { cn } from "@/lib/hooks";

/** Daily check-in: 30 second reflection + 20 seconds for mood and goal. */
const CHECKIN_SECONDS = 50;
const DAYS_PER_WEEK = 5;
const CHECKIN_MIN_PER_WEEK = (CHECKIN_SECONDS * DAYS_PER_WEEK) / 60;

function Slider({ label, value, min, max, step = 1, onChange, suffix, tip }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; suffix: string; tip?: string }) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-sm font-semibold text-white">
          {label} {tip && <InfoTip content={tip} />}
        </label>
        <span className="num text-2xl font-bold text-rbc-yellow">
          {value}
          <span className="ml-1 text-sm text-rbc-mist/60">{suffix}</span>
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range mt-3 w-full"
        style={{ ["--fill" as string]: `${fill}%` }}
      />
      <div className="mt-1 flex justify-between text-[11px] text-rbc-mist/40">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export default function RoiPage() {
  const [interns, setInterns] = useState(250);
  const [saved, setSaved] = useState(15);

  const costHrs = (interns * CHECKIN_MIN_PER_WEEK) / 60;
  const recoveredHrs = (interns * saved) / 60;
  const net = recoveredHrs - costHrs;
  const breakEven = CHECKIN_MIN_PER_WEEK;
  const max = Math.max(costHrs, recoveredHrs, 1);

  const W = 560;
  const H = 200;
  const x = scaleLinear().domain([0, 30]).range([40, W - 10]);
  const netAt = (m: number) => (interns * (m - CHECKIN_MIN_PER_WEEK)) / 60;
  const yMax = Math.max(Math.abs(netAt(30)), Math.abs(netAt(0)));
  const y = scaleLinear().domain([-yMax, yMax]).range([H - 20, 20]);
  const linePath = `M${x(0)},${y(netAt(0))} L${x(30)},${y(netAt(30))}`;

  return (
    <div>
      <PageHeader eyebrow="Easy to green-light" title="Does 50 seconds a day pay for itself?">
        Each intern spends about 50 seconds a day on Nav (we round to about one minute in the pitch). If it saves interns or their managers time elsewhere, the program pays for itself fast.
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Card>
          <div className="space-y-8">
            <Slider label="Interns" value={interns} min={50} max={1000} step={10} onChange={setInterns} suffix="interns" />
            <Slider
              label="Minutes saved per intern each week"
              value={saved}
              min={0}
              max={30}
              onChange={setSaved}
              suffix="min"
              tip="Time no longer spent on ad hoc check-in emails, chasing mentors, duplicate surveys and onboarding confusion. An assumption to validate in the pilot."
            />
          </div>
          <div className="mt-8 rounded-2xl bg-white/[0.04] p-4 text-sm text-rbc-mist/75">
            <p className="font-semibold text-white">The math</p>
            <p className="mt-1">
              Check-in cost = {CHECKIN_SECONDS} sec × {DAYS_PER_WEEK} days = {CHECKIN_MIN_PER_WEEK.toFixed(1)} min per intern each week.
            </p>
            <p className="mt-1">Break-even when minutes saved per week reach {breakEven.toFixed(1)}. About 5 if you round the check-in to one minute.</p>
          </div>
        </Card>

        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Check-in time", value: costHrs, icon: Clock, color: "text-rbc-sky", note: "hours per week" },
              { label: "Hours recovered", value: recoveredHrs, icon: Users, color: "text-rbc-yellow", note: "hours per week" },
              { label: "Net", value: net, icon: TrendingUp, color: net >= 0 ? "text-success" : "text-danger", note: `${Math.round(net * PROGRAM_WEEKS).toLocaleString("en-CA")} hours over ${PROGRAM_WEEKS} weeks` },
            ].map((s, i) => (
              <Card key={s.label} delay={i * 0.05} className="p-4 sm:p-5">
                <s.icon size={18} className={s.color} />
                <p className="mt-2 text-xs text-rbc-mist/60">{s.label}</p>
                <p className={cn("num mt-1 text-3xl font-bold", s.color)}>
                  <CountUp value={s.value} decimals={0} duration={0.6} prefix={s.label === "Net" && s.value > 0 ? "+" : ""} />
                </p>
                <p className="text-[11px] text-rbc-mist/50">{s.note}</p>
              </Card>
            ))}
          </div>

          <Card delay={0.1}>
            <p className="mb-4 text-sm font-semibold text-white">Weekly hours</p>
            {[
              { l: "Check-in time", v: costHrs, c: "bg-rbc-sky" },
              { l: "Hours recovered", v: recoveredHrs, c: "bg-rbc-yellow" },
            ].map((b) => (
              <div key={b.l} className="mb-3">
                <div className="flex justify-between text-xs text-rbc-mist/70">
                  <span>{b.l}</span>
                  <span className="num">{b.v.toFixed(0)} h</span>
                </div>
                <div className="mt-1.5 h-3 rounded-full bg-white/[0.06]">
                  <motion.div className={cn("h-full rounded-full", b.c)} animate={{ width: `${(b.v / max) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                </div>
              </div>
            ))}
          </Card>

          <Card delay={0.15}>
            <p className="mb-2 text-sm font-semibold text-white">Net hours per week vs minutes saved</p>
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Break-even at ${breakEven.toFixed(1)} minutes saved per week`}>
              <line x1={40} x2={W - 10} y1={y(0)} y2={y(0)} stroke="#E8EEF7" strokeOpacity={0.2} />
              {[0, 5, 10, 15, 20, 25, 30].map((m) => (
                <text key={m} x={x(m)} y={H - 4} textAnchor="middle" fontSize={10} fill="#E8EEF7" fillOpacity={0.4}>
                  {m}
                </text>
              ))}
              <rect x={x(0)} y={20} width={x(breakEven) - x(0)} height={H - 40} fill="#FF5C6C" fillOpacity={0.06} />
              <motion.path d={linePath} stroke="#FFDF01" strokeWidth={3} fill="none" initial={false} animate={{ d: linePath }} />
              <line x1={x(breakEven)} x2={x(breakEven)} y1={16} y2={H - 20} stroke="#2ECC8F" strokeDasharray="4 4" />
              <text x={x(breakEven) + 6} y={28} fontSize={11} fill="#2ECC8F" fontWeight={700}>
                Break-even {breakEven.toFixed(1)} min
              </text>
              <motion.circle r={7} fill="#FFDF01" stroke="#06142E" strokeWidth={3} initial={false} animate={{ cx: x(saved), cy: y(netAt(saved)) }} transition={{ type: "spring", stiffness: 160, damping: 20 }} />
            </svg>
          </Card>
        </div>
      </div>
      <p className="mt-6 text-xs text-rbc-mist/50">Illustrative assumptions, not measured results.</p>
    </div>
  );
}
