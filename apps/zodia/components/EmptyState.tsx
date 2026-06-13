import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  hint
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-title">{title}</p>
      {hint ? <p className="empty-state-hint">{hint}</p> : null}
    </div>
  );
}
