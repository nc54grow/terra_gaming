"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

type Phase = "idle" | "cover" | "reveal";

const TransitionContext = createContext<(href: string) => void>(() => {});

export function useTransitionNavigate() {
  return useContext(TransitionContext);
}

const DURATION = 650;

export default function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const pendingRef = useRef<string | null>(null);

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname || pendingRef.current) return;
      pendingRef.current = href;
      setPhase("cover");
    },
    [pathname],
  );

  // Once the overlay has covered the screen, perform the actual navigation.
  useEffect(() => {
    if (phase !== "cover") return;
    const t = setTimeout(() => {
      if (pendingRef.current) router.push(pendingRef.current);
    }, DURATION);
    return () => clearTimeout(t);
  }, [phase, router]);

  // When the destination route has mounted, sweep the overlay away.
  useEffect(() => {
    if (pendingRef.current && pathname === pendingRef.current) {
      pendingRef.current = null;
      setPhase("reveal");
      const t = setTimeout(() => setPhase("idle"), DURATION);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  const transform =
    phase === "cover"
      ? "translate-y-0"
      : phase === "reveal"
        ? "translate-y-full"
        : "-translate-y-full";

  const motion =
    phase === "idle"
      ? "transition-none"
      : "transition-transform duration-[650ms]";

  return (
    <TransitionContext.Provider value={navigate}>
      {children}

      <div
        aria-hidden={phase === "idle"}
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#1C1A17] ease-[cubic-bezier(0.76,0,0.24,1)] ${transform} ${motion} ${
          phase === "idle" ? "pointer-events-none" : "pointer-events-auto"
        }`}
      >
        {/* Grid texture to match the brand */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(240,235,225,0.04) 3px, rgba(240,235,225,0.04) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(240,235,225,0.04) 3px, rgba(240,235,225,0.04) 4px)`,
          }}
        />

        {/* Orange accent sweep along the leading edge */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-[#C84B1F]" />
        <div className="absolute inset-x-0 top-0 h-1 bg-[#C84B1F]" />

        <div className="relative z-10 flex flex-col items-center gap-5">
          <div className="flex items-center gap-2.5 text-[#C84B1F] text-[10px] font-bold tracking-[0.25em] uppercase">
            <span className="w-6 h-0.5 bg-[#C84B1F]" />
            Battleground Mobile India
          </div>
          <p className="font-display text-[clamp(40px,7vw,72px)] leading-[0.9] text-[#F0EBE1] tracking-wide text-center">
            DROP. FIGHT. <span className="text-[#C84B1F]">DOMINATE.</span>
          </p>
          {/* Loading bar */}
          <div className="relative h-0.5 w-40 overflow-hidden bg-[#3A352E]">
            <div className="absolute inset-y-0 left-0 w-1/3 bg-[#C84B1F] animate-[loadbar_1s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
