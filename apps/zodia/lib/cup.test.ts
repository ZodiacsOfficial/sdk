import { describe, expect, it } from "vitest";
import { cupSeasonInfo, previousSeason, seasonKeyFor, sortAndPadStandings } from "./cup";

describe("cupSeasonInfo", () => {
  it("keys a mid-year season by year and sign", () => {
    const info = cupSeasonInfo(new Date("2026-06-11T12:00:00.000Z"));
    expect(info.key).toBe("2026-gemini");
    expect(info.sign).toBe("gemini");
    expect(info.endDate).toBe("2026-06-20");
    expect(info.daysLeft).toBeGreaterThanOrEqual(9);
    expect(info.daysLeft).toBeLessThanOrEqual(10);
  });

  it("keys the year-spanning capricorn season by its start year", () => {
    const january = cupSeasonInfo(new Date("2026-01-05T00:00:00.000Z"));
    expect(january.key).toBe("2025-capricorn");
    const december = cupSeasonInfo(new Date("2025-12-23T00:00:00.000Z"));
    expect(december.key).toBe("2025-capricorn");
  });

  it("counts down to zero on the final day", () => {
    const lastDay = cupSeasonInfo(new Date("2026-06-20T12:00:00.000Z"));
    expect(lastDay.daysLeft).toBeLessThanOrEqual(1);
    expect(lastDay.daysLeft).toBeGreaterThanOrEqual(0);
  });
});

describe("previousSeason", () => {
  it("steps back across a normal boundary", () => {
    const previous = previousSeason(new Date("2026-06-11T00:00:00.000Z"));
    expect(previous.sign).toBe("taurus");
    expect(seasonKeyFor(previous)).toBe("2026-taurus");
  });

  it("steps back across the new year into sagittarius", () => {
    const previous = previousSeason(new Date("2026-01-05T00:00:00.000Z"));
    expect(previous.sign).toBe("sagittarius");
    expect(seasonKeyFor(previous)).toBe("2025-sagittarius");
  });
});

describe("sortAndPadStandings", () => {
  it("pads to all twelve signs and sorts by volume", () => {
    const standings = sortAndPadStandings({ leo: 100, aries: 250.555 });
    expect(standings).toHaveLength(12);
    expect(standings[0]).toEqual({ sign: "aries", volumeUsd: 250.56 });
    expect(standings[1]).toEqual({ sign: "leo", volumeUsd: 100 });
    expect(standings.filter((entry) => entry.volumeUsd === 0)).toHaveLength(10);
  });
});
