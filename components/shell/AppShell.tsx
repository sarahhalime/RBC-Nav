"use client";

import { motion } from "framer-motion";
import { FlaskConical } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useCompass } from "@/lib/store/compass";
import { useHydrated, cn } from "@/lib/hooks";
import type { Role } from "@/lib/types";
import { Background, CursorGlow } from "../ui/Background";
import { CompassLogo } from "../ui/CompassLogo";
import { GuidedDemo } from "./GuidedDemo";
import { ProfileMenu } from "./ProfileMenu";
import { RoleSwitcher } from "./RoleSwitcher";
import { Toaster } from "./Toaster";
import { LiveSync } from "../LiveSync";

const LINKS: Record<Role, { href: string; label: string }[]> = {
  intern: [
    { href: "/intern", label: "Home" },
    { href: "/intern/reflect", label: "Reflect" },
    { href: "/intern/gap", label: "My Gap" },
    { href: "/intern/wrapped", label: "Wrapped" },
    { href: "/act", label: "We Acted" },
  ],
  advisor: [
    { href: "/advisor", label: "Queue" },
    { href: "/act", label: "We Acted" },
    { href: "/roadmap", label: "Roadmap" },
  ],
  leader: [
    { href: "/insights", label: "Insights" },
    { href: "/act", label: "We Acted" },
    { href: "/nfc", label: "Compass card" },
    { href: "/roi", label: "ROI" },
    { href: "/roadmap", label: "Roadmap" },
  ],
};

/** Routes that run full screen, mobile first, without the top bar. */
const IMMERSIVE = ["/t/", "/intern/wrapped", "/nfc/"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const role = useCompass((s) => s.role);
  const hydrated = useHydrated();
  const immersive = IMMERSIVE.some((p) => pathname.startsWith(p));
  // Live NFC demo screens (/nfc/intern, /nfc/manager, /nfc/display) own their bottom corners.
  const liveDemo = pathname.startsWith("/nfc/");
  const links = LINKS[hydrated ? role : "intern"];

  return (
    <>
      <Background />
      <CursorGlow />
      <LiveSync />
      <a href="#main" className="sr-only z-[100] rounded-full bg-rbc-yellow px-4 py-2 text-rbc-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      {!immersive && (
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-rbc-ink/60 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
            <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="RBC Compass home">
              <CompassLogo size={30} />
              <span className="font-display text-[17px] font-bold tracking-tight text-white">
                RBC <span className="text-rbc-yellow">Compass</span>
              </span>
            </Link>
            <nav aria-label="Main" className="no-scrollbar ml-2 hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">
              {links.map((l) => {
                const active = l.href === "/intern" ? pathname === "/intern" : pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "relative whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors",
                      active ? "text-white" : "text-rbc-mist/60 hover:text-white",
                    )}
                  >
                    {active && (
                      <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-white/[0.08]" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
                    )}
                    <span className="relative">{l.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <RoleSwitcher />
              {hydrated && role === "intern" && <ProfileMenu />}
            </div>
          </div>
          <nav aria-label="Main mobile" className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
            {links.map((l) => {
              const active = l.href === "/intern" ? pathname === "/intern" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn("chip whitespace-nowrap py-1 text-xs", active && "border-rbc-yellow/40 text-rbc-yellow")}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </header>
      )}
      <motion.main
        id="main"
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={cn("relative z-10", !immersive && "mx-auto max-w-7xl px-4 pb-32 pt-6 sm:px-6 sm:pt-10")}
      >
        {children}
      </motion.main>
      <div className="pointer-events-none fixed bottom-5 left-5 z-50 hidden sm:block">
        <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-rbc-mist/70">
          <FlaskConical size={13} className="text-rbc-yellow" /> Synthetic data
        </span>
      </div>
      <Toaster />
      {!liveDemo && <GuidedDemo />}
    </>
  );
}
