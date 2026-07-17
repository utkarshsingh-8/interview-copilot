"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Tab = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

const col = (a: boolean) => (a ? "#1c1830" : "#9a95ac");

const tabs: Tab[] = [
  {
    href: "/",
    label: "Home",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"
          stroke={col(a)}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/questions",
    label: "Q&A",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M8 10h8M8 14h5M6 4h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4V6a2 2 0 0 1 2-2Z"
          stroke={col(a)}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/mock",
    label: "Mock",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3a3.5 3.5 0 0 1 3.5 3.5v4a3.5 3.5 0 0 1-7 0v-4A3.5 3.5 0 0 1 12 3Z"
          stroke={col(a)}
          strokeWidth="2"
        />
        <path
          d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"
          stroke={col(a)}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/learn",
    label: "Learn",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 6.5C10 5 6 4.5 4 5v13c2-.5 6 0 8 1.5 2-1.5 6-2 8-1.5V5c-2-.5-6 0-8 1.5Zm0 0V19"
          stroke={col(a)}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/saved",
    label: "Saved",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z"
          stroke={col(a)}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/hub",
    label: "Hub",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M10 13a4 4 0 0 0 5.66 0l2-2a4 4 0 1 0-5.66-5.66l-1 1M14 11a4 4 0 0 0-5.66 0l-2 2a4 4 0 1 0 5.66 5.66l1-1"
          stroke={col(a)}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function TabBar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Instagram-style: hide when scrolling down, reveal when scrolling up.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 60) setHidden(false);
        else if (y > last + 8) setHidden(true);
        else if (y < last - 8) setHidden(false);
        last = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom pointer-events-none">
      <div
        className={`mx-auto max-w-md px-4 pb-3 transition-all duration-300 ease-out ${
          hidden
            ? "translate-y-[150%] opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        <div className="pointer-events-auto card-flat flex items-center justify-between px-1.5 py-2">
          {tabs.map((t) => {
            const active = isActive(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-label={t.label}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2.5 py-1.5 transition active:scale-90 ${
                  active ? "bg-[var(--violet-soft)]" : ""
                }`}
              >
                {t.icon(active)}
                <span
                  className={`text-[10px] font-semibold ${
                    active ? "text-[var(--ink)]" : "text-[var(--ink-faint)]"
                  }`}
                >
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
