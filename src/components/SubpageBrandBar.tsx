"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SubpageBrandBar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  if (isHome) return null;

  return (
    <Link href="/" className="floating-home" aria-label="Go to homepage">
      <svg width="16" height="16" viewBox="0 0 36 36" aria-hidden>
        <defs>
          <linearGradient id="fh" x1="0" x2="1">
            <stop offset="0" stopColor="#7c5cff" />
            <stop offset="1" stopColor="#00d4ff" />
          </linearGradient>
        </defs>
        <rect width="36" height="36" rx="8" fill="url(#fh)" />
        <path d="M11 25V11l10 7-10 7z" fill="#fff" opacity="0.95" />
      </svg>
      <span className="brand-name">Streamsite</span>
    </Link>
  );
}