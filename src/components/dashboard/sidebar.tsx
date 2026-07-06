"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Trophy, Swords, Settings, LogOut } from "lucide-react";
import { useTransitionNavigate } from "@/components/transition/page-transition";

const NAV = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Team", href: "/dashboard/team", icon: Users },
  { label: "Tournaments", href: "/dashboard/tournaments", icon: Trophy },
  { label: "Matches", href: "/dashboard/matches", icon: Swords },
];

export default function Sidebar() {
  const pathname = usePathname();
  const navigate = useTransitionNavigate();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-[#2A251E] bg-[#1C1A17]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-[#2A251E] px-6 py-6">
        <span className="h-6 w-0.5 bg-[#C84B1F]" />
        <div className="leading-none">
          <p className="font-display text-2xl tracking-wide text-[#F0EBE1]">
            BGMI ARENA
          </p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.3em] text-[#8A8175]">
            Command Center
          </p>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-6">
        <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.3em] text-[#6B6459]">
          Menu
        </p>
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 px-3 py-3 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
                active
                  ? "bg-[#232019] text-[#F0EBE1]"
                  : "text-[#8A8175] hover:bg-[#232019] hover:text-[#F0EBE1]"
              }`}
            >
              <span
                className={`absolute left-0 top-0 h-full w-0.5 transition-colors ${
                  active
                    ? "bg-[#C84B1F]"
                    : "bg-transparent group-hover:bg-[#3A352D]"
                }`}
              />
              <Icon size={18} className={active ? "text-[#C84B1F]" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: settings + logout */}
      <div className="flex flex-col gap-1 border-t border-[#2A251E] px-3 py-4">
        <Link
          href="/dashboard/settings"
          className={`group relative flex items-center gap-3 px-3 py-3 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
            isActive("/dashboard/settings")
              ? "bg-[#232019] text-[#F0EBE1]"
              : "text-[#8A8175] hover:bg-[#232019] hover:text-[#F0EBE1]"
          }`}
        >
          <span
            className={`absolute left-0 top-0 h-full w-0.5 transition-colors ${
              isActive("/dashboard/settings")
                ? "bg-[#C84B1F]"
                : "bg-transparent group-hover:bg-[#3A352D]"
            }`}
          />
          <Settings
            size={18}
            className={isActive("/dashboard/settings") ? "text-[#C84B1F]" : ""}
          />
          Settings
        </Link>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="flex items-center gap-3 px-3 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#8A8175] transition-colors hover:bg-[#C84B1F] hover:text-[#F0EBE1]"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
