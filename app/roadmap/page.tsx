"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertOctagon, Check, Clock4, FlaskConical, ShieldAlert, ShieldCheck, Target, X } from "lucide-react";
import { useState } from "react";
import { Card, PageHeader } from "@/components/ui/primitives";

const BUILT = [
  "Experience Gap engine with privacy suppression and differencing checks",
  "Leader dashboard: Gap Landscape, Gap Velocity alerts, Retention Pressure",
  "Gap Closer simulator with cost, effort and owner",
  "NFC tag landing page, tap API, live demo console and QR fallback",
  "Intern app: check-in, reflection with on-device themes, Wrapped, Profile settings",
  "Opt-in support flow and restricted advisor queue",
];

const APPROVAL = [
  "RBC SSO sign-in and server-side RBAC",
  "Microsoft Teams and Outlook nudges",
  "Recognition program integration",
  "Security review, encryption, audit logs, retention limits",
  "Privacy, legal and compliance review",
  "RBC approved AI infrastructure for theme detection",
];

const PILOT = [
  { k: "Who", v: "1 cohort, about 60 interns, 2 business areas, opt-in" },
  { k: "When", v: "8 weeks of a summer term" },
  { k: "Cost", v: "NFC tags under $1 each. Existing Azure tenancy." },
  { k: "Team", v: "2 engineers, 1 designer, Early Talent program lead" },
];

const METRICS = [
  { v: "70%+", l: "weekly participation" },
  { v: "-10 pts", l: "on the top 2 gaps by week 8" },
  { v: "< 2 wk", l: "from flagged gap to launched action" },
  { v: "Up", l: "return offer acceptance vs last term" },
];

const MISUSE = [
  {
    risk: "A manager tries to identify who said what",
    fix: "Leaders only see groups of 10 or more. Filter combos that could isolate a small group are locked. Raw reflections never leave the intern's device.",
  },
  {
    risk: "Gap or mood data used in performance reviews or return offers",
    fix: "No individual scores exist to use. Policy and RBAC block any individual export. Stated in the intern consent and the leader terms of use.",
  },
  {
    risk: "NFC taps used to track attendance or location",
    fix: "The tag stores only a link. Taps log the type of experience, never location or time of day. It does not replace the access badge.",
  },
  {
    risk: "Silence treated as a red flag",
    fix: "Missing reflections are never a risk signal. Retention Pressure uses only opt-in reflections and cohort gap trends.",
  },
  {
    risk: "Interns pressured to share more",
    fix: "Private by default. No points or perks for sharing, feedback or positive ratings. Withdraw or delete any time.",
  },
  {
    risk: "Projections treated as promises",
    fix: "Every simulation is labeled illustrative and must be validated in a pilot before budget decisions.",
  },
];

function Column({ title, icon: Icon, color, items, delay }: { title: string; icon: typeof Check; color: string; items: string[]; delay: number }) {
  return (
    <Card delay={delay}>
      <div className="flex items-center gap-2">
        <Icon size={18} className={color} />
        <h2 className="font-display text-lg font-bold text-white">{title}</h2>
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map((it, i) => (
          <motion.li key={it} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: delay + 0.1 + i * 0.05 }} className="flex items-start gap-2 text-sm text-rbc-mist/80">
            <Icon size={14} className={`mt-0.5 shrink-0 ${color}`} /> {it}
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}

export default function RoadmapPage() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <PageHeader
        eyebrow="Roadmap"
        title="Built today. Pilot next term."
        right={
          <button onClick={() => setOpen(true)} className="btn-primary">
            <ShieldAlert size={16} /> How this could be misused
          </button>
        }
      >
        Everything below runs today on synthetic data with zero external services. Production needs RBC approvals before any real intern data is used.
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-3">
        <Column title="Built now" icon={Check} color="text-success" items={BUILT} delay={0} />
        <Column title="Needs RBC approval" icon={Clock4} color="text-warning" items={APPROVAL} delay={0.08} />
        <Card delay={0.16}>
          <div className="flex items-center gap-2">
            <FlaskConical size={18} className="text-rbc-sky" />
            <h2 className="font-display text-lg font-bold text-white">Pilot plan</h2>
          </div>
          <dl className="mt-4 space-y-3">
            {PILOT.map((p) => (
              <div key={p.k}>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-rbc-mist/50">{p.k}</dt>
                <dd className="text-sm text-white">{p.v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card className="mt-5" delay={0.24}>
        <div className="flex items-center gap-2">
          <Target size={18} className="text-rbc-yellow" />
          <h2 className="font-display text-lg font-bold text-white">Pilot success metrics</h2>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {METRICS.map((m, i) => (
            <motion.div key={m.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="rounded-2xl bg-white/[0.04] p-4">
              <p className="num text-3xl font-bold text-rbc-yellow">{m.v}</p>
              <p className="mt-1 text-xs text-rbc-mist/70">{m.l}</p>
            </motion.div>
          ))}
        </div>
      </Card>

      <p className="mt-6 flex items-start gap-2 text-xs text-rbc-mist/60">
        <AlertOctagon size={14} className="mt-0.5 shrink-0 text-warning" />
        Prototype controls are not production certified. Production needs RBC SSO, server-side RBAC, encryption, audit logs, retention limits, approved AI infrastructure, and privacy, security, legal and compliance review.
      </p>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-rbc-ink/75 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="misuse-title"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong my-8 w-full max-w-2xl rounded-card p-6"
            >
              <div className="flex items-center justify-between">
                <h2 id="misuse-title" className="font-display text-xl font-bold text-white">
                  How this could be misused, and how we prevent it
                </h2>
                <button aria-label="Close" autoFocus onClick={() => setOpen(false)} className="text-rbc-mist/60 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="mt-5 space-y-3">
                {MISUSE.map((m, i) => (
                  <motion.div key={m.risk} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="grid gap-2 rounded-2xl bg-white/[0.04] p-4 sm:grid-cols-2">
                    <p className="flex items-start gap-2 text-sm font-semibold text-white">
                      <ShieldAlert size={15} className="mt-0.5 shrink-0 text-danger" /> {m.risk}
                    </p>
                    <p className="flex items-start gap-2 text-sm text-rbc-mist/75">
                      <ShieldCheck size={15} className="mt-0.5 shrink-0 text-success" /> {m.fix}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
