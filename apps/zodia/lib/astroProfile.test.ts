import { describe, expect, it } from "vitest";
import {
  auraShareText,
  buildAuraProfile,
  buildZodiaBasket,
  resolveBirthChart,
  sunSignFromBirthDate
} from "./astroProfile";

describe("astro profile", () => {
  it("resolves sun signs from birth date boundaries", () => {
    expect(sunSignFromBirthDate("1992-03-20")).toBe("pisces");
    expect(sunSignFromBirthDate("1992-03-21")).toBe("aries");
    expect(sunSignFromBirthDate("1992-12-21")).toBe("sagittarius");
    expect(sunSignFromBirthDate("1992-12-22")).toBe("capricorn");
    expect(sunSignFromBirthDate("1992-01-19")).toBe("capricorn");
    expect(sunSignFromBirthDate("1992-01-20")).toBe("aquarius");
    expect(sunSignFromBirthDate("not-a-date")).toBeNull();
    expect(sunSignFromBirthDate("1992-02-31")).toBeNull();
  });

  it("normalizes a draft chart without pretending optional placements were computed", () => {
    expect(
      resolveBirthChart({
        birthDate: "1992-08-08",
        birthTime: "08:30",
        birthPlace: "Bangkok",
        moonSign: "libra",
        risingSign: ""
      })
    ).toMatchObject({
      sunSign: "leo",
      moonSign: "libra",
      risingSign: null
    });
  });

  it("builds an aura from chart placements and verified shelf context", () => {
    const chart = resolveBirthChart({
      birthDate: "1992-08-08",
      moonSign: "aries",
      risingSign: "sagittarius"
    });
    const aura = buildAuraProfile(chart, "chaotic", ["leo", "libra"]);

    expect(aura).toMatchObject({
      title: "Solar Fire Aura",
      dominantElement: "fire",
      dominantModality: "fixed"
    });
    expect(aura?.subtitle).toContain("2 verified shelf signs");
  });

  it("builds a symbolic basket that sums to 100", () => {
    const chart = resolveBirthChart({
      birthDate: "1992-08-08",
      moonSign: "libra",
      risingSign: "taurus"
    });
    const basket = buildZodiaBasket(chart, "grounded", ["leo"]);

    expect(basket.length).toBeGreaterThan(0);
    expect(basket.reduce((sum, entry) => sum + entry.allocation, 0)).toBe(100);
    expect(basket.map((entry) => entry.sign)).toContain("leo");
    expect(basket.map((entry) => entry.sign)).toContain("taurus");
  });

  it("waits for chart or shelf signal before forming a basket", () => {
    const chart = resolveBirthChart({});
    expect(buildZodiaBasket(chart, "balanced", [])).toEqual([]);
  });

  it("keeps share text framed as entertainment", () => {
    const chart = resolveBirthChart({ birthDate: "1992-08-08" });
    const aura = buildAuraProfile(chart, "balanced", []);
    expect(aura).not.toBeNull();
    const shareText = auraShareText(aura!, buildZodiaBasket(chart, "balanced", []));

    expect(shareText).toContain("Cosmic Basket");
    expect(shareText).toContain("Entertainment only");
  });
});
