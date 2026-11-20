"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Coffee,
  GraduationCap,
  Handshake,
  Loader2,
  Lock,
  MessageSquareText,
  Mic,
  Nfc,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { DetectPulse, TapRipple } from "@/components/nfc/TapRipple";
import { CompassLogo } from "@/components/ui/CompassLogo";
import { findByTag, MAYA_TAG } from "@/lib/data/seed";
import { STATIONS, STATION_IDS, dimShort } from "@/lib/constants";
import { useCompass } from "@/lib/store/compass";
import { approveConnection, tapStation } from "@/lib/tapClient";
import { vibrate, cn } from "@/lib/hooks";
import type { StationType } from "@/lib/types";

type Phase = "detect" | "sheet" | "signin" | "stations" | "logged" | "connect-own" | "approve" | "waiting" | "connected";

const STATION_ICONS: Record<StationType, typeof Coffee> = {
  mentor_coffee: Coffee,
  cross_team_lunch: UtensilsCrossed,
  workshop: GraduationCap,
  senior_ama: Mic,
};

function Sheet({ children, onBack }: { children: ReactNode; onBack?: () => void }) {
  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="glass-strong rounded-[28px] p-5 shadow-card"
    >
      {onBack && (
        <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-xs text-rbc-mist/60 hover:text-white">
          <ArrowLeft size={14} /> Back
        </button>
      )}
      {children}
    </motion.div>
  );
}

function Action({ icon: Icon, title, body, onClick, tone = "default" }: { icon: typeof Coffee; title: string; body: string; onClick: () => void; tone?: "default" | "yellow" }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left",
        tone === "yellow" ? "border-rbc-yellow/40 bg-rbc-yellow/[0.08]" : "border-white/10 bg-white/[0.04]",
      )}
    >
      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", tone === "yellow" ? "bg-rbc-yellow text-rbc-ink" : "bg-white/[0.07] text-rbc-mist")}>
        <Icon size={20} />
      </span>
      <span className="flex-1">
        <span className="block text-[15px] font-semibold text-white">{title}</span>
        <span className="block text-xs text-rbc-mist/60">{body}</span>
      </span>
      <ChevronRight size={18} className="text-rbc-mist/40" />
    </motion.button>
  );
}

export function TagLanding({ tagId }: { tagId: string }) {
  const owner = findByTag(tagId);
  const isOwn = tagId === MAYA_TAG;
  const router = useRouter();
  const setSignedIn = useCompass((s) => s.setSignedIn);
  const setRole = useCompass((s) => s.setRole);
  const [phase, setPhase] = useState<Phase>("detect");
  const [loggedStation, setLoggedStation] = useState<StationType | null>(null);
  const [ripple, setRipple] = useState(0);
  const [signingIn, setSigningIn] = useState(false);
  const [share, setShare] = useState({ name: true, role: true, team: true });

  useEffect(() => {
    vibrate(35);
    const t = setTimeout(() => setPhase(isOwn ? "sheet" : "approve"), 1500);
    return () => clearTimeout(t);
  }, [isOwn]);

  if (!owner) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <CompassLogo size={56} />
        <h1 className="h-display mt-5 text-2xl">Tag not recognized</h1>
        <p className="mt-2 text-sm text-rbc-mist/70">This link does not match a Nav nametag. Nothing was recorded.</p>
        <Link href="/" className="btn-primary mt-6">
          Go to Nav
        </Link>
      </div>
    );
  }

  const first = owner.name.split(" ")[0];

  const signIn = () => {
    setSigningIn(true);
    setTimeout(() => {
      setSignedIn(true);
      setRole("intern");
      router.push("/intern/wrapped");
    }, 1200);
  };

  const logStation = (s: StationType) => {
    tapStation(MAYA_TAG, s);
    setLoggedStation(s);
    setRipple((r) => r + 1);
    vibrate([30, 40, 70]);
    setPhase("logged");
  };

  const approve = async () => {
    vibrate(30);
    setPhase("waiting");
    const status = await approveConnection(MAYA_TAG, tagId);
    if (status === "connected") setPhase("connected");
  };

  const partnerApproves = async () => {
    const status = await approveConnection(tagId, MAYA_TAG);
    if (status === "connected") {
      vibrate([40, 60, 40]);
      setRipple((r) => r + 1);
      setPhase("connected");
    }
  };

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="RBC Nav">
          <CompassLogo size={28} success={phase === "logged" || phase === "connected"} />
          <span className="font-display text-sm font-bold text-white">
            RBC <span className="text-rbc-yellow">Nav</span>
          </span>
        </Link>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] text-rbc-mist/70">
          <Lock size={11} /> Link only tag
        </span>
      </div>

      <div className="relative mt-8 grid h-56 place-items-center">
        {phase === "detect" && <DetectPulse />}
        <TapRipple trigger={ripple} />
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="relative grid h-24 w-24 place-items-center rounded-[28px] border border-[#C9A961]/50 bg-[linear-gradient(135deg,#151515,#0b0b0d_50%,#1c1912)] shadow-[0_0_50px_-10px_rgba(201,169,97,0.6)]"
        >
          {phase === "logged" || phase === "connected" ? (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid h-12 w-12 place-items-center rounded-full bg-success text-rbc-ink">
              <Check size={26} />
            </motion.span>
          ) : (
            <Nfc size={40} className="text-[#C9A961]" />
          )}
        </motion.div>
        <motion.p key={phase === "detect" ? "d" : "o"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-0 text-center">
          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-rbc-yellow">
            {phase === "detect" ? "Tag detected" : isOwn ? "Your Nav tag" : `${first}'s Nav tag`}
          </span>
          <span className="mt-1 block font-display text-xl font-bold text-white">{owner.name}</span>
        </motion.p>
      </div>

      <div className="mt-8 flex-1">
        <AnimatePresence mode="wait">
          {phase === "sheet" && (
            <Sheet key="sheet">
              <p className="mb-3 text-sm font-semibold text-white">What would you like to do?</p>
              <div className="space-y-2">
                <Action icon={Sparkles} tone="yellow" title="Tap to Unwrap" body="Open your Wrapped. Sign in required." onClick={() => setPhase("signin")} />
                <Action icon={UtensilsCrossed} title="Log an experience" body="At a coffee chat, lunch, workshop or AMA" onClick={() => setPhase("stations")} />
                <Action icon={Handshake} title="Tap to Connect" body="Hold your phone to a friend's tag" onClick={() => setPhase("connect-own")} />
                <Action icon={MessageSquareText} title="Tap to Reflect" body="30 seconds, private by default" onClick={() => router.push("/intern/reflect")} />
              </div>
            </Sheet>
          )}

          {phase === "signin" && (
            <Sheet key="signin" onBack={() => setPhase("sheet")}>
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rbc-blue font-display text-lg font-bold text-rbc-yellow">RBC</div>
                <p className="mt-3 font-display text-lg font-bold text-white">Sign in with RBC</p>
                <p className="mt-1 text-xs text-rbc-mist/60">Demo only. Production uses RBC SSO. The tag itself never holds credentials.</p>
                <div className="mt-4 rounded-2xl bg-white/[0.05] p-3 text-left text-sm">
                  <p className="text-[11px] text-rbc-mist/50">Signing in as</p>
                  <p className="font-semibold text-white">maya.chen@rbc.example</p>
                </div>
                <button onClick={signIn} disabled={signingIn} className="btn-primary mt-4 w-full py-3">
                  {signingIn ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {signingIn ? "Verifying..." : "Continue with RBC SSO"}
                </button>
              </div>
            </Sheet>
          )}

          {phase === "stations" && (
            <Sheet key="stations" onBack={() => setPhase("sheet")}>
              <p className="text-sm font-semibold text-white">Where are you?</p>
              <p className="mb-3 text-xs text-rbc-mist/60">Logs the type of experience only. No location, no time of day.</p>
              <div className="space-y-2">
                {STATION_IDS.map((s) => (
                  <Action key={s} icon={STATION_ICONS[s]} title={STATIONS[s].label} body={STATIONS[s].blurb} onClick={() => logStation(s)} />
                ))}
              </div>
            </Sheet>
          )}

          {phase === "logged" && loggedStation && (
            <Sheet key="logged">
              <p className="font-display text-xl font-bold text-white">Logged: {STATIONS[loggedStation].label}</p>
              <p className="mt-1 text-sm text-rbc-mist/70">
                Counts toward {STATIONS[loggedStation].dims.map(dimShort).join(" and ")}. Marked Tap verified in your Gap and added to your Wrapped.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="btn-primary py-3" onClick={() => router.push(`/intern/reflect?station=${loggedStation}`)}>
                  <MessageSquareText size={16} /> Reflect on it
                </button>
                <button className="btn-ghost py-3" onClick={() => setPhase("sheet")}>
                  Done
                </button>
              </div>
            </Sheet>
          )}

          {phase === "connect-own" && (
            <Sheet key="connect-own" onBack={() => setPhase("sheet")}>
              <p className="font-display text-lg font-bold text-white">Hold your phone to a friend&apos;s tag</p>
              <p className="mt-1 text-sm text-rbc-mist/70">You will both see an approval sheet. Nothing is recorded until both of you say yes.</p>
              <Link href="/t/priya-2c91" className="btn-ghost mt-4 w-full py-3">
                <Nfc size={16} /> Demo: tap Priya&apos;s tag
              </Link>
            </Sheet>
          )}

          {phase === "approve" && (
            <Sheet key="approve">
              <p className="font-display text-xl font-bold text-white">Connect with {first}?</p>
              <p className="mt-1 text-xs text-rbc-mist/60">
                {owner.area} · {owner.team}
              </p>
              <p className="mt-4 text-xs font-semibold text-rbc-mist/70">Share with {first}</p>
              <div className="mt-2 space-y-2">
                {(["name", "role", "team"] as const).map((f) => (
                  <label key={f} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2.5 text-sm">
                    <span className="capitalize text-white">{f}</span>
                    <input
                      type="checkbox"
                      checked={share[f]}
                      disabled={f === "name"}
                      onChange={(e) => setShare({ ...share, [f]: e.target.checked })}
                      className="h-5 w-5 accent-[#FFDF01]"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="btn-primary py-3" onClick={approve}>
                  <Check size={16} /> Approve
                </button>
                <Link href={`/t/${MAYA_TAG}`} className="btn-ghost py-3">
                  Not now
                </Link>
              </div>
            </Sheet>
          )}

          {phase === "waiting" && (
            <Sheet key="waiting">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin text-rbc-yellow" />
                <div>
                  <p className="font-semibold text-white">Waiting for {first} to approve</p>
                  <p className="text-xs text-rbc-mist/60">The request expires in 10 minutes. Nothing is saved yet.</p>
                </div>
              </div>
              <button className="btn-ghost mt-4 w-full py-3" onClick={partnerApproves}>
                Demo: {first} approves on her phone
              </button>
            </Sheet>
          )}

          {phase === "connected" && (
            <Sheet key="connected">
              <p className="font-display text-xl font-bold text-white">You and {first} are connected</p>
              <p className="mt-1 text-sm text-rbc-mist/70">
                {owner.area !== "Technology" ? "Different teams, so this counts toward Cross-team and Network." : "Counts toward Network."} It will show up in your Wrapped.
              </p>
              <button className="btn-primary mt-4 w-full py-3" onClick={() => router.push(`/t/${MAYA_TAG}`)}>
                Back to my tag
              </button>
            </Sheet>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-8 text-center text-[11px] leading-relaxed text-rbc-mist/50">
        This nametag stores only a link. It does not track location or attendance and does not replace your access badge. Synthetic data.
      </p>
    </div>
  );
}
