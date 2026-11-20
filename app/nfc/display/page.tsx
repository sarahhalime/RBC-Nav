"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Expand, Lock, Play, QrCode, RotateCcw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Confetti } from "@/components/live/Confetti";
import { ConnectionBadge, LiveError, LiveLoading, PointsCounter, categoryIcon, fmt } from "@/components/live/LiveBits";
import { LiveWrapped } from "@/components/live/LiveWrapped";
import { Orbits, Particles } from "@/components/wrapped/Backdrops";
import { CompassLogo } from "@/components/ui/CompassLogo";
import { resetDemo } from "@/lib/live/client";
import { recognitionList, type Recognition } from "@/lib/live/model";
import { useLiveDemo } from "@/lib/live/useLiveDemo";

const NOTICE_MS = 11000;

function useOrigin() {
  const [origin, setOrigin] = useState(process.env.NEXT_PUBLIC_BASE_URL ?? "");
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_BASE_URL) setOrigin(window.location.origin);
  }, []);
  return origin;
}

export default function LiveDisplay() {
  const { session, state, status, error } = useLiveDemo();
  const origin = useOrigin();
  const [notice, setNotice] = useState<Recognition | null>(null);
  const [wrappedRun, setWrappedRun] = useState(0);
  const [confetti, setConfetti] = useState(0);
  const [showQr, setShowQr] = useState(false);
  const [armReset, setArmReset] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const seen = useRef<{ rec: string | null; unlock: number; resetAt: number } | null>(null);

  // React to remote events. The first snapshot only records what is already there, so a page
  // refresh never replays an old award or Wrapped.
  useEffect(() => {
    if (!state) return;
    const recId = state.latestRecognition?.id ?? null;
    if (!seen.current) {
      seen.current = { rec: recId, unlock: state.unlockCount, resetAt: state.resetAt };
      return;
    }
    if (state.resetAt !== seen.current.resetAt) {
      setNotice(null);
      setWrappedRun(0);
    }
    if (recId && recId !== seen.current.rec && state.latestRecognition) {
      setNotice(state.latestRecognition);
      setConfetti((c) => c + 1);
    }
    if (state.unlockCount > seen.current.unlock) {
      setNotice(null);
      setWrappedRun((r) => r + 1);
    }
    seen.current = { rec: recId, unlock: state.unlockCount, resetAt: state.resetAt };
  }, [state]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (!armReset) return;
    const t = setTimeout(() => setArmReset(false), 3000);
    return () => clearTimeout(t);
  }, [armReset]);

  const fullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => undefined);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (wrappedRun) return;
      if (e.key === "f" || e.key === "F") fullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, wrappedRun]);

  const onReset = async () => {
    if (!session) return;
    if (!armReset) return setArmReset(true);
    setArmReset(false);
    setResetError(null);
    try {
      await resetDemo(session);
    } catch (e) {
      setResetError((e as Error).message);
    }
  };

  if (error) return <LiveError message={error} />;
  if (!state || !session) return <LiveLoading />;

  const recs = recognitionList(state);
  const q = session === (process.env.NEXT_PUBLIC_DEMO_SESSION || "rbc-judges") ? "" : `?s=${session}`;
  const internUrl = `${origin}/nfc/intern${q}`;
  const managerUrl = `${origin}/nfc/manager${q}`;
  const NoticeIcon = notice ? categoryIcon(notice.category) : null;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-[#06142E] via-[#0A2A5E] to-[#005DAA]">
      <Orbits />
      <Particles count={18} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-[4vw] pt-[3vh]">
        <div className="flex items-center gap-3">
          <CompassLogo size={52} />
          <span className="font-display text-[2.2vw] font-bold tracking-tight text-white">
            RBC <span className="text-rbc-yellow">Nav</span>
          </span>
        </div>
        <ConnectionBadge status={status} className="px-4 py-2 text-sm" />
      </div>

      {/* Main stage */}
      <div className="relative z-10 grid min-h-[78vh] grid-cols-1 items-center gap-[4vw] px-[6vw] lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="eyebrow text-[1.1vw]">Live recognition balance</p>
          <h1 className="h-display mt-3 text-[4.4vw] leading-none">{state.internName}</h1>
          <p className="num text-glow mt-4 text-[11vw] font-extrabold leading-[0.9] tracking-tighter text-rbc-yellow">
            <PointsCounter value={state.recognitionPoints} duration={2.4} />
          </p>
          <p className="font-display text-[2vw] font-semibold text-white/90">recognition points</p>
          <div className="mt-6 flex min-h-[3vw] flex-wrap gap-2">
            {recs.slice(-5).map((r) => {
              const Icon = categoryIcon(r.category);
              return (
                <motion.span key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="chip border-rbc-yellow/30 text-[1vw] text-white">
                  <Icon size={16} className="text-rbc-yellow" /> {r.category}
                </motion.span>
              );
            })}
          </div>
        </div>

        {/* Locked Wrapped card */}
        <div className="relative mx-auto aspect-[3/4] w-full max-w-[30vw] min-w-[260px]">
          <motion.div
            className="glass-strong absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[2.5vw] border-rbc-yellow/30 p-[2vw] text-center"
            animate={{ boxShadow: ["0 0 40px -10px rgba(255,223,1,0.25)", "0 0 90px -10px rgba(255,223,1,0.55)", "0 0 40px -10px rgba(255,223,1,0.25)"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,223,1,0.18),transparent_60%)]" />
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="relative grid h-[7vw] w-[7vw] min-h-16 min-w-16 place-items-center rounded-full bg-rbc-yellow/15 ring-1 ring-rbc-yellow/50">
              {state.wrappedUnlocked ? <Play className="text-rbc-yellow" style={{ width: "3vw", height: "3vw" }} /> : <Lock className="text-rbc-yellow" style={{ width: "3vw", height: "3vw" }} />}
            </motion.div>
            <p className="relative mt-[2vw] text-[0.9vw] font-semibold uppercase tracking-[0.3em] text-rbc-yellow">Final Intern Wrapped</p>
            <p className="h-display relative mt-2 text-[2.4vw] leading-tight">{state.wrappedUnlocked ? "Unwrapped" : "Locked"}</p>
            {state.wrappedUnlocked ? (
              <button onClick={() => setWrappedRun((r) => r + 1)} className="btn-primary relative mt-[2vw] text-[1vw]">
                <Play size={16} /> Replay Wrapped
              </button>
            ) : (
              <p className="relative mt-[2vw] flex items-center gap-2 text-[1.1vw] text-rbc-mist/80">
                <motion.span className="h-2 w-2 rounded-full bg-rbc-yellow" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.4, repeat: Infinity }} />
                Waiting for Nav Card activation...
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Recognition notification */}
      <AnimatePresence>
        {notice && NoticeIcon && (
          <motion.div
            key={notice.id}
            className="fixed inset-0 z-[60] grid place-items-center bg-rbc-ink/70 px-[6vw] backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNotice(null)}
          >
            <motion.div
              className="glass-strong w-full max-w-[70vw] rounded-[2.5vw] border-rbc-yellow/40 p-[3.5vw] text-center shadow-glow"
              initial={{ scale: 0.7, y: 60, rotateX: 25 }}
              animate={{ scale: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 160, damping: 16 }}
            >
              <motion.div initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: "spring" }} className="mx-auto grid h-[6vw] w-[6vw] min-h-14 min-w-14 place-items-center rounded-full bg-rbc-yellow text-rbc-ink">
                <NoticeIcon style={{ width: "3vw", height: "3vw" }} />
              </motion.div>
              <p className="h-display mt-[1.5vw] text-[3.4vw] leading-tight">Congratulations, Maria!</p>
              <p className="mt-2 text-[1.8vw] text-rbc-mist/90">
                You&apos;ve received recognition for <span className="font-bold text-rbc-yellow">{notice.category}</span>.
              </p>
              <motion.p initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: "spring" }} className="num text-glow mt-[1.5vw] text-[7vw] font-extrabold leading-none text-rbc-yellow">
                +{notice.points} points
              </motion.p>
              <p className="num mt-2 text-[2.2vw] font-semibold text-white">
                {fmt(notice.pointsBefore)} <span className="text-rbc-yellow">→</span> <PointsCounter value={notice.pointsAfter} from={notice.pointsBefore} duration={2.4} />
              </p>
              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="mx-auto mt-[2vw] max-w-[55vw] font-display text-[2vw] font-medium italic leading-snug text-white/90">
                &ldquo;{notice.message}&rdquo;
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{wrappedRun > 0 && <LiveWrapped key={wrappedRun} state={state} onClose={() => setWrappedRun(0)} />}</AnimatePresence>

      <Confetti fire={confetti} count={260} />

      {/* QR fallbacks */}
      <AnimatePresence>
        {showQr && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="glass-strong fixed bottom-16 right-5 z-50 flex gap-5 rounded-card p-5">
            {[
              { label: "Leadership Card", sub: "Tap to Recognize", url: managerUrl },
              { label: "Intern Card", sub: "Tap to Unwrap", url: internUrl },
            ].map((c) => (
              <div key={c.label} className="text-center">
                <div className="rounded-2xl bg-white p-2">
                  <QRCodeSVG value={c.url} size={150} />
                </div>
                <p className="mt-2 text-sm font-bold text-white">{c.label}</p>
                <p className="text-xs text-rbc-mist/70">{c.sub}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discreet presenter controls */}
      <div className="fixed bottom-4 right-5 z-50 flex items-center gap-2 opacity-30 transition-opacity hover:opacity-100 focus-within:opacity-100">
        {resetError && <span className="text-xs text-danger">{resetError}</span>}
        <span className="text-[11px] text-rbc-mist/60">session {session}</span>
        <button onClick={() => setShowQr((v) => !v)} className="rounded-full bg-white/10 p-2 text-white" aria-label="Toggle QR fallbacks" title="QR fallbacks">
          <QrCode size={16} />
        </button>
        <button onClick={fullscreen} className="rounded-full bg-white/10 p-2 text-white" aria-label="Toggle fullscreen" title="Fullscreen (F)">
          <Expand size={16} />
        </button>
        <button onClick={onReset} className={armReset ? "rounded-full bg-danger px-3 py-2 text-xs font-bold text-white" : "rounded-full bg-white/10 p-2 text-white"} aria-label="Reset demo" title="Reset demo">
          {armReset ? "Click again to reset" : <RotateCcw size={16} />}
        </button>
      </div>
    </div>
  );
}
