"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="icon"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  sky: (
    <>
      <path d="M12 3.5l1.8 4.7 4.7 1.8-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.8L12 3.5z" />
      <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
    </>
  ),
  exchange: (
    <>
      <path d="M4 8h13" />
      <path d="M14 4.5L17.5 8 14 11.5" />
      <path d="M20 16H7" />
      <path d="M10 12.5L6.5 16l3.5 3.5" />
    </>
  ),
  board: (
    <>
      <rect x="9.25" y="6" width="5.5" height="14" rx="1.4" />
      <rect x="3" y="11" width="5.5" height="9" rx="1.4" />
      <rect x="15.5" y="9" width="5.5" height="11" rx="1.4" />
    </>
  ),
  chat: (
    <>
      <path d="M21 11.5c0 4.1-4 7.5-9 7.5-1 0-2-.13-2.9-.38L4 20l1.2-3.4C3.8 15.3 3 13.5 3 11.5 3 7.4 7 4 12 4s9 3.4 9 7.5z" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8.2" r="3.7" />
      <path d="M4.8 20c.9-3.4 3.8-5.3 7.2-5.3s6.3 1.9 7.2 5.3" />
    </>
  )
};

const TABS = [
  { href: "/sky", icon: "sky", label: "Sky" },
  { href: "/exchange", icon: "exchange", label: "Exchange" },
  { href: "/board", icon: "board", label: "Board" },
  { href: "/chat", icon: "chat", label: "Chat" },
  { href: "/profile", icon: "profile", label: "Profile" }
] as const;

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} data-active={pathname.startsWith(tab.href)}>
          <Icon>{ICONS[tab.icon]}</Icon>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
