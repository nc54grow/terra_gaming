"use client";

import type { ReactNode } from "react";
import Link from "next/link";

interface AuthShellProps {
  eyebrow: string;
  title: ReactNode;
  blurb: string;
  children: ReactNode;
}

export default function AuthShell({
  eyebrow,
  title,
  blurb,
  children,
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen w-full overflow-hidden relative bg-[#1C1A17] font-sans">
      {/* Left branding panel */}
      <div
        className="hidden md:flex w-[45%] min-h-screen bg-[#F0EBE1] relative flex-col justify-center px-[52px] py-[60px] z-10"
        style={{ clipPath: "polygon(0 0, 100% 0, 88% 100%, 0 100%)" }}
      >
        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(139,120,96,0.07) 3px, rgba(139,120,96,0.07) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(139,120,96,0.07) 3px, rgba(139,120,96,0.07) 4px)`,
            }}
          />
        </div>

        <div className="relative z-10">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[#C84B1F] text-[10px] font-bold tracking-[0.25em] uppercase mb-6"
          >
            <span className="w-6 h-0.5 bg-[#C84B1F]" />
            {eyebrow}
          </Link>

          <h1 className="font-display text-[clamp(52px,5.5vw,76px)] leading-[0.92] text-[#1C1A17] mb-7 tracking-wide">
            {title}
          </h1>

          <p className="text-sm leading-relaxed text-[#4A4540] max-w-[340px]">
            {blurb}
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 min-h-screen flex items-center justify-center px-6 py-12 relative">
        {/* Grid on dark side */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(240,235,225,0.03) 3px, rgba(240,235,225,0.03) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(240,235,225,0.03) 3px, rgba(240,235,225,0.03) 4px)`,
            }}
          />
        </div>
        <div className="relative z-10 w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
