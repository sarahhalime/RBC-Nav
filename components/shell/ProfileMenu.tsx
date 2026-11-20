"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, CreditCard, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CURRENT_WEEK } from "@/lib/constants";
import { cn } from "@/lib/hooks";
import { useCompass } from "@/lib/store/compass";

const ITEMS = [
  { href: "/intern/vault", label: "Profile settings", body: "Privacy, sharing and your data", icon: Settings },
  { href: "/nfc", label: "Nav card", body: "Tap to connect, reflect and unwrap", icon: CreditCard },
];

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const consent = useCompass((s) => s.consent);
  const ref = useRef<HTMLDivElement>(null);
  const onItem = ITEMS.some((i) => pathname.startsWith(i.href));

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Profile menu"
        className={cn(
          "glass flex items-center gap-1.5 rounded-full p-1 pr-2 transition-colors hover:border-white/20",
          (open || onItem) && "border-rbc-yellow/40",
        )}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-rbc-yellow to-rbc-gold font-display text-xs font-bold text-rbc-ink">
          MC
        </span>
        <ChevronDown size={14} className={cn("text-rbc-mist/70 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="glass-strong absolute right-0 top-full z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-[22px] p-2"
          >
            <div className="flex items-center gap-3 px-3 py-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rbc-yellow to-rbc-gold font-display text-sm font-bold text-rbc-ink">
                MC
              </span>
              <div className="min-w-0">
                <p className="font-display font-semibold text-white">Maya Chen</p>
                <p className="truncate text-xs text-rbc-mist/60">
                  Mobile Banking, Toronto. Week {CURRENT_WEEK}
                </p>
              </div>
            </div>
            <div className="mx-3 mb-2 h-px bg-white/[0.06]" />
            {ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06]",
                    active && "bg-white/[0.06]",
                  )}
                >
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06]", active ? "text-rbc-yellow" : "text-rbc-mist")}>
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">{item.label}</span>
                    <span className="block truncate text-xs text-rbc-mist/60">
                      {item.href === "/intern/vault" ? `${item.body}. Level ${consent} of 3` : item.body}
                    </span>
                  </span>
                  <ChevronRight size={15} className="text-rbc-mist/40 transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
