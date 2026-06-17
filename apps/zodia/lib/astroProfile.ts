import { ZODIAC_SIGNS, getZodiacToken } from "@zodiacs/sdk/core";
import type { ZodiacElement, ZodiacModality, ZodiacSign } from "@zodiacs/sdk/core";

export type RiskMode = "grounded" | "balanced" | "chaotic";

export interface BirthChartDraft {
  readonly birthDate?: string;
  readonly birthTime?: string;
  readonly birthPlace?: string;
  readonly moonSign?: ZodiacSign | "";
  readonly risingSign?: ZodiacSign | "";
}

export interface ResolvedBirthChart {
  readonly birthDate: string;
  readonly birthTime: string;
  readonly birthPlace: string;
  readonly sunSign: ZodiacSign | null;
  readonly moonSign: ZodiacSign | null;
  readonly risingSign: ZodiacSign | null;
}

export interface AuraProfile {
  readonly title: string;
  readonly subtitle: string;
  readonly dominantElement: ZodiacElement;
  readonly dominantModality: ZodiacModality;
  readonly marketTemperament: string;
  readonly about: string;
  readonly strengths: readonly string[];
  readonly shadow: string;
}

export interface ZodiaBasketEntry {
  readonly sign: ZodiacSign;
  readonly ticker: string;
  readonly allocation: number;
  readonly reason: string;
}

const ELEMENT_SIGNS: Record<ZodiacElement, readonly ZodiacSign[]> = {
  fire: ["aries", "leo", "sagittarius"],
  earth: ["taurus", "virgo", "capricorn"],
  air: ["gemini", "libra", "aquarius"],
  water: ["cancer", "scorpio", "pisces"]
};

const MODALITY_SIGNS: Record<ZodiacModality, readonly ZodiacSign[]> = {
  cardinal: ["aries", "cancer", "libra", "capricorn"],
  fixed: ["taurus", "leo", "scorpio", "aquarius"],
  mutable: ["gemini", "virgo", "sagittarius", "pisces"]
};

const ELEMENT_AURA: Record<
  ZodiacElement,
  {
    readonly title: string;
    readonly temperament: string;
    readonly about: string;
    readonly strengths: readonly string[];
    readonly shadow: string;
  }
> = {
  fire: {
    title: "Solar Fire Aura",
    temperament: "Fast conviction, bright entries, impatient exits.",
    about:
      "You read momentum as a living signal. Zodia becomes a stage for instinct, visibility, and first-move energy.",
    strengths: ["Conviction", "Presence", "Initiation"],
    shadow: "Can chase heat before the thesis has roots."
  },
  earth: {
    title: "Mineral Earth Aura",
    temperament: "Slow thesis, high selectivity, patient accumulation.",
    about:
      "You want symbols to earn their place. Zodia becomes a shelf for value, pattern, and durable taste.",
    strengths: ["Patience", "Discernment", "Holding power"],
    shadow: "Can wait so long that the window becomes history."
  },
  air: {
    title: "Mercury Air Aura",
    temperament: "Narrative driven, socially aware, quick to rotate attention.",
    about:
      "You trade meaning before you trade size. Zodia becomes a live map of stories, memes, and social weather.",
    strengths: ["Pattern reading", "Adaptability", "Signal discovery"],
    shadow: "Can over-index on chatter and miss the quiet setup."
  },
  water: {
    title: "Tidal Water Aura",
    temperament: "Intuitive timing, deep attachment, mood-sensitive risk.",
    about:
      "You feel liquidity as atmosphere. Zodia becomes a mirror for memory, belonging, and hidden conviction.",
    strengths: ["Intuition", "Depth", "Emotional timing"],
    shadow: "Can hold the feeling after the market has changed."
  }
};

const MODALITY_COPY: Record<ZodiacModality, string> = {
  cardinal: "moves first",
  fixed: "holds the line",
  mutable: "adapts mid-flight"
};

const RISK_COPY: Record<RiskMode, string> = {
  grounded: "grounded",
  balanced: "balanced",
  chaotic: "high-voltage"
};

function isValidSign(value: string | undefined): value is ZodiacSign {
  return Boolean(value && (ZODIAC_SIGNS as readonly string[]).includes(value));
}

function signElement(sign: ZodiacSign): ZodiacElement {
  return getZodiacToken(sign).element;
}

function signModality(sign: ZodiacSign): ZodiacModality {
  return getZodiacToken(sign).modality;
}

function signName(sign: ZodiacSign): string {
  return getZodiacToken(sign).name;
}

function parseMonthDay(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(date);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return month * 100 + day;
}

export function sunSignFromBirthDate(date: string): ZodiacSign | null {
  const md = parseMonthDay(date);
  if (!md) {
    return null;
  }

  if (md >= 321 && md <= 419) return "aries";
  if (md >= 420 && md <= 520) return "taurus";
  if (md >= 521 && md <= 620) return "gemini";
  if (md >= 621 && md <= 722) return "cancer";
  if (md >= 723 && md <= 822) return "leo";
  if (md >= 823 && md <= 922) return "virgo";
  if (md >= 923 && md <= 1022) return "libra";
  if (md >= 1023 && md <= 1121) return "scorpio";
  if (md >= 1122 && md <= 1221) return "sagittarius";
  if (md >= 1222 || md <= 119) return "capricorn";
  if (md >= 120 && md <= 218) return "aquarius";
  return "pisces";
}

export function resolveBirthChart(draft: BirthChartDraft): ResolvedBirthChart {
  const birthDate = draft.birthDate?.trim() ?? "";
  return {
    birthDate,
    birthTime: draft.birthTime?.trim() ?? "",
    birthPlace: draft.birthPlace?.trim() ?? "",
    sunSign: birthDate ? sunSignFromBirthDate(birthDate) : null,
    moonSign: isValidSign(draft.moonSign) ? draft.moonSign : null,
    risingSign: isValidSign(draft.risingSign) ? draft.risingSign : null
  };
}

function scorePlacement(
  scores: Map<ZodiacSign, number>,
  sign: ZodiacSign | null,
  points: number
) {
  if (!sign) {
    return;
  }
  scores.set(sign, (scores.get(sign) ?? 0) + points);
}

function dominantKey<T extends string>(scores: Map<T, number>, fallback: T): T {
  let dominant = fallback;
  let best = Number.NEGATIVE_INFINITY;
  for (const [key, value] of scores) {
    if (value > best) {
      dominant = key;
      best = value;
    }
  }
  return dominant;
}

export function buildAuraProfile(
  chart: ResolvedBirthChart,
  riskMode: RiskMode,
  heldSigns: readonly ZodiacSign[] = []
): AuraProfile | null {
  const placements = [chart.sunSign, chart.moonSign, chart.risingSign].filter(
    (sign): sign is ZodiacSign => Boolean(sign)
  );
  if (placements.length === 0 && heldSigns.length === 0) {
    return null;
  }

  const elementScores = new Map<ZodiacElement, number>([
    ["fire", 0],
    ["earth", 0],
    ["air", 0],
    ["water", 0]
  ]);
  const modalityScores = new Map<ZodiacModality, number>([
    ["cardinal", 0],
    ["fixed", 0],
    ["mutable", 0]
  ]);

  const addSign = (sign: ZodiacSign, weight: number) => {
    const element = signElement(sign);
    const modality = signModality(sign);
    elementScores.set(element, (elementScores.get(element) ?? 0) + weight);
    modalityScores.set(modality, (modalityScores.get(modality) ?? 0) + weight);
  };

  if (chart.sunSign) addSign(chart.sunSign, 4);
  if (chart.moonSign) addSign(chart.moonSign, 3);
  if (chart.risingSign) addSign(chart.risingSign, 3);
  for (const sign of heldSigns) {
    addSign(sign, 1);
  }

  const dominantElement = dominantKey(elementScores, chart.sunSign ? signElement(chart.sunSign) : "fire");
  const dominantModality = dominantKey(
    modalityScores,
    chart.sunSign ? signModality(chart.sunSign) : "cardinal"
  );
  const elementAura = ELEMENT_AURA[dominantElement];
  const sunLabel = chart.sunSign ? signName(chart.sunSign) : "wallet-led";
  const heldLabel =
    heldSigns.length > 0
      ? `${heldSigns.length} verified shelf sign${heldSigns.length === 1 ? "" : "s"}`
      : "no verified shelf yet";

  return {
    title: elementAura.title,
    subtitle: `${sunLabel} chart signal · ${RISK_COPY[riskMode]} mode · ${heldLabel}`,
    dominantElement,
    dominantModality,
    marketTemperament: `${elementAura.temperament} This aura ${MODALITY_COPY[dominantModality]}.`,
    about: elementAura.about,
    strengths: elementAura.strengths,
    shadow: elementAura.shadow
  };
}

function addReason(reasons: Map<ZodiacSign, Set<string>>, sign: ZodiacSign, reason: string) {
  const existing = reasons.get(sign) ?? new Set<string>();
  existing.add(reason);
  reasons.set(sign, existing);
}

function addScore(
  scores: Map<ZodiacSign, number>,
  reasons: Map<ZodiacSign, Set<string>>,
  sign: ZodiacSign,
  points: number,
  reason: string
) {
  scores.set(sign, (scores.get(sign) ?? 0) + points);
  addReason(reasons, sign, reason);
}

function normalizeAllocations(entries: readonly { sign: ZodiacSign; score: number }[]) {
  const total = entries.reduce((sum, entry) => sum + entry.score, 0);
  if (total <= 0) {
    return [];
  }
  const rounded = entries.map((entry) => ({
    sign: entry.sign,
    allocation: Math.max(1, Math.round((entry.score / total) * 100))
  }));
  const delta = 100 - rounded.reduce((sum, entry) => sum + entry.allocation, 0);
  if (rounded[0]) {
    rounded[0] = { ...rounded[0], allocation: rounded[0].allocation + delta };
  }
  return rounded;
}

export function buildZodiaBasket(
  chart: ResolvedBirthChart,
  riskMode: RiskMode,
  heldSigns: readonly ZodiacSign[] = []
): readonly ZodiaBasketEntry[] {
  if (!chart.sunSign && !chart.moonSign && !chart.risingSign && heldSigns.length === 0) {
    return [];
  }

  const scores = new Map<ZodiacSign, number>();
  const reasons = new Map<ZodiacSign, Set<string>>();

  if (chart.sunSign) {
    addScore(scores, reasons, chart.sunSign, 40, "Sun sign anchor");
    for (const sign of ELEMENT_SIGNS[signElement(chart.sunSign)]) {
      if (sign !== chart.sunSign) {
        addScore(scores, reasons, sign, 8, `${signElement(chart.sunSign)} element resonance`);
      }
    }
  }
  if (chart.moonSign) {
    addScore(scores, reasons, chart.moonSign, 24, "Moon sign mood");
  }
  if (chart.risingSign) {
    addScore(scores, reasons, chart.risingSign, 20, "Rising sign interface");
  }
  for (const sign of heldSigns) {
    addScore(scores, reasons, sign, 6, "verified shelf context");
  }

  const riskBoosts: Record<RiskMode, readonly ZodiacSign[]> = {
    grounded: ELEMENT_SIGNS.earth,
    balanced: chart.sunSign ? MODALITY_SIGNS[signModality(chart.sunSign)] : ["libra", "virgo", "taurus"],
    chaotic: ["aries", "gemini", "sagittarius", "aquarius"]
  };
  for (const sign of riskBoosts[riskMode]) {
    addScore(scores, reasons, sign, riskMode === "balanced" ? 5 : 7, `${RISK_COPY[riskMode]} mode`);
  }

  const scored = ZODIAC_SIGNS.map((sign) => ({ sign, score: scores.get(sign) ?? 0 }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || ZODIAC_SIGNS.indexOf(a.sign) - ZODIAC_SIGNS.indexOf(b.sign))
    .slice(0, 4);

  return normalizeAllocations(scored).map((entry) => {
    const token = getZodiacToken(entry.sign);
    return {
      sign: entry.sign,
      ticker: token.ticker,
      allocation: entry.allocation,
      reason: Array.from(reasons.get(entry.sign) ?? ["symbolic resonance"]).slice(0, 2).join(" · ")
    };
  });
}

export function auraShareText(aura: AuraProfile, basket: readonly ZodiaBasketEntry[]): string {
  const basketText = basket
    .map((entry) => `$${entry.ticker} ${entry.allocation}%`)
    .join(" / ");
  return `${aura.title} on Zodia. ${aura.marketTemperament} Cosmic Basket: ${basketText || "forming"}. Entertainment only.`;
}
