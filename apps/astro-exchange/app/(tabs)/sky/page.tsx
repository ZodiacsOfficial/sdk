"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SIGN_GLYPHS, ZODIAC_SIGNS } from "../../../lib/zodiac";
import type { ZodiacSign } from "../../../lib/zodiac";
import type { DailySkyPayload } from "../../../lib/horoscope/schema";
import { EventsCalendar } from "../../../components/sky/EventsCalendar";
import { HoroscopeCard } from "../../../components/sky/HoroscopeCard";
import { ShareButton } from "../../../components/ShareButton";

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

  return (
    <>
      <section className="card">
        <h2>{data ? data.sky.global.headline : "Today's sky"}</h2>
        <p className="muted">
          {isLoading ? "Reading the sky…" : (data?.sky.global.blurb ?? "The sky is shy today.")}
        </p>
        {data ? <p className="muted">Cosmic weather: {data.sky.global.marketMood}</p> : null}
      </section>

      <div className="chips">
        {ZODIAC_SIGNS.map((s) => (
          <button key={s} className="chip" data-active={s === sign} onClick={() => setSign(s)}>
            {SIGN_GLYPHS[s]} {s}
          </button>
        ))}
      </div>

      {data ? (
        <>
          <HoroscopeCard sign={sign} reading={data.sky.signs[sign]} />
          <div className="row">
            <ShareButton
              label="Share today's reading"
              text={`${SIGN_GLYPHS[sign]} ${sign} — ${data.sky.signs[sign].vibe}. Today's sky on Zodiacs Astro Exchange.`}
              embedPath={`/share/horoscope/${sign}`}
            />
          </div>
          <EventsCalendar events={data.events} />
        </>
      ) : null}

      <p className="disclaimer">
        Horoscopes and cosmic weather are entertainment only — never financial advice and never a
        prediction of any market outcome.
      </p>
    </>
  );
}
