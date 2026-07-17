"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  center?: boolean;
};

const stroke = (active: boolean) => (active ? "#fff" : "#9a95ac");

const tabs: Tab[] = [
  {
    href: "/",
    label: "Home",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"
          stroke={a ? "#1c1830" : "#9a95ac"}
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
          stroke={a ? "#1c1830" : "#9a95ac"}
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
    center: true,
    icon: (a) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3a4 4 0 0 1 4 4v3a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4Z"
          stroke={stroke(a)}
          strokeWidth="2"
        />
        <path
          d="M5 11a7 7 0 0 0 14 0M12 18v3"
          stroke={stroke(a)}
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
          stroke={a ? "#1c1830" : "#9a95ac"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3.5" stroke={a ? "#1c1830" : "#9a95ac"} strokeWidth="2" />
        <path
          d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5"
          stroke={a ? "#1c1830" : "#9a95ac"}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function TabBar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom pointer-events-none">
      <div className="mx-auto max-w-md px-5 pb-3">
        <div className="pointer-events-auto card-flat flex items-center justify-between px-3 py-2.5">
          {tabs.map((t) => {
            const active = isActive(t.href);
            if (t.center) {
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-label={t.label}
                  className={`grid place-items-center h-14 w-14 rounded-full -mt-6 shadow-[var(--shadow)] transition active:scale-95 ${
                    active ? "bg-[var(--violet)]" : "bg-[var(--ink)]"
                  }`}
                >
                  {t.icon(true)}
                </Link>
              );
            }
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-label={t.label}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition active:scale-95"
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
