"use client";

import type { InputHTMLAttributes } from "react";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function AuthField({ label, id, ...props }: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#B8A68A]"
      >
        {label}
      </label>
      <input
        id={id}
        className="w-full bg-[#232019] border border-[#3A352D] text-[#F0EBE1] text-sm px-4 py-3 outline-none transition-colors placeholder:text-[#6B6459] focus:border-[#C84B1F]"
        {...props}
      />
    </div>
  );
}
