"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Handshake, Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { MAYA_TAG, PRIYA_TAG } from "@/lib/data/seed";
import { approveConnection } from "@/lib/tapClient";
import { useCompass } from "@/lib/store/compass";
import { vibrate, cn } from "@/lib/hooks";
import { Card } from "../ui/primitives";

type Side = "idle" | "approved";

function Phone({
  owner,
  other,
  otherRole,
  state,
  connected,
  onApprove,
}: {
  owner: string;
  other: string;
  otherRole: string;
  state: Side;
  connected: boolean;
  onApprove: () => void;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[220px] rounded-[30px] border border-white/15 bg-rbc-ink p-2 shadow-card">
      <div className="mx-auto mb-2 h-1.5 w-14 rounded-full bg-white/15" />
      <div className="rounded-[22px] bg-gradient-to-b from-rbc-navy to-rbc-ink p-3">
        <p className="text-[10px] text-rbc-mist/50">{owner}&apos;s phone</p>
        <AnimatePresence mode="wait">
          {connected ? (
            <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-6 text-center">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 12 }}
                className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success text-rbc-ink"
              >
                <Check />
              </motion.span>
              <p className="mt-3 text-sm font-semibold text-white">Connected with {other.split(" ")[0]}</p>
              <p className="text-[10px] text-rbc-mist/60">Added to Wrapped</p>
            </motion.div>
          ) : (
            <motion.div key="sheet" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}>
              <p className="mt-2 text-sm font-semibold text-white">Connect with {other.split(" ")[0]}?</p>
              <p className="text-[10px] text-rbc-mist/60">{otherRole}</p>
              <p className="mt-3 text-[10px] font-semibold text-rbc-mist/70">You will share</p>
              <ul className="mt-1 space-y-0.5 text-[11px] text-rbc-mist/80">
                {["Name", "Role", "Team"].map((f) => (
                  <li key={f} className="flex items-center gap-1.5">
                    <Check size={11} className="text-success" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onApprove}
                disabled={state === "approved"}
                className={cn(
                  "mt-3 w-full rounded-full py-2 text-xs font-bold transition-colors",
                  state === "approved" ? "bg-white/10 text-rbc-mist/70" : "bg-rbc-yellow text-rbc-ink",
                )}
              >
                {state === "approved" ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Waiting for {other.split(" ")[0]}
                  </span>
                ) : (
                  "Approve"
                )}
              </button>
              <p className="mt-1.5 text-center text-[9px] text-rbc-mist/40">Nothing is recorded until both approve</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ConnectDemo() {
  const [maya, setMaya] = useState<Side>("idle");
  const [priya, setPriya] = useState<Side>("idle");
  const [connected, setConnected] = useState(false);
  const toast = useCompass((s) => s.toast);

  const approve = async (who: "maya" | "priya") => {
    vibrate(30);
    const [me, them] = who === "maya" ? [MAYA_TAG, PRIYA_TAG] : [PRIYA_TAG, MAYA_TAG];
    (who === "maya" ? setMaya : setPriya)("approved");
    const status = await approveConnection(me, them);
    if (status === "connected") {
      vibrate([40, 60, 40]);
      setConnected(true);
      toast({ title: "Maria and Priya connected", body: "Different teams, so it counts toward Cross-team and Network." });
    }
  };

  const reset = () => {
    setMaya("idle");
    setPriya("idle");
    setConnected(false);
  };

  return (
    <Card delay={0.1}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Handshake size={17} className="text-rbc-gold" />
          <h2 className="font-display text-lg font-bold text-white">Tap to Connect</h2>
        </div>
        {connected && (
          <button onClick={reset} className="btn-ghost px-3 py-1.5 text-xs">
            <RotateCcw size={13} /> Again
          </button>
        )}
      </div>
      <p className="mb-4 text-xs text-rbc-mist/60">Maria and Priya tap tags. Both phones ask first. A connection only exists after both say yes.</p>
      <div className="grid grid-cols-2 gap-3">
        <Phone owner="Maria" other="Priya Nair" otherRole="Capital Markets · Global Markets Analytics" state={maya} connected={connected} onApprove={() => approve("maya")} />
        <Phone owner="Priya" other="Maria Chen" otherRole="Technology · Mobile Banking" state={priya} connected={connected} onApprove={() => approve("priya")} />
      </div>
    </Card>
  );
}
