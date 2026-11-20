"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Award, CheckCircle2, Loader2, Wand2 } from "lucide-react";
import { useRef, useState } from "react";
import { Confetti } from "@/components/live/Confetti";
import { CATEGORY_ICON, ConnectionBadge, LiveError, LiveLoading, PointsCounter, fmt } from "@/components/live/LiveBits";
import { CompassLogo } from "@/components/ui/CompassLogo";
import { awardRecognition } from "@/lib/live/client";
import { AWARD_POINTS, CATEGORIES, MAX_MESSAGE, SUGGESTED_MESSAGES, newSubmissionId, validateAward, type Category, type Recognition } from "@/lib/live/model";
import { useLiveDemo } from "@/lib/live/useLiveDemo";
import { cn, vibrate } from "@/lib/hooks";

export default function ManagerCard() {
  const { session, state, status, error } = useLiveDemo();
  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<Recognition | null>(null);
  const [burst, setBurst] = useState(0);
  /** One id per recognition. Reused on retry so a flaky network can never award twice. */
  const submissionId = useRef<string | null>(null);

  if (error) return <LiveError message={error} />;
  if (!state || !session) return <LiveLoading />;

  const submit = async () => {
    if (busy) return;
    submissionId.current ??= newSubmissionId();
    const v = validateAward({ id: submissionId.current, category: category ?? "", message });
    if (!v.ok) return setFormError(v.error);
    setBusy(true);
    setFormError(null);
    try {
      const res = await awardRecognition(session, v.value);
      if (res.kind === "limit") throw new Error("Demo award limit reached. Reset the demo on the display.");
      submissionId.current = null;
      setDone(res.recognition);
      setBurst((b) => b + 1);
      vibrate([40, 60, 120]);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const again = () => {
    setDone(null);
    setCategory(null);
    setMessage("");
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-b from-[#005DAA] via-[#0A2A5E] to-[#06142E] px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="relative z-10 mx-auto max-w-md">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CompassLogo size={30} />
            <span className="font-display text-[17px] font-bold text-white">
              RBC <span className="text-rbc-yellow">Nav</span>
            </span>
          </div>
          <ConnectionBadge status={status} />
        </header>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mt-14 text-center">
              <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200 }} className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-rbc-yellow text-rbc-ink shadow-glow">
                <CheckCircle2 size={48} />
              </motion.div>
              <h1 className="h-display mt-6 text-4xl">Recognition sent!</h1>
              <p className="mt-2 text-rbc-mist/80">
                Maria was recognized for <span className="font-semibold text-rbc-yellow">{done.category}</span>.
              </p>
              <p className="num text-glow mt-6 text-6xl font-extrabold text-rbc-yellow">+{done.points}</p>
              <p className="num mt-2 text-xl text-white">
                {fmt(done.pointsBefore)} → {fmt(done.pointsAfter)} points
              </p>
              <p className="mt-6 text-sm text-rbc-mist/70">Look at the big screen.</p>
              <button onClick={again} className="btn-ghost mt-8">
                Recognize again
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <div className="mt-8">
                <p className="eyebrow">Leadership Nav Card</p>
                <h1 className="h-display mt-2 text-3xl leading-tight">Recognize an intern</h1>
              </div>

              <div className="glass mt-5 flex items-center gap-4 rounded-card p-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rbc-yellow to-rbc-gold font-display text-xl font-bold text-rbc-ink">MP</div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{state.internName}</p>
                  <p className="text-xs text-rbc-mist/70">Technology intern · Payments</p>
                </div>
                <div className="text-right">
                  <p className="num text-xl font-bold text-rbc-yellow">
                    <PointsCounter value={state.recognitionPoints} />
                  </p>
                  <p className="text-[11px] text-rbc-mist/60">points</p>
                </div>
              </div>

              <fieldset className="mt-6">
                <legend className="text-sm font-semibold text-white">Recognition category</legend>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {CATEGORIES.map((c, i) => {
                    const Icon = CATEGORY_ICON[c];
                    const active = category === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setCategory(c);
                          setFormError(null);
                          vibrate(15);
                        }}
                        className={cn(
                          "flex items-center gap-2 rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition-colors",
                          i === CATEGORIES.length - 1 && "col-span-2",
                          active ? "border-rbc-yellow bg-rbc-yellow/15 text-white shadow-glow" : "border-white/10 bg-white/[0.04] text-rbc-mist/90",
                        )}
                      >
                        <Icon size={18} className={active ? "text-rbc-yellow" : "text-rbc-sky"} />
                        {c}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label htmlFor="msg" className="text-sm font-semibold text-white">
                    Personal message
                  </label>
                  {category && (
                    <button type="button" onClick={() => setMessage(SUGGESTED_MESSAGES[category])} className="flex items-center gap-1 text-xs font-semibold text-rbc-sky">
                      <Wand2 size={13} /> Suggest
                    </button>
                  )}
                </div>
                <textarea
                  id="msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={MAX_MESSAGE}
                  rows={4}
                  placeholder="What did Maria do that made a difference?"
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-base text-white placeholder:text-rbc-mist/40 focus:border-rbc-yellow/60 focus:outline-none"
                />
                <p className="text-right text-[11px] text-rbc-mist/50">
                  {message.length}/{MAX_MESSAGE}
                </p>
              </div>

              <motion.button whileTap={{ scale: 0.96 }} onClick={submit} disabled={busy || status === "error"} className="btn-primary mt-4 w-full py-4 text-lg">
                {busy ? <Loader2 className="animate-spin" size={20} /> : <Award size={20} />}
                Award {AWARD_POINTS} Recognition Points
              </motion.button>
              {formError && (
                <p role="alert" className="mt-3 text-center text-sm text-danger">
                  {formError}
                </p>
              )}
              {status === "offline" && <p className="mt-3 text-center text-xs text-warning">Reconnecting. Your award will send when the connection returns.</p>}
              <p className="mt-6 text-center text-[11px] text-rbc-mist/50">Proposed integration with RBC recognition programs. All points and awards are simulated.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Confetti fire={burst} origin="center" count={260} />
    </div>
  );
}
