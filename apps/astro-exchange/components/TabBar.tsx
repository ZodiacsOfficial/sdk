"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/sky", icon: "✦", label: "Sky" },
  { href: "/exchange", icon: "⇄", label: "Exchange" },
  { href: "/board", icon: "🏆", label: "Board" },
  { href: "/chat", icon: "💬", label: "Chat" },
  { href: "/profile", icon: "👤", label: "Profile" }
] as const;

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} data-active={pathname.startsWith(tab.href)}>
          <span className="icon">{tab.icon}</span>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
