"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight, EyeOff, Lock, Nfc, PlayCircle, Radar, ShieldCheck, Sparkles, TrendingDown, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { HeroCompass } from "@/components/ui/HeroCompass";
import { CountUp } from "@/components/ui/CountUp";
import { Magnetic } from "@/components/ui/Magnetic";
import { CompassCard } from "@/components/nfc/CompassCard";
import { DEMO_STEPS } from "@/lib/demo";
import { useCompass } from "@/lib/store/compass";
import { useInterns } from "@/lib/hooks";
import { computeGap } from "@/lib/gap";
import { dimLabel, PROGRAM_STATS } from "@/lib/constants";

function Section({ id, eyebrow, title, children, aside }: { id: string; eyebrow: string; title: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <section id={id} className="grid min-h-[80vh] items-center gap-10 py-20 lg:grid-cols-2">
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-120px" }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="h-display mt-3 text-4xl leading-[1.05] sm:text-5xl">{title}</h2>
        <div className="mt-5 space-y-4 text-lg leading-relaxed text-rbc-mist/75">{children}</div>
      </motion.div>
      {aside && (
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true, margin: "-120px" }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
          {aside}
        </motion.div>
      )}
    </section>
  );
}

export default function Landing() {
  const router = useRouter();
  const setDemo = useCompass((s) => s.setDemo);
  const setRole = useCompass((s) => s.setRole);
  const interns = useInterns();
  const rows = computeGap(interns, { cohorts: [], areas: [], weekStart: 1, weekEnd: 6 }).rows.sort((a, b) => b.gap - a.gap).slice(0, 4);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const compassY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const compassOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.2]);

  const startDemo = () => {
    setRole(DEMO_STEPS[0].role);
    setDemo({ active: true, step: 0 });
    router.push(DEMO_STEPS[0].path);
  };

  return (
    <div>
      <section ref={heroRef} className="relative grid min-h-[calc(100dvh-4rem)] items-center gap-8 pb-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="eyebrow">
            Tech@RBC Women&apos;s Advisory Program · Hackathon prototype
          </motion.p>
          <h1 className="h-display mt-4 text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">
            {["Retaining talent", "starts with", "listening to it."].map((line, i) => (
              <motion.span
                key={line}
                className="block"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.14, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {i === 2 ? <span className="text-rbc-yellow text-glow">{line}</span> : line}
              </motion.span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-6 max-w-xl text-lg leading-relaxed text-rbc-mist/75">
            RBC Nav is a privacy-first career companion for interns. It compares what they expected from RBC with what they actually experience, so leaders can act before great people leave.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="mt-8 flex flex-wrap gap-3">
            <Magnetic className="btn-primary px-7 py-3.5 text-base" onClick={startDemo}>
              <PlayCircle size={20} /> Start the demo
            </Magnetic>
            <Magnetic className="btn-ghost px-6 py-3.5 text-base" href="/nfc">
              <Nfc size={18} /> Nav card
            </Magnetic>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="mt-10 flex flex-wrap gap-8">
            {[
              { v: PROGRAM_STATS.participation, s: "%", l: "participation" },
              { v: 35, s: " pts", l: "biggest gap found" },
              { v: 50, s: " sec", l: "daily check-in" },
            ].map((s) => (
              <div key={s.l}>
                <p className="num text-3xl font-bold text-white">
                  <CountUp value={s.v} suffix={s.s} />
                </p>
                <p className="text-xs text-rbc-mist/50">{s.l}</p>
              </div>
            ))}
          </motion.div>
        </div>
        <motion.div style={{ y: compassY, opacity: compassOpacity }} initial={{ opacity: 0, scale: 0.85, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="flex justify-center">
          <HeroCompass />
        </motion.div>
        <motion.a href="#problem" aria-label="Scroll to story" className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 text-rbc-mist/50 lg:block" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ArrowDown />
        </motion.a>
      </section>

      <Section
        id="problem"
        eyebrow="The problem"
        title={
          <>
            Interns decide early. <span className="text-rbc-mist/50">Programs find out late.</span>
          </>
        }
        aside={
          <div className="glass rounded-card p-6">
            {[
              { icon: Users, t: "Exit surveys come after the decision", b: "By the time feedback arrives, the return offer is already declined." },
              { icon: EyeOff, t: "Interns rarely say it out loud", b: "Mentor gaps and isolation stay invisible to leaders." },
              { icon: TrendingDown, t: "Programs change once a year", b: "Fixes land for the next cohort, not this one." },
            ].map((x, i) => (
              <motion.div key={x.t} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.12 }} className="flex gap-4 border-b border-white/[0.06] py-4 last:border-0">
                <x.icon className="shrink-0 text-rbc-yellow" />
                <div>
                  <p className="font-semibold text-white">{x.t}</p>
                  <p className="text-sm text-rbc-mist/60">{x.b}</p>
                </div>
              </motion.div>
            ))}
          </div>
        }
      >
        <p>Early talent forms its view of RBC in the first weeks. The signals are there: a mentor who keeps rescheduling, a team you never get to meet, no idea what comes next.</p>
        <p>Nav captures that voice every day, in 50 seconds, and turns it into action while the intern is still here.</p>
      </Section>

      <Section
        id="gap"
        eyebrow="Hero feature · Experience Gap"
        title={
          <>
            Expected <span className="text-rbc-yellow">minus</span> experienced.
          </>
        }
        aside={
          <div className="glass rounded-card p-6">
            <p className="mb-4 text-xs text-rbc-mist/60">Week 6 · 250 interns · synthetic</p>
            {rows.map((r, i) => (
              <div key={r.dimension} className="mb-4 last:mb-0">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-white">{dimLabel(r.dimension)}</span>
                  <span className="num font-bold text-rbc-yellow">
                    <CountUp value={r.gap} /> pts
                  </span>
                </div>
                <div className="relative mt-2 h-2.5 rounded-full bg-white/[0.07]">
                  <motion.div
                    className="absolute inset-y-0 rounded-full bg-gradient-to-r from-rbc-sky to-rbc-yellow"
                    initial={{ left: "0%", width: "0%" }}
                    whileInView={{ left: `${r.experiencedPct}%`, width: `${r.gap}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
            <Link href="/insights" onClick={() => setRole("leader")} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-rbc-yellow hover:underline">
              Open the Gap Landscape <ArrowRight size={15} />
            </Link>
          </div>
        }
      >
        <p>At onboarding, each intern spends 60 seconds rating what they want from RBC. Daily reflections and nametag taps show what they actually get.</p>
        <p>The difference is the Experience Gap. It tells leaders exactly where to act, by cohort and business area, with early warnings when a gap widens.</p>
      </Section>

      <Section
        id="nfc"
        eyebrow="Hero feature · NFC Nav Nametag"
        title={
          <>
            Real moments, <span className="text-rbc-gold">tap verified.</span>
          </>
        }
        aside={<CompassCard />}
      >
        <p>The RBC nametag carries an NFC tag that stores only a link. Interns tap it at mentor coffee chats, cross-team lunches, workshops and leader AMAs.</p>
        <p>Each tap is voluntary experience evidence. It fills their Wrapped and closes the gap on the leader dashboard in seconds. No location, no tracking, not an access badge.</p>
      </Section>

      <Section
        id="privacy"
        eyebrow="Privacy by design"
        title="Private by default. Useful in aggregate."
        aside={
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Lock, t: "Profile settings", b: "Three levels. Interns choose. Withdraw or delete anytime." },
              { icon: Users, t: "Groups of 10+", b: "Smaller slices are hidden. Filter combos that could isolate people are locked." },
              { icon: ShieldCheck, t: "No individual risk scores", b: "Never for hiring, promotion, return offers or reviews." },
              { icon: EyeOff, t: "No surveillance", b: "No keystrokes, email, Teams or browsing. Missing reflections are never a signal." },
            ].map((x, i) => (
              <motion.div key={x.t} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass rounded-card p-5">
                <x.icon className="text-success" />
                <p className="mt-3 font-semibold text-white">{x.t}</p>
                <p className="mt-1 text-sm text-rbc-mist/60">{x.b}</p>
              </motion.div>
            ))}
          </div>
        }
      >
        <p>Interns own their data. Leaders only ever see anonymous groups. Support is opt-in, and the intern picks every field an advisor sees.</p>
      </Section>

      <Section
        id="impact"
        eyebrow="Impact"
        title={
          <>
            You Spoke. <span className="text-rbc-yellow">We Acted.</span>
          </>
        }
        aside={
          <div className="glass rounded-card p-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { v: 13, s: " pts", l: "onboarding gap closed (synthetic)" },
                { v: 1.5, s: " wk", l: "voice to action", d: 1 },
                { v: 5, s: "", l: "interventions ready to green-light" },
                { v: 4.2, s: " min", l: "weekly time saved to break even", d: 1 },
              ].map((x) => (
                <div key={x.l}>
                  <p className="num text-4xl font-bold text-white">
                    <CountUp value={x.v} decimals={x.d ?? 0} suffix={x.s} />
                  </p>
                  <p className="text-xs text-rbc-mist/60">{x.l}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/act" className="btn-ghost">
                <Sparkles size={15} /> See the loop
              </Link>
              <Link href="/roi" className="btn-ghost">
                <Radar size={15} /> ROI calculator
              </Link>
              <Link href="/roadmap" className="btn-ghost">
                Roadmap
              </Link>
            </div>
          </div>
        }
      >
        <p>Leaders simulate an intervention, see cost, effort and owner, and green-light it. Interns see the action and the gap move. That loop is what keeps talent.</p>
        <div className="pt-2">
          <Magnetic className="btn-primary px-7 py-3.5 text-base" onClick={startDemo}>
            <PlayCircle size={20} /> Start the demo
          </Magnetic>
        </div>
      </Section>
    </div>
  );
}
