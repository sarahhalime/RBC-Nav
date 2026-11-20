"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Nfc } from "lucide-react";
import { useRef } from "react";
import { CompassLogo } from "../ui/CompassLogo";
import { TapRipple } from "./TapRipple";

/** Black and gold NFC nametag. Pointer-driven 3D tilt with a moving specular highlight. */
export function CompassCard({
  name = "Maya Chen",
  role = "Technology Intern · Toronto",
  tagId = "maya-7f3a",
  tapKey = 0,
  success = false,
}: {
  name?: string;
  role?: string;
  tagId?: string;
  tapKey?: number;
  success?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 180, damping: 18 });
  const sy = useSpring(py, { stiffness: 180, damping: 18 });
  const rotateY = useTransform(sx, [0, 1], [-16, 16]);
  const rotateX = useTransform(sy, [0, 1], [12, -12]);
  const hx = useTransform(sx, (v) => `${v * 100}%`);
  const hy = useTransform(sy, (v) => `${v * 100}%`);
  const shine = useMotionTemplate`radial-gradient(circle at ${hx} ${hy}, rgba(255,240,200,0.35), rgba(255,255,255,0.06) 28%, transparent 55%)`;

  const onMove = (e: React.PointerEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div className="relative mx-auto w-full max-w-[460px]" style={{ perspective: 1200 }}>
      <TapRipple trigger={tapKey} />
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX: reduce ? 0 : rotateX, rotateY: reduce ? 0 : rotateY, transformStyle: "preserve-3d" }}
        animate={tapKey ? { scale: [1, 0.97, 1.02, 1] } : undefined}
        transition={{ duration: 0.5 }}
        key={tapKey}
        className="relative aspect-[1.586] w-full overflow-hidden rounded-[26px] border border-[#C9A961]/40 bg-[linear-gradient(135deg,#141414_0%,#0b0b0d_45%,#1c1912_100%)] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9),0_0_60px_-20px_rgba(201,169,97,0.45)]"
      >
        <div aria-hidden className="absolute inset-0 opacity-[0.18] [background:repeating-linear-gradient(115deg,transparent_0_14px,rgba(201,169,97,0.25)_14px_15px)]" />
        <motion.div aria-hidden className="absolute inset-0 mix-blend-screen" style={{ background: shine }} />
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-[#C9A961]/25" />
        <div aria-hidden className="absolute -right-6 -top-6 h-36 w-36 rounded-full border border-[#C9A961]/20" />

        <div className="relative flex h-full flex-col justify-between p-6 sm:p-7" style={{ transform: "translateZ(40px)" }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <CompassLogo size={38} success={success} />
              <div>
                <p className="font-display text-sm font-bold tracking-[0.2em] text-[#C9A961]">RBC</p>
                <p className="-mt-0.5 font-display text-lg font-bold text-white">Nav</p>
              </div>
            </div>
            <Nfc size={30} className="text-[#C9A961]" />
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <div aria-hidden className="mb-4 h-9 w-12 rounded-md bg-[linear-gradient(135deg,#e8d39a,#C9A961_45%,#8c7440)] shadow-inner" />
              <p className="font-display text-2xl font-bold tracking-tight text-white sm:text-[28px]">{name}</p>
              <p className="text-xs text-[#E8EEF7]/60 sm:text-sm">{role}</p>
            </div>
            <p className="font-mono text-[10px] tracking-widest text-[#C9A961]/70">/t/{tagId}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
