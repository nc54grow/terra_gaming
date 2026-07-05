// components/TransitionLink.tsx
"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useTransitionNavigate } from "@/components/transition/page-transition";

interface TransitionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  [key: string]: any;
}

export function TransitionLink({
  href,
  children,
  className,
  ...props
}: TransitionLinkProps) {
  const navigate = useTransitionNavigate();

  return (
    <Link
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigate(href);
      }}
      className={className}
      {...props}
    >
      {children}
    </Link>
  );
}
