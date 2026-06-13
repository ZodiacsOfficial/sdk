"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { CSSProperties } from "react";
import { SIGN_GLYPHS, ZODIAC_SIGNS } from "../../../lib/zodiac";
import type { ZodiacSign } from "../../../lib/zodiac";
import type { DailySkyPayload } from "../../../lib/horoscope/schema";
import { AppHeader, FooterNote } from "../../../components/AppHeader";
import { EventsCalendar } from "../../../components/sky/EventsCalendar";
import { HoroscopeCard } from "../../../components/sky/HoroscopeCard";
import { ShareButton } from "../../../components/ShareButton";
import { SignIcon } from "../../../components/SignIcon";
import { SIGN_COLORS } from "../../../components/signTheme";

const MOOD_CLASS: Record<string, string> = {
  radiant: "up",
  balanced: "flat",
  turbulent: "down"
};

export default function SkyPage() {
  const [sign, setSign] = useState<ZodiacSign>("aries");
  const { data, isLoading } = useQuery({
    queryKey: ["horoscope"],
    queryFn: async () => {
      const response = await fetch("/api/horoscope");
      if (!response.ok) {
        throw new Error("horoscope unavailable");
      }
      return (await response.json()) as DailySkyPayload;
    },
    staleTime: 5 * 60 * 1000
  });

  const today = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date());

  return (
    <>
      <AppHeader title="Today's Sky" subtitle={today} />

      <div className="sign-rail">
        {ZODIAC_SIGNS.map((s) => (
          <button
            key={s}
            data-active={s === sign}
            style={{ "--sign-accent": SIGN_COLORS[s] } as CSSProperties}
            onClick={() => setSign(s)}
          >
            <SignIcon sign={s} size={46} />
            {s}
          </button>
        ))}
      </div>

      {isLoading ? <div className="skeleton" style={{ height: 210 }} /> : null}

      {data ? (
        <>
          <HoroscopeCard sign={sign} reading={data.sky.signs[sign]} />

          <section className="card">
            <div className="row spread">
              <h2 style={{ margin: 0 }}>Cosmic weather</h2>
              <span
                className={`delta-pill ${MOOD_CLASS[data.sky.global.marketMood] ?? "flat"}`}
                style={{ textTransform: "capitalize" }}
              >
                {data.sky.global.marketMood}
              </span>
            </div>
            <p className="muted" style={{ marginBottom: 0 }}>
              {data.sky.global.blurb}
            </p>
          </section>

          <EventsCalendar events={data.events} />

          <div className="row" style={{ justifyContent: "center" }}>
            <ShareButton
              label="Share today's reading"
              text={`${SIGN_GLYPHS[sign]} ${sign} — ${data.sky.signs[sign].vibe}. Today's sky on Zodia.`}
              embedPath={`/share/horoscope/${sign}`}
            />
          </div>
        </>
      ) : null}

      <FooterNote>Entertainment only. Never financial advice.</FooterNote>
    </>
  );
}
