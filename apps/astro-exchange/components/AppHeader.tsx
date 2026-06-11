import type { ReactNode } from "react";

export function AppHeader({
  title,
  subtitle,
  trailing
}: {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}) {
  return (
    <header className="app-header">
      <div>
        <span className="eyebrow">Zodia</span>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {trailing ? <div>{trailing}</div> : null}
    </header>
  );
}

export function FooterNote({ children }: { children: ReactNode }) {
  return <p className="footer-note">{children}</p>;
}

export function SkeletonRows({ count, height = 64 }: { count: number; height?: number }) {
  return (
    <div className="list" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}
