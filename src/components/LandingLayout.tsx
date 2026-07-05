"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { TransitionLink } from "./TransitionLink";

interface HeroPanelProps {
  showActions?: boolean;
  children?: ReactNode;
}

export default function Home({ showActions = true, children }: HeroPanelProps) {
  return (
    <div className="flex min-h-screen w-full overflow-hidden relative bg-[#1C1A17] font-sans">
      <div
        className="w-[45%] min-h-screen bg-[#F0EBE1] relative flex flex-col justify-center px-[52px] py-[60px] z-10"
        style={{
          clipPath: "polygon(0 0, 100% 0, 88% 100%, 0 100%)",
        }}
      >
        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 3px,
                rgba(139,120,96,0.07) 3px,
                rgba(139,120,96,0.07) 4px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 3px,
                rgba(139,120,96,0.07) 3px,
                rgba(139,120,96,0.07) 4px
              )
            `,
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 text-[#C84B1F] text-[10px] font-bold tracking-[0.25em] uppercase mb-6">
            <span className="w-6 h-0.5 bg-[#C84B1F]" />
            Battleground Mobile India
          </div>

          <h1 className="font-['Bebas_Neue'] text-[clamp(52px,5.5vw,76px)] leading-[0.92] text-[#1C1A17] mb-7">
            DROP.
            <br />
            FIGHT.
            <br />
            <span className="text-[#C84B1F]">DOMINATE.</span>
          </h1>

          <p className="text-sm leading-relaxed text-[#4A4540] max-w-[340px] mb-10">
            India's premier competitive BGMI platform. Daily squad tournaments,
            solo ranked matches, and live prize pools.
          </p>

          {showActions && (
            <div className="flex gap-3.5">
              <TransitionLink href="/register">
                <button
                  className="bg-[#C84B1F] text-white px-8 py-3.5 text-xs font-bold uppercase"
                  style={{
                    clipPath: "polygon(0 0,100% 0,94% 100%,0 100%)",
                  }}
                >
                  Get Started
                </button>
              </TransitionLink>

              <TransitionLink href="/login">
                <button className="text-[#4A4540] px-6 py-3.5 text-xs font-semibold uppercase border-b border-[#B8A68A]">
                  Sign In
                </button>
              </TransitionLink>
            </div>
          )}

          {children}
        </div>
      </div>

      {/* <RightPanel /> */}
    </div>
  );
}
