"use client";

import { SIGN_GLYPHS } from "../../lib/zodiac";
import type { AstroEventsDigest } from "../../lib/astro/events";

interface CalendarItem {
  readonly at: number;
  readonly label: string;
}

function formatWhen(at: number): string {
  const days = Math.round((at - Date.now()) / 86400000);
  if (days <= 0) {
    return "today";
  }
  if (days === 1) {
    return "tomorrow";
  }
  return `in ${days}d`;
}

const MOON_LABEL: Record<string, string> = {
  new: "New moon",
  "first-quarter": "First-quarter moon",
  full: "Full moon",
  "third-quarter": "Third-quarter moon"
};

export function EventsCalendar({ events }: { events: AstroEventsDigest }) {
  const now = Date.now();
  const items: CalendarItem[] = [];

  for (const window of events.retrogrades) {
    const planet = window.planet[0]!.toUpperCase() + window.planet.slice(1);
    const start = Date.parse(window.startsAt);
    const end = Date.parse(window.endsAt);
    if (start >= now) {
      items.push({ at: start, label: `${planet} stations retrograde` });
    }
    if (end >= now) {
      items.push({ at: end, label: `${planet} stations direct` });
    }
  }
  for (const phase of events.moonPhases) {
    const at = Date.parse(phase.at);
    if (at >= now) {
      items.push({ at, label: MOON_LABEL[phase.phase] ?? phase.phase });
    }
  }
  for (const ingress of events.ingresses) {
    const at = Date.parse(ingress.at);
    if (at >= now) {
      items.push({ at, label: `Sun enters ${SIGN_GLYPHS[ingress.sign]} ${ingress.sign}` });
    }
  }

  items.sort((a, b) => a.at - b.at);

  return (
    <section className="card">
      <h2>Upcoming sky events</h2>
      <div style={{ display: "grid", gap: 8 }}>
        {items.slice(0, 6).map((item) => (
          <div key={`${item.at}-${item.label}`} className="row spread">
            <span style={{ fontSize: 14 }}>{item.label}</span>
            <span className="muted">{formatWhen(item.at)}</span>
          </div>
        ))}
        {items.length === 0 ? <p className="muted">A quiet stretch of sky.</p> : null}
      </div>
    </section>
  );
}
