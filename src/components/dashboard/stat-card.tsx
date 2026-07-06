import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
}

export default function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="relative border border-[#2A251E] bg-[#232019] p-6">
      <span className="absolute left-0 top-0 h-full w-0.5 bg-[#C84B1F]" />
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8A8175]">
          {label}
        </p>
        <Icon size={18} className="text-[#6B6459]" />
      </div>
      <p className="mt-4 font-display text-4xl tracking-wide text-[#F0EBE1]">
        {value}
      </p>
      {detail ? <p className="mt-1 text-xs text-[#8A8175]">{detail}</p> : null}
    </div>
  );
}
