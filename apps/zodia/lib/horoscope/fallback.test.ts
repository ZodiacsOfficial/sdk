import { describe, expect, it } from "vitest";
import { ZODIAC_SIGNS } from "@zodiacs/sdk/core";
import { computeAstroEvents } from "../astro/events";
import { renderFallbackSky } from "./fallback";

describe("renderFallbackSky", () => {
  const events = computeAstroEvents(new Date("2026-06-01T00:00:00.000Z"), 45);

  it("is deterministic for the same date", () => {
    const a = renderFallbackSky("2026-06-11", events);
    const b = renderFallbackSky("2026-06-11", events);
    expect(a).toEqual(b);
  });

  it("covers all twelve signs with bounded mood scores", () => {
    const sky = renderFallbackSky("2026-06-11", events);
    for (const sign of ZODIAC_SIGNS) {
      const reading = sky.signs[sign];
      expect(reading.vibe.length).toBeGreaterThan(0);
      expect(reading.moodScore).toBeGreaterThanOrEqual(0);
      expect(reading.moodScore).toBeLessThanOrEqual(100);
    }
  });

  it("never uses the blocked moon adjective anywhere", () => {
    const sky = renderFallbackSky("2026-06-11", events);
    const text = JSON.stringify(sky).toLowerCase();
    expect(text).not.toContain(["lu", "nar"].join(""));
  });

  it("varies copy between dates", () => {
    const a = renderFallbackSky("2026-06-11", events);
    const b = renderFallbackSky("2026-06-12", events);
    expect(JSON.stringify(a.signs)).not.toEqual(JSON.stringify(b.signs));
  });
});
