import { describe, expect, it } from "vitest";
import {
  computeAstroEvents,
  findMoonPhases,
  findRetrogradeWindows,
  findSunIngresses
} from "./events";

const YEAR_START = new Date("2026-01-01T00:00:00.000Z");

describe("findRetrogradeWindows", () => {
  it("finds 3-4 Mercury retrograde windows per year, each roughly three weeks", () => {
    const windows = findRetrogradeWindows("mercury", YEAR_START, 365);
    expect(windows.length).toBeGreaterThanOrEqual(3);
    expect(windows.length).toBeLessThanOrEqual(4);
    for (const window of windows) {
      const days = (Date.parse(window.endsAt) - Date.parse(window.startsAt)) / 86400000;
      expect(days).toBeGreaterThan(15);
      expect(days).toBeLessThan(30);
    }
  });

  it("orders windows chronologically", () => {
    const windows = findRetrogradeWindows("mercury", YEAR_START, 365);
    for (let i = 1; i < windows.length; i += 1) {
      expect(Date.parse(windows[i]!.startsAt)).toBeGreaterThan(Date.parse(windows[i - 1]!.endsAt));
    }
  });
});

describe("findMoonPhases", () => {
  it("finds 12-14 new moons in a year", () => {
    const phases = findMoonPhases(YEAR_START, 365).filter((event) => event.phase === "new");
    expect(phases.length).toBeGreaterThanOrEqual(12);
    expect(phases.length).toBeLessThanOrEqual(14);
  });

  it("cycles through quarters in order", () => {
    const phases = findMoonPhases(YEAR_START, 60);
    const order = ["new", "first-quarter", "full", "third-quarter"];
    for (let i = 1; i < phases.length; i += 1) {
      const previousIndex = order.indexOf(phases[i - 1]!.phase);
      expect(phases[i]!.phase).toBe(order[(previousIndex + 1) % 4]);
    }
  });
});

describe("findSunIngresses", () => {
  it("finds 12-13 ingresses in a year covering all signs", () => {
    const ingresses = findSunIngresses(YEAR_START, 366);
    expect(ingresses.length).toBeGreaterThanOrEqual(12);
    expect(ingresses.length).toBeLessThanOrEqual(13);
    expect(new Set(ingresses.map((event) => event.sign)).size).toBe(12);
  });

  it("places the Aries ingress near the March equinox", () => {
    const ingresses = findSunIngresses(YEAR_START, 365);
    const aries = ingresses.find((event) => event.sign === "aries");
    expect(aries).toBeDefined();
    const at = new Date(aries!.at);
    expect(at.getUTCMonth()).toBe(2);
    expect(at.getUTCDate()).toBeGreaterThanOrEqual(18);
    expect(at.getUTCDate()).toBeLessThanOrEqual(22);
  });
});

describe("computeAstroEvents", () => {
  it("produces a digest bounded by the requested window", () => {
    const digest = computeAstroEvents(YEAR_START, 45);
    expect(Date.parse(digest.windowEnd) - Date.parse(digest.windowStart)).toBe(45 * 86400000);
    for (const phase of digest.moonPhases) {
      expect(Date.parse(phase.at)).toBeGreaterThanOrEqual(Date.parse(digest.windowStart));
      expect(Date.parse(phase.at)).toBeLessThanOrEqual(Date.parse(digest.windowEnd));
    }
  });
});
